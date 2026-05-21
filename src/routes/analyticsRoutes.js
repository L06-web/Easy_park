/**
 * Analytics Routes
 * 
 * Endpoints para análise, padrões, anomalias e indicadores
 */

const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

/**
 * KPIs e Indicadores
 */
router.get('/kpis', analyticsController.obterKPIs);
router.get('/tendencia', analyticsController.obterTendencia);
router.get('/indicadores', analyticsController.obterIndicadores);
router.get('/horarios-pico', analyticsController.obterHorariosPico);

/**
 * Padrões
 */
router.get('/padroes/:hora/:dia', analyticsController.obterPadrao);
router.post('/atualizar-padroes', analyticsController.atualizarPadroes);

/**
 * Anomalias
 */
router.get('/anomalias', analyticsController.obterAnomalias);
router.post('/anomalias/:id/resolver', analyticsController.resolverAnomalia);

/**
 * Dashboard Consolidado
 */
router.get('/dashboard', analyticsController.obterDashboard);

module.exports = router;
