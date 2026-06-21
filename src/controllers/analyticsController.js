/**
 * Analytics Controller - Endpoints da API
 * 
 * Expõe funcionalidades de análise para o frontend
 */

const patternDetector = require('../analytics/patternDetector');
const anomalyDetector = require('../analytics/anomalyDetector');
const indicatorCalculator = require('../analytics/indicatorCalculator');
const logger = require('../../logger');
const { agoraBrasiliaISO } = require('../utils/brasiliaDate');

/**
 * GET /api/analytics/kpis
 * Retorna KPIs em tempo real
 */
exports.obterKPIs = async (req, res) => {
  try {
    const { periodo = 'agora' } = req.query;

    const kpis = await indicatorCalculator.calcularKPIsEmTempoReal({ periodo });

    logger.info('KPIs consultados via API', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterKPIs',
        periodo
      }
    });

    return res.status(200).json(kpis);

  } catch (erro) {
    logger.error('Erro ao obter KPIs', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterKPIs',
        erro: erro.message
      }
    });

    return res.status(500).json({ erro: 'Erro ao calcular KPIs' });
  }
};

/**
 * GET /api/analytics/padroes/:hora/:dia
 * Retorna padrão esperado para hora/dia
 */
exports.obterPadrao = async (req, res) => {
  try {
    const { hora, dia } = req.params;

    if (!hora || !dia || isNaN(hora) || isNaN(dia)) {
      return res.status(400).json({ erro: 'Hora e dia devem ser números válidos' });
    }

    const padraoEsperado = await patternDetector.obterPadraoEsperado(
      parseInt(hora),
      parseInt(dia)
    );

    if (!padraoEsperado) {
      return res.status(404).json({ erro: 'Padrão não encontrado' });
    }

    logger.info('Padrão consultado via API', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterPadrao',
        hora,
        dia,
        confianca: padraoEsperado.confianca
      }
    });

    return res.status(200).json(padraoEsperado);

  } catch (erro) {
    logger.error('Erro ao obter padrão', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterPadrao',
        erro: erro.message
      }
    });

    return res.status(500).json({ erro: 'Erro ao recuperar padrão' });
  }
};

/**
 * GET /api/analytics/anomalias
 * Retorna anomalias detectadas
 */
exports.obterAnomalias = async (req, res) => {
  try {
    const { status = 'pendentes', limite = 20 } = req.query;
    const limiteNumerico = Number.parseInt(limite, 10) || 20;
    const anomalias = status === 'todas'
      ? await anomalyDetector.obterAnomaliasRecentes(limiteNumerico)
      : await anomalyDetector.obterAnomaliasPendentes();

    logger.info('Anomalias consultadas via API', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterAnomalias',
        quantidade: anomalias.length
      }
    });

    return res.status(200).json(anomalias);

  } catch (erro) {
    logger.error('Erro ao obter anomalias', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterAnomalias',
        erro: erro.message
      }
    });

    return res.status(500).json({ erro: 'Erro ao recuperar anomalias' });
  }
};

/**
 * GET /api/analytics/indicadores
 * Retorna indicadores históricos
 */
exports.obterIndicadores = async (req, res) => {
  try {
    const { periodo = '24h' } = req.query;

    const indicadores = await indicatorCalculator.obterIndicadoresHistoricos(periodo);

    logger.info('Indicadores consultados via API', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterIndicadores',
        periodo,
        quantidade: indicadores.length
      }
    });

    return res.status(200).json(indicadores);

  } catch (erro) {
    logger.error('Erro ao obter indicadores', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterIndicadores',
        erro: erro.message
      }
    });

    return res.status(500).json({ erro: 'Erro ao recuperar indicadores' });
  }
};

/**
 * GET /api/analytics/tendencia
 * Retorna tendência atual
 */
exports.obterTendencia = async (req, res) => {
  try {
    const kpis = await indicatorCalculator.calcularKPIsEmTempoReal();

    const tendencia = {
      direcao: kpis.tendencia.direcao,
      variabilidade: kpis.tendencia.variabilidade,
      desvio_padrao: kpis.tendencia.desvio_padrao,
      ocupacao_atual: kpis.ocupacao.taxa_percentual,
      timestamp: agoraBrasiliaISO()
    };

    logger.info('Tendência consultada via API', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterTendencia',
        direcao: tendencia.direcao
      }
    });

    return res.status(200).json(tendencia);

  } catch (erro) {
    logger.error('Erro ao obter tendência', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterTendencia',
        erro: erro.message
      }
    });

    return res.status(500).json({ erro: 'Erro ao calcular tendência' });
  }
};

/**
 * POST /api/analytics/anomalias/:id/resolver
 * Marca anomalia como resolvida
 */
exports.resolverAnomalia = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id || isNaN(id)) {
      return res.status(400).json({ erro: 'ID de anomalia inválido' });
    }

    const resultado = await anomalyDetector.marcarResolvida(parseInt(id));

    logger.info('Anomalia marcada como resolvida', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.resolverAnomalia',
        id_anomalia: id
      }
    });

    return res.status(200).json({ sucesso: true, resultado });

  } catch (erro) {
    logger.error('Erro ao resolver anomalia', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.resolverAnomalia',
        id: id,
        erro: erro.message
      }
    });

    return res.status(500).json({ erro: 'Erro ao resolver anomalia' });
  }
};

/**
 * GET /api/analytics/horarios-pico
 * Retorna horários com maior ocupação
 */
exports.obterHorariosPico = async (req, res) => {
  try {
    const horarios = await patternDetector.identificarHorariosPico();

    logger.info('Horários de pico consultados via API', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterHorariosPico',
        quantidade: horarios.length
      }
    });

    return res.status(200).json(horarios);

  } catch (erro) {
    logger.error('Erro ao obter horários de pico', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterHorariosPico',
        erro: erro.message
      }
    });

    return res.status(500).json({ erro: 'Erro ao recuperar horários de pico' });
  }
};

/**
 * POST /api/analytics/atualizar-padroes
 * Força atualização de padrões (admin apenas)
 */
exports.atualizarPadroes = async (req, res) => {
  try {
    // TODO: Validar se usuário é admin

    const resultado = await patternDetector.atualizarTodosPadroes();

    logger.info('Padrões atualizados manualmente via API', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.atualizarPadroes',
        padroes_atualizados: resultado.atualizados
      }
    });

    return res.status(200).json({
      sucesso: true,
      padroes_atualizados: resultado.atualizados
    });

  } catch (erro) {
    logger.error('Erro ao atualizar padrões', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.atualizarPadroes',
        erro: erro.message
      }
    });

    return res.status(500).json({ erro: 'Erro ao atualizar padrões' });
  }
};

/**
 * GET /api/analytics/dashboard
 * Retorna todos os dados para o dashboard (view consolidada)
 */
exports.obterDashboard = async (req, res) => {
  try {
    const { periodo = '24h' } = req.query;
    const periodoValido = periodo === '48h' ? '48h' : '24h';
    const limiteIndicadores = periodoValido === '48h' ? 48 : 24;

    const [kpis, anomalias, indicadores, horariosPico] = await Promise.all([
      indicatorCalculator.calcularKPIsEmTempoReal(),
      anomalyDetector.obterAnomaliasRecentes(20),
      indicatorCalculator.obterIndicadoresHistoricos(periodoValido),
      patternDetector.identificarHorariosPico()
    ]);

    const dashboard = {
      timestamp: agoraBrasiliaISO(),
      periodo: periodoValido,
      kpis,
      anomalias,
      indicadores: indicadores.slice(-limiteIndicadores),
      horarios_pico: horariosPico,
      resumo: {
        total_anomalias: anomalias.length,
        anomalias_criticas: anomalias.filter(a => a.severidade === 'critica').length,
        anomalias_pendentes: anomalias.filter(a => !a.resolvido).length,
        saude_sistema: anomalias.length === 0 ? 'excelente' : 'precisa_atencao'
      }
    };

    logger.info('Dashboard consultado via API', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterDashboard'
      }
    });

    return res.status(200).json(dashboard);

  } catch (erro) {
    logger.error('Erro ao obter dashboard', {
      service: 'backend-api',
      context: {
        controller: 'analyticsController.obterDashboard',
        erro: erro.message
      }
    });

    return res.status(500).json({ erro: 'Erro ao carregar dashboard' });
  }
};
