const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const supabase = require('../config/supabase');

const port = new SerialPort({ path: 'COM7', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

const initArduino = () => {
    port.on('open', () => console.log('🔌 Conexão Serial estabelecida na COM7'));

    parser.on('data', async (data) => {
        try {
            const distancia = parseInt(data);
            if (isNaN(distancia)) return;

            const ID_ALVO = 1; 
            const estaOcupada = distancia > 0 && distancia <= 30;
            const novoStatus = estaOcupada ? 'OCUPADO' : 'LIVRE';

            // --- LOG DE DEPURAÇÃO ---
            console.log(`📡 Sensor ${ID_ALVO}: ${distancia}cm -> ${novoStatus}`);

            // 2. BUSCAR STATUS ATUAL (Para saber se houve mudança e gravar histórico)
            const { data: vagaAntes } = await supabase
                .from('vaga')
                .select('status_atual')
                .eq('id_sensor', ID_ALVO)
                .single();

            // 3. ATUALIZAÇÃO DO SENSOR (O que já funcionava para você)
            await supabase
                .from('sensor')
                .update({ ultimo_sinal: new Date().toISOString() })
                .eq('id_sensor', ID_ALVO);

            // 4. ATUALIZAÇÃO DA VAGA (O que já funcionava para você)
            const { error: errorVaga } = await supabase
                .from('vaga')
                .update({ status_atual: novoStatus })
                .eq('id_sensor', ID_ALVO);

            if (errorVaga) {
                console.error('❌ Erro ao atualizar vaga:', errorVaga.message);
            } else {
                console.log(`✅ Banco sincronizado: ${novoStatus}`);
            }

            // 5. LÓGICA DE HISTÓRICO (Só grava se o status mudou)
            // Se o status no banco for diferente do que o sensor leu agora:
            if (vagaAntes && vagaAntes.status_atual !== novoStatus) {
                console.log(`📝 Gravando mudança no histórico: ${vagaAntes.status_atual} -> ${novoStatus}`);
                
                await supabase
                    .from('historico_vaga')
                    .insert([{
                        id_vaga: 1, // Como só temos uma vaga, usamos ID 1 fixo por enquanto
                        status_registrado: novoStatus,
                        data_hora: new Date().toISOString()
                    }]);
            }

        } catch (err) {
            console.error('❌ Erro no processamento:', err);
        }
    });

    port.on('error', (err) => console.error('❌ Erro na Porta Serial:', err.message));
};

module.exports = initArduino;