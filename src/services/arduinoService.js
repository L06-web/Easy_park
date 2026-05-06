const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const supabase = require('../config/supabase');

// 1. IMPORTANDO O LOGGER (Ajuste o caminho conforme necessário, assumindo que está na raiz)
const logger = require('../../logger'); 

const port = new SerialPort({ path: 'COM7', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

const initArduino = () => {
    port.on('open', () => {
        // Log de inicialização do serviço  
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

            // --- LOG DE DEPURAÇÃO (Console ou Debug) ---
            // Como isso roda em loop constante, mantemos no console ou usamos logger.debug 
            // (se o debug estiver configurado para não ir pro Supabase)
            console.log(`📡 Sensor ${ID_ALVO}: ${distancia}cm -> ${novoStatus}`);

            // 2. BUSCAR STATUS ATUAL
            const { data: vagaAntes } = await supabase
                .from('vaga')
                .select('status_atual')
                .eq('id_sensor', ID_ALVO)
                .single();

            // 3. ATUALIZAÇÃO DO SENSOR
            await supabase
                .from('sensor')
                .update({ ultimo_sinal: new Date().toISOString() })
                .eq('id_sensor', ID_ALVO);

            // 4. ATUALIZAÇÃO DA VAGA
            const { error: errorVaga } = await supabase
                .from('vaga')
                .update({ status_atual: novoStatus })
                .eq('id_sensor', ID_ALVO);

            if (errorVaga) {
                // LOG ESTRUTURADO DE ERRO (Crítico)
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

            // 5. LÓGICA DE HISTÓRICO E LOG ESTRUTURADO DE MUDANÇA
            // Só gravamos o log de INFO e o histórico se o status realmente mudou!
            if (vagaAntes && vagaAntes.status_atual !== novoStatus) {
                
                // LOG ESTRUTURADO (Evento de negócio)
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
                        status_registrado: novoStatus,
                        data_hora: new Date().toISOString()
                    }]);
            }

        } catch (err) {
            // LOG ESTRUTURADO DE ERRO (Exceções de código)
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
        // LOG ESTRUTURADO DE ERRO (Queda de conexão / porta ausente)
        logger.error('Erro fatal na Porta Serial', {
            service: 'hardware-arduino',
            context: { erro: err.message, porta: 'COM7' }
        });
        console.error('❌ Erro na Porta Serial:', err.message);
    });
};

module.exports = initArduino;