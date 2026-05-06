const express = require('express');

const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');
const inviteController = require('../controllers/invite.controller');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  allowRoles('admin'),
  inviteController.createCollaboratorInvite
);

router.get(
  '/',
  authMiddleware,
  allowRoles('admin'),
  inviteController.listCollaboratorInvites
);

module.exports = router;