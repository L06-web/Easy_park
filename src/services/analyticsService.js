/**
 * Analytics Service - Orquestra todas as análises
 * 
 * Responsável por:
 * - Disparar análises em tempo real quando eventos chegam
 * - Agendar tarefas periódicas (padrões, limpeza)
 * - Gerenciar alertas
 */

const cron = require('node-cron');
const supabase = require('../config/supabase');
const patternDetector = require('../analytics/patternDetector');
const anomalyDetector = require('../analytics/anomalyDetector');
const indicatorCalculator = require('../analytics/indicatorCalculator');
const logger = require('../../logger');
const { BRASILIA_TIME_ZONE, agoraBrasiliaISO } = require('../utils/brasiliaDate');

// Manter registro de subscriptions ativas
let subscriptions = [];
let scheduledTasks = [];

/**
 * Inicializa o serviço de análise
 * - Configura listeners de eventos
 * - Agenda tarefas periódicas
 */
function inicializarServico() {
  try {
    if (scheduledTasks.length > 0) {
      logger.info('Analytics Service já estava inicializado', {
        service: 'analytics',
        context: {
          tarefas_agendadas: scheduledTasks.length
        }
      });
      return;
    }

    logger.info('Inicializando Analytics Service', {
      service: 'analytics'
    });

    // 1. Agendar atualização de padrões (a cada 6 horas)
    const taskPadroes = cron.schedule('0 */6 * * *', async () => {
      logger.info('Executando atualização periódica de padrões', {
        service: 'analytics'
      });

      try {
        const resultado = await patternDetector.atualizarTodosPadroes();
        logger.info('Atualização de padrões concluída', {
          service: 'analytics',
          context: {
            padroes_atualizados: resultado.atualizados
          }
        });
      } catch (erro) {
        logger.error('Erro na atualização periódica de padrões', {
          service: 'analytics',
          context: { erro: erro.message }
        });
      }
    }, { timezone: BRASILIA_TIME_ZONE });

    scheduledTasks.push(taskPadroes);

    // 2. Agendar verificação de anomalias (a cada 5 minutos)
    const taskAnomalias = cron.schedule('*/5 * * * *', async () => {
      logger.info('Executando verificação de anomalias', {
        service: 'analytics'
      });

      try {
        await anomalyDetector.detectarInatividade();
        await anomalyDetector.detectarPicosAnormais();
      } catch (erro) {
        logger.error('Erro na verificação de anomalias', {
          service: 'analytics',
          context: { erro: erro.message }
        });
      }
    }, { timezone: BRASILIA_TIME_ZONE });

    scheduledTasks.push(taskAnomalias);

    // 3. Agendar agregação de indicadores (a cada hora)
    const taskIndicadores = cron.schedule('0 * * * *', async () => {
      logger.info('Agregando indicadores horários', {
        service: 'analytics'
      });

      try {
        const indicador = await indicatorCalculator.calcularIndicadorHorario();
        logger.info('Indicador horário calculado', {
          service: 'analytics',
          context: {
            taxa_ocupacao: indicador.taxa_ocupacao
          }
        });
      } catch (erro) {
        logger.error('Erro ao agregar indicadores', {
          service: 'analytics',
          context: { erro: erro.message }
        });
      }
    }, { timezone: BRASILIA_TIME_ZONE });

    scheduledTasks.push(taskIndicadores);

    logger.info('Analytics Service inicializado com sucesso', {
      service: 'analytics',
      context: {
        tarefas_agendadas: scheduledTasks.length
      }
    });

  } catch (erro) {
    logger.error('Erro ao inicializar Analytics Service', {
      service: 'analytics',
      context: { erro: erro.message }
    });
    throw erro;
  }
}

/**
 * Processa um evento quando uma vaga muda de status
 * 
 * Chamado desde o controller quando POST /api/vagas/:id/status
 */
async function processarEventoVaga(evento) {
  try {
    logger.debug('Processando evento de vaga', {
      service: 'analytics',
      context: {
        id_vaga: evento.id_vaga,
        status: evento.status_novo
      }
    });

    // 1. Validar evento e detectar anomalias
    const anomalias = await anomalyDetector.validarEvento(evento);

    if (anomalias.length > 0) {
      logger.warn('Anomalias detectadas', {
        service: 'analytics',
        context: {
          id_vaga: evento.id_vaga,
          anomalias_detectadas: anomalias.length,
          tipos: anomalias.map(a => a.tipo)
        }
      });

      // Notificar clientes em tempo real
      emitirAnomalias(anomalias);
    }

    return {
      sucesso: true,
      anomalias_detectadas: anomalias.length
    };

  } catch (erro) {
    logger.error('Erro ao processar evento de vaga', {
      service: 'analytics',
      context: {
        id_vaga: evento.id_vaga,
        erro: erro.message
      }
    });
    throw erro;
  }
}

/**
 * Registra a mudança no histórico analítico e dispara validações.
 *
 * Este método é usado por eventos vindos do Arduino e por ações manuais
 * de reserva/liberação. Falhas no analytics são registradas, mas não devem
 * bloquear a operação principal da vaga.
 */
async function registrarEventoVaga(evento) {
  const timestamp = evento.timestamp || agoraBrasiliaISO();
  const idVaga = Number(evento.id_vaga);

  try {
    const duracaoOcupacao = evento.duracao_ocupacao ?? await calcularDuracaoOcupacao(
      idVaga,
      evento.status_anterior,
      evento.status_novo,
      timestamp
    );

    const registro = {
      id_vaga: idVaga,
      status_anterior: evento.status_anterior,
      status_novo: evento.status_novo,
      timestamp,
      duracao_ocupacao: duracaoOcupacao,
      sensor_id: evento.sensor_id ? String(evento.sensor_id) : null
    };

    const { error } = await supabase
      .from('vaga_historico')
      .insert([registro]);

    if (error) throw error;

    return await processarEventoVaga(registro);

  } catch (erro) {
    logger.error('Erro ao registrar evento analítico da vaga', {
      service: 'analytics',
      context: {
        id_vaga: idVaga,
        erro: erro.message
      }
    });

    return {
      sucesso: false,
      erro: erro.message,
      anomalias_detectadas: 0
    };
  }
}

async function calcularDuracaoOcupacao(idVaga, statusAnterior, statusNovo, timestampFinal) {
  if (statusAnterior !== 'O' || statusNovo === 'O') {
    return 0;
  }

  const { data: ultimaOcupacao, error } = await supabase
    .from('vaga_historico')
    .select('timestamp')
    .eq('id_vaga', idVaga)
    .eq('status_novo', 'O')
    .lt('timestamp', timestampFinal)
    .order('timestamp', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!ultimaOcupacao?.timestamp) return 0;

  const inicio = new Date(ultimaOcupacao.timestamp).getTime();
  const fim = new Date(timestampFinal).getTime();

  if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim <= inicio) {
    return 0;
  }

  return Math.round((fim - inicio) / 60000);
}

/**
 * Emite anomalias para clientes conectados (via WebSocket)
 * 
 * TODO: Implementar WebSocket com Socket.io
 */
function emitirAnomalias(anomalias) {
  anomalias.forEach(anomalia => {
    if (anomalia.severidade === 'critica') {
      logger.warn('🚨 ALERTA CRÍTICO', {
        service: 'analytics',
        context: {
          tipo: anomalia.tipo,
          id_vaga: anomalia.id_vaga,
          descricao: anomalia.descricao
        }
      });

      // TODO: Enviar notificação push ao admin
    }
  });
}

/**
 * Para todos os agendamentos (útil para testes/shutdown)
 */
function pararServico() {
  try {
    scheduledTasks.forEach(task => task.stop());
    scheduledTasks = [];
    logger.info('Analytics Service parado', {
      service: 'analytics',
      context: {
        tarefas_paradas: scheduledTasks.length
      }
    });
  } catch (erro) {
    logger.error('Erro ao parar Analytics Service', {
      service: 'analytics',
      context: { erro: erro.message }
    });
  }
}

module.exports = {
  inicializarServico,
  registrarEventoVaga,
  processarEventoVaga,
  emitirAnomalias,
  pararServico
};
