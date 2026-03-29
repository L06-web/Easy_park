const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');

// Rota para listar todas as vagas
router.get('/status', parkingController.listarVagas);

module.exports = router;