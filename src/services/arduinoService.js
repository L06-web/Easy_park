const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const supabase = require('../config/supabase');

const logger = require('../../logger'); 

const initArduino = () => {
    const port = new SerialPort({ path: 'COM7', baudRate: 9600, autoOpen: false });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.open((err) => {
        if (!err) return;

        logger.error('Não foi possível abrir a Porta Serial', {
            service: 'hardware-arduino',
            context: { erro: err.message, porta: 'COM7' }
        });
        console.error('❌ Não foi possível abrir a Porta Serial:', err.message);
    });

    port.on('open', () => {
        logger.info('Conexão Serial estabelecida com sucesso', {
            service: 'hardware-arduino',
            context: { porta: 'COM7', baudRate: 9600 }
        });
        console.log('🔌 Conexão Serial estabelecida na COM7');
    });

    parser.on('data', async (data) => {
        try {
            const distancia = parseInt(data);
            if (isNaN(distancia)) return;

            const ID_ALVO = 1; 
            const estaOcupada = distancia > 0 && distancia <= 30;
            const novoStatus = estaOcupada ? 'OCUPADO' : 'LIVRE';
            const statusBooleano = estaOcupada; // true = OCUPADO, false = LIVRE
            console.log(`📡 Sensor ${ID_ALVO}: ${distancia}cm -> ${novoStatus}`);

            const { data: vagaAntes } = await supabase
                .from('vaga')
                .select('status_atual')
                .eq('id_sensor', ID_ALVO)
                .single();

            await supabase
                .from('sensor')
                .update({ ultimo_sinal: new Date().toISOString() })
                .eq('id_sensor', ID_ALVO);

            const { error: errorVaga } = await supabase
                .from('vaga')
                .update({ status_atual: novoStatus })
                .eq('id_sensor', ID_ALVO);

            if (errorVaga) {
                logger.error('Erro ao atualizar status da vaga', {
                    service: 'backend-api',
                    context: {
                        tabela: 'vaga',
                        id_sensor: ID_ALVO,
                        erro: errorVaga.message
                    }
                });
                console.error('❌ Erro ao atualizar vaga:', errorVaga.message);
            }

            if (vagaAntes && vagaAntes.status_atual !== novoStatus) {
                logger.info('Status da vaga alterado', {
                    service: 'hardware-arduino',
                    context: {
                        vaga_id: 1,
                        sensor_id: ID_ALVO,
                        distancia_cm: distancia,
                        status_anterior: vagaAntes.status_atual,
                        status_novo: novoStatus
                    }
                });

                console.log(`📝 Gravando mudança no histórico: ${vagaAntes.status_atual} -> ${novoStatus}`);
                
                await supabase
                    .from('historico_vaga')
                    .insert([{
                        id_vaga: 1,
                        status_registrado: statusBooleano,
                        data_hora: new Date().toISOString()
                    }]);
            }

        } catch (err) {
            logger.error('Falha no processamento de dados do Arduino', {
                service: 'hardware-arduino',
                context: {
                    erro: err.message,
                    dado_recebido: data
                }
            });
            console.error('❌ Erro no processamento:', err);
        }
    });

    port.on('error', (err) => {
        logger.error('Erro fatal na Porta Serial', {
            service: 'hardware-arduino',
            context: { erro: err.message, porta: 'COM7' }
        });
        console.error('❌ Erro na Porta Serial:', err.message);
    });
};

module.exports = initArduino;
