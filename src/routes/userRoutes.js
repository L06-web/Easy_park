const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/cadastrar', userController.cadastrarUsuario);

module.exports = router;