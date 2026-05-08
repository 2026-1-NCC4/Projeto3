const express = require('express');

const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');
const companyInviteController = require('../controllers/companyInvite.controller');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  allowRoles('admin', 'colaborador'),
  companyInviteController.createCompanyInvite
);

router.get(
  '/',
  authMiddleware,
  allowRoles('admin', 'colaborador'),
  companyInviteController.listCompanyInvites
);

router.get(
  '/:inviteCode',
  companyInviteController.getCompanyInviteByCode
);

router.post(
  '/:inviteCode/accept',
  companyInviteController.acceptCompanyInvite
);

module.exports = router;