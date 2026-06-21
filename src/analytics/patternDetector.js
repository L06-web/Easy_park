/**
 * Pattern Detector - Detecção de Padrões de Ocupação
 * 
 * Responsabilidades:
 * - Analisar dados históricos
 * - Identificar padrões por hora/dia
 * - Calcular estatísticas (média, desvio, etc)
 * - Armazenar padrões para referência futura
 */

const supabase = require('../config/supabase');
const logger = require('../../logger');
const ss = require('simple-statistics');
const {
  agoraBrasiliaISO,
  toBrasiliaISOString,
  getBrasiliaHour,
  getBrasiliaDay,
  adicionarDiasBrasilia,
  subtrairDiasBrasilia
} = require('../utils/brasiliaDate');

const PATTERN_MIN_CONFIDENCE = 60; // % mínimo de dados válidos

/**
 * Calcula padrão de ocupação para uma hora específica em um dia da semana
 * 
 * @param {number} hora - 0-23
 * @param {number} diaSemana - 0-6 (domingo-sábado, padrão do Date.getDay)
 * @param {number} diasHistorico - Quantos dias de histórico analisar (padrão: 30)
 * @returns {Object} Padrão calculado
 */
async function calcularPadraoOcupacao(hora, diaSemana, diasHistorico = 30) {
  try {
    const dataInicio = subtrairDiasBrasilia(new Date(), diasHistorico);

    // Buscar histórico de vagas para horário/dia específicos
    const { data: historico, error: erroHistorico } = await supabase
      .from('vaga_historico')
      .select('*')
      .gte('timestamp', toBrasiliaISOString(dataInicio))
      .lte('timestamp', agoraBrasiliaISO());

    if (erroHistorico) throw erroHistorico;
    if (!historico || historico.length === 0) {
      return {
        confianca: 0,
        aviso: 'Dados insuficientes'
      };
    }

    // Filtrar eventos pelo horário e dia da semana
    const eventosHoraoDia = historico.filter(evento => {
      const horaEvento = getBrasiliaHour(evento.timestamp);
      const diaEvento = getBrasiliaDay(evento.timestamp);

      return horaEvento === hora && diaEvento === diaSemana;
    });

    if (eventosHoraoDia.length === 0) {
      return {
        confianca: 0,
        aviso: 'Nenhum evento neste horário/dia'
      };
    }

    // Extrair ocupações/durações para cálculos
    const durações = eventosHoraoDia
      .filter(e => e.duracao_ocupacao > 0)
      .map(e => e.duracao_ocupacao);

    if (durações.length === 0) {
      return {
        confianca: 0,
        aviso: 'Dados de duração indisponíveis'
      };
    }

    // Calcular estatísticas
    const media = ss.mean(durações);
    const desvio = ss.standardDeviation(durações);
    const minimo = ss.min(durações);
    const maximo = ss.max(durações);
    const mediana = ss.median(durações);
    const q1 = ss.quantile(durações, 0.25);
    const q3 = ss.quantile(durações, 0.75);

    // Calcular confiança (% de dados válidos)
    const totalPossivel = contarOcorrenciasDiaSemana(dataInicio, new Date(), diaSemana);
    const confianca = (durações.length / totalPossivel) * 100;

    const padrao = {
      hora_dia: hora,
      dia_semana: diaSemana,
      media_duracao: Math.round(media * 100) / 100,
      desvio_padrao: Math.round(desvio * 100) / 100,
      duracao_min: minimo,
      duracao_max: maximo,
      duracao_mediana: Math.round(mediana * 100) / 100,
      q1: Math.round(q1 * 100) / 100,
      q3: Math.round(q3 * 100) / 100,
      amplitude_interquartil: Math.round((q3 - q1) * 100) / 100,
      amostras: durações.length,
      confianca: Math.round(confianca),
      data_calculo: agoraBrasiliaISO()
    };

    logger.info('Padrão de ocupação calculado', {
      service: 'analytics',
      context: {
        hora,
        diaSemana,
        confianca: padrao.confianca,
        amostras: padrao.amostras,
        media_duracao: padrao.media_duracao
      }
    });

    return padrao;

  } catch (erro) {
    logger.error('Erro ao calcular padrão de ocupação', {
      service: 'analytics',
      context: {
        hora,
        diaSemana,
        erro: erro.message
      }
    });
    throw erro;
  }
}

/**
 * Atualiza a tabela padrao_ocupacao com os novos valores calculados
 * Executado periodicamente (a cada 6 horas, por exemplo)
 */
async function atualizarTodosPadroes() {
  try {
    const padroes = [];

    logger.info('Iniciando atualização de todos os padrões', {
      service: 'analytics'
    });

    // Calcular padrão para cada combinação hora × dia
    for (let hora = 0; hora < 24; hora++) {
      for (let dia = 0; dia < 7; dia++) {
        const padrao = await calcularPadraoOcupacao(hora, dia);

        if (padrao.confianca >= PATTERN_MIN_CONFIDENCE) {
          padroes.push(padrao);
        }
      }
    }

    if (padroes.length === 0) {
      logger.warn('Nenhum padrão com confiança suficiente foi calculado', {
        service: 'analytics'
      });
      return { padroes: [], atualizados: 0 };
    }

    // Inserir/atualizar na tabela padrao_ocupacao
    const { data: resultado, error: erroInsercao } = await supabase
      .from('padrao_ocupacao')
      .upsert(padroes, {
        onConflict: 'hora_dia,dia_semana'
      });

    if (erroInsercao) throw erroInsercao;

    logger.info('Padrões atualizados com sucesso', {
      service: 'analytics',
      context: {
        quantidade: padroes.length
      }
    });

    return {
      padroes,
      atualizados: padroes.length
    };

  } catch (erro) {
    logger.error('Erro ao atualizar padrões de ocupação', {
      service: 'analytics',
      context: {
        erro: erro.message
      }
    });
    throw erro;
  }
}

/**
 * Recupera o padrão esperado para uma hora/dia específicos
 * 
 * @param {number} hora 
 * @param {number} diaSemana 
 * @returns {Object} Padrão ou null se não existir
 */
async function obterPadraoEsperado(hora, diaSemana) {
  try {
    const { data: padrao, error } = await supabase
      .from('padrao_ocupacao')
      .select('*')
      .eq('hora_dia', hora)
      .eq('dia_semana', diaSemana)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return padrao || null;

  } catch (erro) {
    logger.error('Erro ao recuperar padrão esperado', {
      service: 'analytics',
      context: {
        hora,
        diaSemana,
        erro: erro.message
      }
    });
    return null;
  }
}

/**
 * Calcula Z-score para detectar se um valor é anômalo
 * Z-score = (valor - média) / desvio_padrão
 * 
 * @param {number} valor 
 * @param {number} media 
 * @param {number} desvio 
 * @returns {number} Z-score
 */
function calcularZScore(valor, media, desvio) {
  if (desvio === 0) return 0;
  return (valor - media) / desvio;
}

/**
 * Classifica severidade baseada no Z-score
 */
function classificarSeveridadeZScore(zScore) {
  const zAbs = Math.abs(zScore);

  if (zAbs > 4) return 'critica';
  if (zAbs > 3) return 'alta';
  if (zAbs > 2) return 'media';
  if (zAbs > 1) return 'baixa';
  return 'nenhuma';
}

/**
 * Analisa uma série temporal para detectar tendências
 * 
 * @param {Array} valores - Array de valores (ocupação)
 * @returns {string} 'subindo', 'descendo', 'estavel'
 */
function calcularTendencia(valores) {
  if (valores.length < 2) return 'estavel';

  // Divide em primeira metade e segunda metade
  const meio = Math.floor(valores.length / 2);
  const primeiraMetade = valores.slice(0, meio);
  const segundaMetade = valores.slice(meio);

  const mediaAnterior = ss.mean(primeiraMetade);
  const mediaAtual = ss.mean(segundaMetade);

  if (mediaAnterior === 0) {
    return mediaAtual > 0 ? 'subindo' : 'estavel';
  }

  const variacao = ((mediaAtual - mediaAnterior) / mediaAnterior) * 100;

  if (variacao > 10) return 'subindo';
  if (variacao < -10) return 'descendo';
  return 'estavel';
}

/**
 * Identifica horários de pico (maior ocupação)
 */
async function identificarHorariosPico() {
  try {
    const { data: padroes, error } = await supabase
      .from('padrao_ocupacao')
      .select('*')
      .gte('confianca', PATTERN_MIN_CONFIDENCE)
      .order('media_duracao', { ascending: false })
      .limit(5);

    if (error) throw error;

    return padroes.map(p => ({
      hora: p.hora_dia,
      dia: p.dia_semana,
      ocupacao_media: p.media_duracao,
      confianca: p.confianca
    }));

  } catch (erro) {
    logger.error('Erro ao identificar horários de pico', {
      service: 'analytics',
      context: { erro: erro.message }
    });
    return [];
  }
}

function contarOcorrenciasDiaSemana(dataInicio, dataFim, diaSemana) {
  let ocorrencias = 0;
  let cursor = new Date(dataInicio);

  while (cursor <= dataFim) {
    if (getBrasiliaDay(cursor) === diaSemana) {
      ocorrencias++;
    }
    cursor = adicionarDiasBrasilia(cursor, 1);
  }

  return Math.max(ocorrencias, 1);
}

module.exports = {
  calcularPadraoOcupacao,
  atualizarTodosPadroes,
  obterPadraoEsperado,
  calcularZScore,
  classificarSeveridadeZScore,
  calcularTendencia,
  identificarHorariosPico,
  identificarHorariosNice: identificarHorariosPico
};
