const express = require('express');

const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');
const companyController = require('../controllers/company.controller');

const router = express.Router();

router.get(
  '/invite-options',
  authMiddleware,
  allowRoles('admin', 'colaborador'),
  companyController.listCompaniesForInvite
);

module.exports = router;