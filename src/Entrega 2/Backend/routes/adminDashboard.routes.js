const express = require('express');

const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');
const adminDashboardController = require('../controllers/adminDashboard.controller');

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  allowRoles('admin', 'colaborador'),
  adminDashboardController.getAdminDashboard
);

module.exports = router;