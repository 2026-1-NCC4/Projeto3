const express = require('express');

const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');
const adminConfigController = require('../controllers/adminConfig.controller');

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  allowRoles('admin', 'colaborador'),
  adminConfigController.getAdminConfig
);

router.put(
  '/',
  authMiddleware,
  allowRoles('admin'),
  adminConfigController.updateAdminConfig
);

router.post(
  '/reset',
  authMiddleware,
  allowRoles('admin'),
  adminConfigController.resetAdminConfig
);

module.exports = router;