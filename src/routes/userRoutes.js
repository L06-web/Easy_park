const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/cadastrar', userController.cadastrarUsuario);
router.post('/login', userController.loginUsuario);

module.exports = router;
