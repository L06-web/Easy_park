/**
 * Anomaly Detector - Detecção de Anomalias
 * 
 * Detects:
 * - Ocupações fora do padrão (Z-score)
 * - Sensores defeituosos (mudanças muito frequentes)
 * - Inatividade prolongada
 * - Picos anormais
 */

const supabase = require('../config/supabase');
const logger = require('../../logger');
const patternDetector = require('./patternDetector');
const {
    agoraBrasiliaISO,
    toBrasiliaISOString,
    getBrasiliaHour,
    getBrasiliaDay,
    subtrairDiasBrasilia
} = require('../utils/brasiliaDate');

const ANOMALY_CONFIG = {
    Z_SCORE_CRITICAL: 4,
    Z_SCORE_HIGH: 3,
    Z_SCORE_MEDIUM: 2,
    SENSOR_MIN_CHANGE_TIME: 30000, // 30 segundos
    INACTIVITY_DAYS: 7,
    OCCUPANCY_CRITICAL: 95, // % ocupação
    OCCUPANCY_WARNING: 85,
};

/**
 * Valida um evento de mudança de status e detecta anomalias
 * 
 * @param {Object} evento - Evento de mudança de vaga
 *   { id_vaga, status_anterior, status_novo, timestamp, duracao_ocupacao, sensor_id }
 */
async function validarEvento(evento) {
    try {
        const anomalias = [];

        // 1. Verifica se sensor está defeituoso
        const sensorDefeito = await verificarSensorDefeituoso(evento.id_vaga, evento.sensor_id);
        if (sensorDefeito) {
        anomalias.push({
            tipo: 'sensor_defeito',
            id_vaga: evento.id_vaga,
            severidade: 'alta',
            descricao: `Sensor ${evento.sensor_id} com múltiplas mudanças em curto período`,
            valor_atual: null,
            valor_esperado: null
        });
        }

        // 2. Verifica se ocupação está dentro do padrão
        const hora = getBrasiliaHour(evento.timestamp);
        const diaSemana = getBrasiliaDay(evento.timestamp);

        const padraoEsperado = await patternDetector.obterPadraoEsperado(hora, diaSemana);

        if (padraoEsperado && evento.duracao_ocupacao > 0) {
        const zScore = patternDetector.calcularZScore(
            evento.duracao_ocupacao,
            padraoEsperado.media_duracao,
            padraoEsperado.desvio_padrao
        );

        const severidade = patternDetector.classificarSeveridadeZScore(zScore);

        if (severidade !== 'nenhuma') {
            anomalias.push({
            tipo: 'ocupacao_anormal',
            id_vaga: evento.id_vaga,
            severidade,
            descricao: `Duração de ocupação fora do padrão (Z-Score: ${zScore.toFixed(2)})`,
            valor_atual: evento.duracao_ocupacao,
            valor_esperado: Math.round(padraoEsperado.media_duracao),
            desvio_percentual: Math.round(zScore * 100) / 100
            });
        }
        }

        // Registra anomalias no banco
        if (anomalias.length > 0) {
        await registrarAnomalias(anomalias);
        }

        return anomalias;

    } catch (erro) {
        logger.error('Erro ao validar evento', {
        service: 'analytics',
        context: {
            evento: evento.id_vaga,
            erro: erro.message
        }
        });
        throw erro;
    }
}

/**
 * Verifica se um sensor está com comportamento anômalo
 * (múltiplas mudanças em tempo muito curto = defeito)
 */
async function verificarSensorDefeituoso(idVaga, sensorId) {
    try {
        if (!sensorId) return false;

        const tempoMinimo = new Date(Date.now() - ANOMALY_CONFIG.SENSOR_MIN_CHANGE_TIME);

        const { data: mudancasRecentes, error } = await supabase
        .from('vaga_historico')
        .select('*')
        .eq('id_vaga', idVaga)
        .eq('sensor_id', sensorId)
        .gte('timestamp', toBrasiliaISOString(tempoMinimo))
        .order('timestamp', { ascending: false });

        if (error) throw error;

        // Se houve mais de 3 mudanças nos últimos 30s = provável defeito
        const ehDefeito = mudancasRecentes && mudancasRecentes.length > 3;

        if (ehDefeito) {
        logger.warn('Sensor com comportamento suspeito detectado', {
            service: 'analytics',
            context: {
            id_vaga: idVaga,
            sensor_id: sensorId,
            mudancas: mudancasRecentes.length,
            periodo_segundos: ANOMALY_CONFIG.SENSOR_MIN_CHANGE_TIME / 1000
            }
        });
        }

        return ehDefeito;

    } catch (erro) {
        logger.error('Erro ao verificar sensor defeituoso', {
        service: 'analytics',
        context: {
            id_vaga: idVaga,
            sensor_id: sensorId,
            erro: erro.message
        }
        });
        return false;
    }
}

/**
 * Detecta vagas com inatividade prolongada
 */
async function detectarInatividade() {
    try {
        const dataLimite = subtrairDiasBrasilia(new Date(), ANOMALY_CONFIG.INACTIVITY_DAYS);

        const { data: vagasInativas, error } = await supabase
        .from('vaga')
        .select(`
            id_vaga,
            vaga_historico(timestamp)
        `)
        .order('id_vaga', { ascending: true });

        if (error) throw error;

        const inativas = vagasInativas
        .filter(vaga => {
            if (!vaga.vaga_historico || vaga.vaga_historico.length === 0) {
            return true; // Nunca foi usada
            }

            const ultimoUso = new Date(vaga.vaga_historico[0].timestamp);
            return ultimoUso < dataLimite;
        })
        .map(vaga => ({
            tipo: 'inatividade',
            id_vaga: vaga.id_vaga,
            severidade: 'media',
            descricao: `Vaga sem atividade há ${ANOMALY_CONFIG.INACTIVITY_DAYS}+ dias. Possível sensor defeituoso.`,
            valor_atual: 0,
            valor_esperado: null
        }));

        if (inativas.length > 0) {
        await registrarAnomalias(inativas);
        }

        return inativas;

    } catch (erro) {
        logger.error('Erro ao detectar inatividade', {
        service: 'analytics',
        context: { erro: erro.message }
        });
        return [];
    }
}

/**
 * Detecta picos de ocupação anormais
 */
async function detectarPicosAnormais() {
    try {
        const agora = new Date();
        const umahora = new Date(agora.getTime() - 60 * 60 * 1000);

        // Contar ocupação atual
        const { data: vagasAtualmente, error: erroVagas } = await supabase
        .from('vaga')
        .select('*')
        .eq('status_atual', 'O');

        if (erroVagas) throw erroVagas;

        const { data: totalVagas, error: erroTotal } = await supabase
        .from('vaga')
        .select('id_vaga');

        if (erroTotal) throw erroTotal;

        if (!totalVagas || totalVagas.length === 0) {
        return [];
        }

        const ocupacaoAtual = (vagasAtualmente.length / totalVagas.length) * 100;

        // Comparar com histórico da última hora
        const { data: historico, error: erroHistorico } = await supabase
        .from('vaga_historico')
        .select('*')
        .gte('timestamp', toBrasiliaISOString(umahora));

        if (erroHistorico) throw erroHistorico;

        // Calcular ocupação média da última hora
        const ocupacaoMedia = historico.length > 0
        ? (historico.filter(h => h.status_novo === 'O').length / historico.length) * 100
        : 50;

        const variacao = ocupacaoMedia > 0
        ? ((ocupacaoAtual - ocupacaoMedia) / ocupacaoMedia) * 100
        : ocupacaoAtual > 0 ? 100 : 0;

        const anomalias = [];

        // Alerta crítico
        if (ocupacaoAtual >= ANOMALY_CONFIG.OCCUPANCY_CRITICAL) {
        anomalias.push({
            tipo: 'pico_anomalo',
            id_vaga: null,
            severidade: 'critica',
            descricao: `Ocupação CRÍTICA: ${ocupacaoAtual.toFixed(1)}% (limite: ${ANOMALY_CONFIG.OCCUPANCY_CRITICAL}%)`,
            valor_atual: ocupacaoAtual,
            valor_esperado: ANOMALY_CONFIG.OCCUPANCY_CRITICAL
        });
        }

        // Alerta de aviso
        if (ocupacaoAtual >= ANOMALY_CONFIG.OCCUPANCY_WARNING && ocupacaoAtual < ANOMALY_CONFIG.OCCUPANCY_CRITICAL) {
        anomalias.push({
            tipo: 'pico_anomalo',
            id_vaga: null,
            severidade: 'alta',
            descricao: `Ocupação ALTA: ${ocupacaoAtual.toFixed(1)}% (limite: ${ANOMALY_CONFIG.OCCUPANCY_WARNING}%)`,
            valor_atual: ocupacaoAtual,
            valor_esperado: ANOMALY_CONFIG.OCCUPANCY_WARNING
        });
        }

        // Aumento anormal (mais de 30% em relação à última hora)
        if (variacao > 30) {
        anomalias.push({
            tipo: 'pico_anomalo',
            id_vaga: null,
            severidade: 'media',
            descricao: `Aumento anormal de ocupação: ${variacao.toFixed(1)}% em relação à última hora`,
            valor_atual: ocupacaoAtual,
            valor_esperado: ocupacaoMedia,
            desvio_percentual: variacao
        });
        }

        if (anomalias.length > 0) {
        await registrarAnomalias(anomalias);
        }

        return anomalias;

    } catch (erro) {
        logger.error('Erro ao detectar picos anormais', {
        service: 'analytics',
        context: { erro: erro.message }
        });
        return [];
    }
}

/**
 * Registra anomalias no banco de dados
 */
async function registrarAnomalias(anomalias) {
    try {
        const { data, error } = await supabase
        .from('evento_anomalia')
        .insert(anomalias.map(a => ({
            ...a,
            timestamp: agoraBrasiliaISO(),
            resolvido: false
        })));

        if (error) throw error;

        logger.info('Anomalias registradas', {
        service: 'analytics',
        context: {
            quantidade: anomalias.length,
            tipos: [...new Set(anomalias.map(a => a.tipo))]
        }
        });

        return data;

    } catch (erro) {
        logger.error('Erro ao registrar anomalias', {
        service: 'analytics',
        context: { erro: erro.message }
        });
        throw erro;
    }
}

/**
 * Recupera anomalias não resolvidas
 */
async function obterAnomaliasPendentes() {
    try {
        const { data: anomalias, error } = await supabase
        .from('evento_anomalia')
        .select('*')
        .eq('resolvido', false)
        .order('timestamp', { ascending: false });

        if (error) throw error;

        return anomalias || [];

    } catch (erro) {
        logger.error('Erro ao recuperar anomalias pendentes', {
        service: 'analytics',
        context: { erro: erro.message }
        });
        return [];
    }
}

/**
 * Recupera anomalias recentes, incluindo resolvidas e não resolvidas.
 */
async function obterAnomaliasRecentes(limite = 20) {
    try {
        const { data: anomalias, error } = await supabase
        .from('evento_anomalia')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limite);

        if (error) throw error;

        return anomalias || [];

    } catch (erro) {
        logger.error('Erro ao recuperar anomalias recentes', {
        service: 'analytics',
        context: { erro: erro.message }
        });
        return [];
    }
}

/**
 * Marca anomalia como resolvida
 */
async function marcarResolvida(idAnomalia) {
    try {
        const { data, error } = await supabase
        .from('evento_anomalia')
        .update({
            resolvido: true,
            data_resolucao: agoraBrasiliaISO()
        })
        .eq('id_anomalia', idAnomalia);

        if (error) throw error;

        return data;

    } catch (erro) {
        logger.error('Erro ao marcar anomalia como resolvida', {
        service: 'analytics',
        context: {
            id_anomalia: idAnomalia,
            erro: erro.message
        }
        });
        throw erro;
    }
}

module.exports = {
    validarEvento,
    verificarSensorDefeituoso,
    detectarInatividade,
    detectarPicosAnormais,
    registrarAnomalias,
    obterAnomaliasPendentes,
    obterAnomaliasRecentes,
    marcarResolvida
};
