const staffInviteService = require('../services/staffInvite.service');
const { sendStaffInviteEmail } = require('../utils/email');

function isValidEmail(email) {
  return email && email.includes('@') && email.includes('.');
}

function sendStaffInviteEmailInBackground(invite) {
  const startTime = Date.now();

  Promise.resolve()
    .then(() =>
      sendStaffInviteEmail({
        to: invite.email,
        name: invite.name,
        inviteCode: invite.inviteCode
      })
    )
    .then(() => {
      console.log('[EMAIL_STAFF_INVITE] E-mail enviado com sucesso.', {
        email: invite.email,
        inviteId: invite.inviteId,
        durationMs: Date.now() - startTime
      });
    })
    .catch((error) => {
      console.error('[EMAIL_STAFF_INVITE] Falha ao enviar e-mail em segundo plano.', {
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

async function createStaffInvite(req, res) {
  const startTime = Date.now();

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

    console.log('[STAFF_INVITE] Convite criado no banco.', {
      inviteId: invite.inviteId,
      email: invite.email,
      durationMs: Date.now() - startTime
    });

    sendStaffInviteEmailInBackground(invite);

    return res.status(201).json({
      message: 'Convite criado com sucesso. O envio do e-mail será processado em segundo plano.',
      data: {
        inviteId: invite.inviteId,
        name: invite.name,
        email: invite.email,
        expiresAt: invite.expiresAt
      }
    });
  } catch (error) {
    console.error('[STAFF_INVITE] Erro ao criar convite de colaborador Cannoli.', {
      message: error.message,
      stack: error.stack,
      durationMs: Date.now() - startTime
    });

    return res.status(400).json({
      message: error.message || 'Erro ao criar convite.'
    });
  }
}

async function listStaffInvites(req, res) {
  const startTime = Date.now();

  try {
    const invites = await staffInviteService.listStaffInvites();

    console.log('[STAFF_INVITE] Convites listados com sucesso.', {
      total: invites.length,
      durationMs: Date.now() - startTime
    });

    return res.json({
      data: invites
    });
  } catch (error) {
    console.error('[STAFF_INVITE] Erro ao listar convites de colaboradores Cannoli.', {
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
  createStaffInvite,
  listStaffInvites
};