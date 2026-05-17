const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');

// Rota para listar todas as vagas
router.get('/status', parkingController.listarVagas);
router.post('/:id/reservar', parkingController.reservarVaga);
router.post('/:id/liberar', parkingController.liberarVaga);

module.exports = router;
