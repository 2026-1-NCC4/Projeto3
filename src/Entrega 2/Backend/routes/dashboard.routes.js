const express = require('express');

const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

router.get(
  '/admin/overview',
  authMiddleware,
  allowRoles('admin'),
  dashboardController.getAdminOverview
);

router.get(
  '/empresa/overview',
  authMiddleware,
  allowRoles('empresa'),
  dashboardController.getCompanyOverview
);

module.exports = router;