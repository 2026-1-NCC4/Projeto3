const inviteService = require('../services/invite.service');
const { sendCollaboratorInviteEmail } = require('../utils/email');

function isValidEmail(email) {
  return email && email.includes('@') && email.includes('.');
}

function sendCollaboratorInviteEmailInBackground(invite) {
  const startTime = Date.now();

  Promise.resolve()
    .then(() =>
      sendCollaboratorInviteEmail({
        to: invite.email,
        name: invite.name,
        companyName: invite.companyName,
        inviteCode: invite.inviteCode
      })
    )
    .then(() => {
      console.log('[EMAIL_CONVITE_COLABORADOR] E-mail enviado com sucesso.', {
        email: invite.email,
        inviteId: invite.inviteId,
        durationMs: Date.now() - startTime
      });
    })
    .catch((error) => {
      console.error('[EMAIL_CONVITE_COLABORADOR] Falha ao enviar e-mail em segundo plano.', {
        email: invite.email,
        inviteId: invite.inviteId,
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        durationMs: Date.now() - startTime
      });
    });
}

async function createCollaboratorInvite(req, res) {
  const startTime = Date.now();

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

    console.log('[CONVITE_COLABORADOR] Convite criado no banco.', {
      inviteId: invite.inviteId,
      email: invite.email,
      companyId: targetCompanyId,
      durationMs: Date.now() - startTime
    });

    sendCollaboratorInviteEmailInBackground(invite);

    return res.status(201).json({
      message: 'Convite criado com sucesso. O envio do e-mail será processado em segundo plano.',
      data: {
        inviteId: invite.inviteId,
        email: invite.email,
        expiresAt: invite.expiresAt
      }
    });
  } catch (error) {
    console.error('[CONVITE_COLABORADOR] Erro ao criar convite.', {
      message: error.message,
      stack: error.stack,
      durationMs: Date.now() - startTime
    });

    return res.status(400).json({
      message: error.message || 'Erro ao criar convite.'
    });
  }
}

async function listCollaboratorInvites(req, res) {
  const startTime = Date.now();

  try {
    const invites = await inviteService.listCollaboratorInvites({
      companyId: req.user.companyId,
      isAdmin: req.user.role === 'admin'
    });

    console.log('[CONVITE_COLABORADOR] Convites listados com sucesso.', {
      total: invites.length,
      durationMs: Date.now() - startTime
    });

    return res.json({
      data: invites
    });
  } catch (error) {
    console.error('[CONVITE_COLABORADOR] Erro ao listar convites.', {
      message: error.message,
      stack: error.stack,
      durationMs: Date.now() - startTime
    });

    return res.status(500).json({
      message: 'Erro ao listar convites.'
    });
  }
}

module.exports = {
  createCollaboratorInvite,
  listCollaboratorInvites
};