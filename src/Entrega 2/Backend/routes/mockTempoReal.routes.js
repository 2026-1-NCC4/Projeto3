const express = require('express');

const authMiddleware = require('../middlewares/auth.middleware');
const mockTempoRealController = require('../controllers/mockTempoReal.controller');

const router = express.Router();

router.post(
  '/gerar-pedidos',
  authMiddleware,
  mockTempoRealController.gerarPedidosMock
);

module.exports = router;