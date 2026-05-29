const supabase = require('../config/supabase');
const analyticsService = require('./analyticsService');
const logger = require('../../logger');

const STATUS = {
    LIVRE: 'L',
    OCUPADO: 'O',
    RESERVADO: 'R',
};

function normalizarStatus(status) {
    const mapa = {
        L: STATUS.LIVRE,
        LIVRE: STATUS.LIVRE,
        O: STATUS.OCUPADO,
        OCUPADO: STATUS.OCUPADO,
        R: STATUS.RESERVADO,
        RESERVADO: STATUS.RESERVADO,
    };
    return mapa[status] || status;
}

function statusParaTexto(status) {
    const mapa = {
        [STATUS.LIVRE]: 'LIVRE',
        [STATUS.OCUPADO]: 'OCUPADO',
        [STATUS.RESERVADO]: 'RESERVADO',
    };
    return mapa[normalizarStatus(status)] || status;
}

const procesarDadosSensor = async (idSensor, distancia) => {
    try {
        const estaOcupada = distancia > 0 && distancia <= 30;
        const novoStatus = estaOcupada ? STATUS.OCUPADO : STATUS.LIVRE;
        const statusBooleano = estaOcupada;
        console.log(`📡 Sensor ${idSensor}: ${distancia}cm -> ${statusParaTexto(novoStatus)}`);

        const { data: vagaAntes, error: erroVagaBusca } = await supabase
            .from('vaga')
            .select('id_vaga, status_atual, id_sensor')
            .eq('id_sensor', idSensor)
            .single();

        if (erroVagaBusca || !vagaAntes) {
            console.error(`❌ Vaga não encontrada para Sensor ${idSensor}`);
            return;
        }

        await supabase
            .from('sensor')
            .update({ ultimo_sinal: new Date().toISOString() })
            .eq('id_sensor', idSensor);

        const statusAnterior = normalizarStatus(vagaAntes.status_atual);

        if (statusAnterior === STATUS.RESERVADO && novoStatus === STATUS.LIVRE) {
            console.log(`📌 Vaga ${vagaAntes.id_vaga} mantida como RESERVADO`);
            return;
        }

        const { error: errorVaga } = await supabase
            .from('vaga')
            .update({ status_atual: novoStatus })
            .eq('id_sensor', idSensor);

        if (errorVaga) {
            console.error(`❌ Erro ao atualizar vaga ${vagaAntes.id_vaga}:`, errorVaga.message);
            return;
        }

        if (statusAnterior !== novoStatus) {
            const timestampMudanca = new Date().toISOString();
            console.log(`✅ Vaga ${vagaAntes.id_vaga}: ${statusParaTexto(statusAnterior)} → ${statusParaTexto(novoStatus)}`);

            await supabase
                .from('historico_vaga')
                .insert([{
                    id_vaga: vagaAntes.id_vaga,
                    status_registrado: statusBooleano,
                    data_hora: timestampMudanca
                }]);

            try {
                await analyticsService.registrarEventoVaga({
                    id_vaga: vagaAntes.id_vaga,
                    status_anterior: statusAnterior,
                    status_novo: novoStatus,
                    timestamp: timestampMudanca,
                    sensor_id: idSensor
                });
            } catch (erroAnalytics) {
                console.warn('⚠️ Erro no analytics:', erroAnalytics.message);
            }
        }
    } catch (err) {
        console.error('❌ Erro crítico:', err.message);
        throw err;
    }
};

module.exports = { procesarDadosSensor };