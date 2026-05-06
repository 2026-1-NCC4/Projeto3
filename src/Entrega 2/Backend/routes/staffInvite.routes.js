const express = require('express');

const authMiddleware = require('../middlewares/auth.middleware');
const allowRoles = require('../middlewares/role.middleware');
const staffInviteController = require('../controllers/staffInvite.controller');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  allowRoles('admin'),
  staffInviteController.createStaffInvite
);

router.get(
  '/',
  authMiddleware,
  allowRoles('admin'),
  staffInviteController.listStaffInvites
);

module.exports = router;