/**
 * Indicator Calculator - Cálculo de KPIs
 * 
 * Calcula indicadores em tempo real:
 * - Taxa de ocupação
 * - Rotatividade
 * - Tempo médio de permanência
 * - Tendência
 * - Pico de ocupação
 */

const supabase = require('../config/supabase');
const logger = require('../../logger');
const ss = require('simple-statistics');
const patternDetector = require('./patternDetector');

/**
 * Calcula KPIs em tempo real
 * 
 * @param {Object} opcoes 
 *   - periodo: 'agora', '1h', '24h', '7d' (padrão: 'agora')
 * @returns {Object} KPIs calculados
 */
async function calcularKPIsEmTempoReal(opcoes = { periodo: 'agora' }) {
  try {
    const { periodo = 'agora' } = opcoes;

    // 1. TAXA DE OCUPAÇÃO ATUAL
    const { data: vagasOcupadas, error: erroOcupadas } = await supabase
      .from('vaga')
      .select('*')
      .eq('status_atual', 'O');

    if (erroOcupadas) throw erroOcupadas;

    const { data: totalVagas, error: erroTotal } = await supabase
      .from('vaga')
      .select('id_vaga');

    if (erroTotal) throw erroTotal;

    const total = totalVagas.length;
    const vagasLivres = Math.max(total - vagasOcupadas.length, 0);
    const taxaOcupacao = total > 0 ? (vagasOcupadas.length / total) * 100 : 0;

    // 2. HISTÓRICO DO PERÍODO
    const dataInicio = calcularDataInicio(periodo);
    const historico = await buscarHistoricoPeriodo(dataInicio, new Date());

    // 3. ROTATIVIDADE (quantas mudanças)
    const rotatividade = historico.length;

    // 4. TEMPO MÉDIO DE PERMANÊNCIA
    const duracoes = historico
      .filter(h => h.duracao_ocupacao > 0)
      .map(h => h.duracao_ocupacao);

    const tempoMedio = duracoes.length > 0
      ? Math.round(ss.mean(duracoes) * 100) / 100
      : 0;

    // 5. PICO DE OCUPAÇÃO (máxima ocupação simultânea no período)
    const ocupacoesPorTimestamp = {};
    historico.forEach(evento => {
      const timestamp = new Date(evento.timestamp).getTime();
      if (!ocupacoesPorTimestamp[timestamp]) {
        ocupacoesPorTimestamp[timestamp] = 0;
      }
      if (evento.status_novo === 'O') {
        ocupacoesPorTimestamp[timestamp]++;
      }
    });

    const picoDados = Object.values(ocupacoesPorTimestamp);
    const picoOcupacao = picoDados.length > 0
      ? (ss.max(picoDados) / (total || 1)) * 100
      : 0;

    // 6. TENDÊNCIA
    const horasHistorico = dividirPorHoras(historico, 24);
    const tendencia = calcularTendencia(horasHistorico);

    // 7. DESVIO PADRÃO (variabilidade da ocupação)
    const desvio = horasHistorico.length > 1
      ? Math.round(ss.standardDeviation(horasHistorico) * 100) / 100
      : 0;

    const kpis = {
      timestamp: new Date().toISOString(),
      periodo,
      ocupacao: {
        taxa_percentual: Math.round(taxaOcupacao * 100) / 100,
        vagas_ocupadas: vagasOcupadas.length,
        vagas_livres: vagasLivres,
        total_vagas: total
      },
      rotatividade: {
        total_mudancas: rotatividade,
        media_por_hora: Math.round((rotatividade / (horasHistorico.length || 1)) * 100) / 100
      },
      permanencia: {
        tempo_medio_minutos: tempoMedio,
        tempo_minimo_minutos: duracoes.length > 0 ? ss.min(duracoes) : 0,
        tempo_maximo_minutos: duracoes.length > 0 ? ss.max(duracoes) : 0
      },
      pico: {
        ocupacao_maxima_percentual: Math.round(picoOcupacao * 100) / 100,
        vagas_simultaneas_max: Math.max(...picoDados, 0)
      },
      tendencia: {
        direcao: tendencia,
        desvio_padrao: desvio,
        variabilidade: classificarVariabilidade(desvio)
      },
      amostra: {
        eventos_analisados: historico.length,
        horas_no_periodo: horasHistorico.length
      }
    };

    logger.info('KPIs calculados com sucesso', {
      service: 'analytics',
      context: {
        periodo,
        taxa_ocupacao: kpis.ocupacao.taxa_percentual,
        rotatividade: kpis.rotatividade.total_mudancas,
        tendencia: kpis.tendencia.direcao
      }
    });

    return kpis;

  } catch (erro) {
    logger.error('Erro ao calcular KPIs', {
      service: 'analytics',
      context: {
        periodo: opcoes.periodo,
        erro: erro.message
      }
    });
    throw erro;
  }
}

/**
 * Calcula KPIs agregados por hora
 */
async function calcularIndicadorHorario() {
  try {
    const agora = new Date();
    agora.setMinutes(0, 0, 0); // Começo da hora

    const historico = await buscarHistoricoPeriodo(agora, new Date());

    // Agrupar por hora
    const horaAtual = new Date().getHours();
    const diaAtual = new Date().getDay();

    // Calcular estatísticas da hora
    const duracoes = historico
      .filter(h => h.duracao_ocupacao > 0)
      .map(h => h.duracao_ocupacao);

    const { data: vagasTotal, error: erroVagas } = await supabase
      .from('vaga')
      .select('id_vaga');

    if (erroVagas) throw erroVagas;

    const rotatividade = historico.length;
    const ocupacoesPico = Math.max(
      ...historico
        .filter(h => h.status_novo === 'O')
        .map((_, i) => i + 1),
      0
    );

    const indicador = {
      hora: agora.toISOString(),
      dia_semana: diaAtual,
      taxa_ocupacao: vagasTotal.length > 0
        ? Math.round((ocupacoesPico / vagasTotal.length) * 100)
        : 0,
      vagas_livres: Math.max(vagasTotal.length - ocupacoesPico, 0),
      total_vagas: vagasTotal.length,
      rotatividade,
      tempo_medio_permanencia: duracoes.length > 0
        ? Math.round(ss.mean(duracoes))
        : 0,
      pico_ocupacao: ocupacoesPico,
      timestamp: new Date().toISOString()
    };

    // Salvar no banco
    const { data: salvo, error: erroSalvar } = await supabase
      .from('indicador_horario')
      .insert([indicador]);

    if (erroSalvar) throw erroSalvar;

    logger.info('Indicador horário calculado', {
      service: 'analytics',
      context: {
        hora: horaAtual,
        dia: diaAtual,
        taxa_ocupacao: indicador.taxa_ocupacao
      }
    });

    return indicador;

  } catch (erro) {
    logger.error('Erro ao calcular indicador horário', {
      service: 'analytics',
      context: { erro: erro.message }
    });
    throw erro;
  }
}

/**
 * Recupera indicadores históricos para gráficos
 */
async function obterIndicadoresHistoricos(periodo = '24h') {
  try {
    const dataInicio = calcularDataInicio(periodo);

    const { data: indicadores, error } = await supabase
      .from('indicador_horario')
      .select('*')
      .gte('timestamp', dataInicio.toISOString())
      .order('timestamp', { ascending: true });

    if (error) throw error;

    return indicadores || [];

  } catch (erro) {
    logger.error('Erro ao recuperar indicadores históricos', {
      service: 'analytics',
      context: {
        periodo,
        erro: erro.message
      }
    });
    return [];
  }
}

/**
 * Helper: Calcula data de início baseado no período
 */
function calcularDataInicio(periodo) {
  const agora = new Date();

  switch (periodo) {
    case 'agora':
      return new Date(agora.getTime() - 5 * 60 * 1000); // 5 minutos
    case '1h':
      return new Date(agora.getTime() - 60 * 60 * 1000);
    case '24h':
      return new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(agora.getTime() - 60 * 60 * 1000);
  }
}

async function buscarHistoricoPeriodo(dataInicio, dataFim) {
  const { data, error } = await supabase
    .from('vaga_historico')
    .select('*')
    .gte('timestamp', dataInicio.toISOString())
    .lte('timestamp', dataFim.toISOString());

  if (!error) {
    return data || [];
  }

  if (!tabelaNaoEncontrada(error)) {
    throw error;
  }

  logger.warn('Tabela vaga_historico não encontrada; usando fallback historico_vaga', {
    service: 'analytics',
    context: {
      erro: error.message
    }
  });

  const { data: legado, error: erroLegado } = await supabase
    .from('historico_vaga')
    .select('*')
    .gte('data_hora', dataInicio.toISOString())
    .lte('data_hora', dataFim.toISOString());

  if (erroLegado) throw erroLegado;

  return (legado || []).map(registro => ({
    id_historico: registro.id_historico,
    id_vaga: registro.id_vaga,
    status_anterior: null,
    status_novo: registro.status_registrado ? 'O' : 'L',
    timestamp: registro.data_hora,
    duracao_ocupacao: 0,
    sensor_id: null
  }));
}

function tabelaNaoEncontrada(error) {
  return error?.code === 'PGRST205' || /Could not find the table/i.test(error?.message || '');
}

/**
 * Helper: Divide histórico em buckets por hora
 */
function dividirPorHoras(historico, buckets = 24) {
  if (historico.length === 0) return [];

  const agora = new Date();
  const resultado = [];

  for (let i = 0; i < buckets; i++) {
    const inicio = new Date(agora.getTime() - (buckets - i) * 60 * 60 * 1000);
    const fim = new Date(agora.getTime() - (buckets - i - 1) * 60 * 60 * 1000);

    const eventosPeriodo = historico.filter(h => {
      const dataH = new Date(h.timestamp);
      return dataH >= inicio && dataH < fim;
    });

    const ocupacaoPeriodo = eventosPeriodo.filter(h => h.status_novo === 'O').length;
    resultado.push(ocupacaoPeriodo);
  }

  return resultado;
}

/**
 * Helper: Calcula tendência (subindo/descendo/estável)
 */
function calcularTendencia(valores) {
  if (valores.length < 2) return 'estavel';

  const meio = Math.floor(valores.length / 2);
  const mediaAnterior = ss.mean(valores.slice(0, meio));
  const mediaAtual = ss.mean(valores.slice(meio));

  if (mediaAnterior === 0) {
    return mediaAtual > 0 ? 'subindo' : 'estavel';
  }

  const variacao = ((mediaAtual - mediaAnterior) / mediaAnterior) * 100;

  if (Math.abs(variacao) < 5) return 'estavel';
  return variacao > 0 ? 'subindo' : 'descendo';
}

/**
 * Helper: Classifica variabilidade
 */
function classificarVariabilidade(desvio) {
  if (desvio < 5) return 'baixa';
  if (desvio < 15) return 'média';
  if (desvio < 30) return 'alta';
  return 'muito_alta';
}

module.exports = {
  calcularKPIsEmTempoReal,
  calcularIndicadorHorario,
  obterIndicadoresHistoricos
};
