const express = require('express');

const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');
const mockTempoRealController = require('../controllers/mockTempoReal.controller');

const router = express.Router();

router.post(
  '/gerar-pedidos',
  authMiddleware,
  allowRoles('admin', 'colaborador'),
  mockTempoRealController.gerarPedidos
);

router.post(
  '/atualizar-dados',
  authMiddleware,
  allowRoles('admin', 'colaborador'),
  mockTempoRealController.atualizarDados
);

module.exports = router;