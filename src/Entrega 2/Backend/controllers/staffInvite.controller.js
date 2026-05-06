const staffInviteService = require('../services/staffInvite.service');
const { sendStaffInviteEmail } = require('../utils/email');

function isValidEmail(email) {
  return email && email.includes('@') && email.includes('.');
}

async function createStaffInvite(req, res) {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: 'Nome e e-mail do colaborador são obrigatórios.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'E-mail inválido.'
      });
    }

    const invite = await staffInviteService.createStaffInvite({
      name,
      email
    });

    await sendStaffInviteEmail({
      to: invite.email,
      name: invite.name,
      inviteCode: invite.inviteCode
    });

    return res.status(201).json({
      message: 'Convite enviado com sucesso.',
      data: {
        inviteId: invite.inviteId,
        name: invite.name,
        email: invite.email,
        expiresAt: invite.expiresAt
      }
    });
  } catch (error) {
    console.error('Erro ao criar convite de colaborador Cannoli:', error);

    return res.status(400).json({
      message: error.message || 'Erro ao criar convite.'
    });
  }
}

async function listStaffInvites(req, res) {
  try {
    const invites = await staffInviteService.listStaffInvites();

    return res.json({
      data: invites
    });
  } catch (error) {
    console.error('Erro ao listar convites de colaboradores Cannoli:', error);

    return res.status(500).json({
      message: 'Erro ao listar convites.'
    });
  }
}

module.exports = {
  createStaffInvite,
  listStaffInvites
};