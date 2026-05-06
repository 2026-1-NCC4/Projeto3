const inviteService = require('../services/invite.service');
const { sendCollaboratorInviteEmail } = require('../utils/email');

function isValidEmail(email) {
  return email && email.includes('@') && email.includes('.');
}

async function createCollaboratorInvite(req, res) {
  try {
    const { name, email, companyId } = req.body;

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

    let targetCompanyId = req.user.companyId;

    if (req.user.role === 'admin') {
      if (!companyId) {
        return res.status(400).json({
          message: 'Para admin, o companyId é obrigatório.'
        });
      }

      targetCompanyId = companyId;
    }

    if (!targetCompanyId) {
      return res.status(403).json({
        message: 'Usuário não está vinculado a uma empresa.'
      });
    }

    const invite = await inviteService.createCollaboratorInvite({
      companyId: targetCompanyId,
      name,
      email
    });

    await sendCollaboratorInviteEmail({
      to: invite.email,
      name: invite.name,
      companyName: invite.companyName,
      inviteCode: invite.inviteCode
    });

    return res.status(201).json({
      message: 'Convite enviado com sucesso.',
      data: {
        inviteId: invite.inviteId,
        email: invite.email,
        expiresAt: invite.expiresAt
      }
    });
  } catch (error) {
    console.error('Erro ao criar convite:', error);

    return res.status(400).json({
      message: error.message || 'Erro ao criar convite.'
    });
  }
}

async function listCollaboratorInvites(req, res) {
  try {
    const invites = await inviteService.listCollaboratorInvites({
      companyId: req.user.companyId,
      isAdmin: req.user.role === 'admin'
    });

    return res.json({
      data: invites
    });
  } catch (error) {
    console.error('Erro ao listar convites:', error);

    return res.status(500).json({
      message: 'Erro ao listar convites.'
    });
  }
}

module.exports = {
  createCollaboratorInvite,
  listCollaboratorInvites
};