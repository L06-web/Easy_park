const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/kpis', analyticsController.obterKPIs);
router.get('/tendencia', analyticsController.obterTendencia);
router.get('/indicadores', analyticsController.obterIndicadores);
router.get('/horarios-pico', analyticsController.obterHorariosPico);

router.get('/padroes/:hora/:dia', analyticsController.obterPadrao);
router.post('/atualizar-padroes', analyticsController.atualizarPadroes);

router.get('/anomalias', analyticsController.obterAnomalias);
router.post('/anomalias/:id/resolver', analyticsController.resolverAnomalia);

router.get('/dashboard', analyticsController.obterDashboard);

module.exports = router;
