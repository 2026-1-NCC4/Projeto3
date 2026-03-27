const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

// Rotas públicas
router.post('/login', authController.login);
router.post('/cadastro', validationMiddleware, authController.cadastro);

// Rotas protegidas (precisa de token)
router.get('/verificar', authMiddleware, authController.verificarToken);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;