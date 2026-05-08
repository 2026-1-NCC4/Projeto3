const express = require('express');

const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');
const companyDashboardController = require('../controllers/companyDashboard.controller');

const router = express.Router();

router.get(
  '/',
  authMiddleware,
  allowRoles('empresa'),
  companyDashboardController.getCompanyDashboard
);

module.exports = router;