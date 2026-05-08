const companyInviteService = require('../services/companyInvite.service');
const { sendCompanyInviteEmail } = require('../utils/email');

function isValidEmail(email) {
  return email && email.includes('@') && email.includes('.');
}

function usuarioPodeConvidarEmpresa(req) {
  return req.user && ['admin', 'colaborador'].includes(req.user.role);
}

async function createCompanyInvite(req, res) {
  try {
    if (!usuarioPodeConvidarEmpresa(req)) {
      return res.status(403).json({
        message: 'Acesso não autorizado para convidar empresas.'
      });
    }

    const { companyId, email } = req.body;

    if (!companyId || !email) {
      return res.status(400).json({
        message: 'Empresa e e-mail são obrigatórios.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'E-mail inválido.'
      });
    }

    const invite = await companyInviteService.createCompanyInvite({
      companyId,
      email,
      invitedByUserId: req.user.id
    });

    if (sendCompanyInviteEmail) {
      await sendCompanyInviteEmail({
        to: invite.email,
        companyName: invite.companyName,
        inviteCode: invite.inviteCode
      });
    }

    return res.status(201).json({
      message: 'Convite de empresa criado com sucesso.',
      data: {
        inviteId: invite.inviteId,
        companyId: invite.companyId,
        companyName: invite.companyName,
        email: invite.email,
        inviteCode: invite.inviteCode,
        expiresAt: invite.expiresAt
      }
    });
  } catch (error) {
    console.error('Erro ao criar convite de empresa:', error);

    return res.status(400).json({
      message: error.message || 'Erro ao criar convite de empresa.'
    });
  }
}

async function listCompanyInvites(req, res) {
  try {
    if (!usuarioPodeConvidarEmpresa(req)) {
      return res.status(403).json({
        message: 'Acesso não autorizado para listar convites de empresa.'
      });
    }

    const invites = await companyInviteService.listCompanyInvites();

    return res.json({
      data: invites
    });
  } catch (error) {
    console.error('Erro ao listar convites de empresa:', error);

    return res.status(500).json({
      message: 'Erro ao listar convites de empresa.'
    });
  }
}

async function getCompanyInviteByCode(req, res) {
  try {
    const { inviteCode } = req.params;

    const invite = await companyInviteService.getCompanyInviteByCode(inviteCode);

    return res.json({
      message: 'Convite válido.',
      data: {
        companyId: invite.company_id,
        companyName: invite.company_name,
        email: invite.email,
        expiresAt: invite.expires_at
      }
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message || 'Convite inválido.'
    });
  }
}

async function acceptCompanyInvite(req, res) {
  try {
    const { inviteCode } = req.params;
    const { name, cnpj, password, confirmPassword } = req.body;

    if (!name || !cnpj || !password) {
      return res.status(400).json({
        message: 'Nome, CNPJ e senha são obrigatórios.'
      });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({
        message: 'A confirmação de senha não confere.'
      });
    }

    const result = await companyInviteService.acceptCompanyInvite({
      inviteCode,
      name,
      cnpj,
      password
    });

    return res.status(201).json({
      message: 'Empresa ativada com sucesso. Você já pode fazer login.',
      data: result
    });
  } catch (error) {
    console.error('Erro ao aceitar convite de empresa:', error);

    return res.status(400).json({
      message: error.message || 'Erro ao aceitar convite de empresa.'
    });
  }
}

module.exports = {
  createCompanyInvite,
  listCompanyInvites,
  getCompanyInviteByCode,
  acceptCompanyInvite
};