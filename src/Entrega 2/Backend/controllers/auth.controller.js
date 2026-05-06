const authService = require('../services/auth.service');
const { sendPasswordResetEmail } = require('../utils/email');

function isStrongPassword(password) {
  return (
    password &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  );
}

function isValidEmail(email) {
  return email && email.includes('@') && email.includes('.');
}

async function registerCompany(req, res) {
  try {
    const { name, cnpj, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Nome da empresa, e-mail e senha são obrigatórios.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'E-mail inválido.'
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          'A senha deve ter no mínimo 8 caracteres, letra maiúscula, letra minúscula, número e caractere especial.'
      });
    }

    const cleanCnpj = cnpj ? String(cnpj).replace(/\D/g, '') : null;

    if (cleanCnpj && cleanCnpj.length !== 14) {
      return res.status(400).json({
        message: 'CNPJ inválido.'
      });
    }

    const result = await authService.registerCompany({
      name,
      cnpj: cleanCnpj,
      email,
      password
    });

    return res.status(201).json({
      message: 'Empresa cadastrada com sucesso.',
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
}

async function registerStaffByInvite(req, res) {
  try {
    const { name, email, inviteCode, password } = req.body;

    if (!name || !email || !inviteCode || !password) {
      return res.status(400).json({
        message: 'Nome, e-mail, código de convite e senha são obrigatórios.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'E-mail inválido.'
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          'A senha deve ter no mínimo 8 caracteres, letra maiúscula, letra minúscula, número e caractere especial.'
      });
    }

    const result = await authService.registerStaffByInvite({
      name,
      email,
      inviteCode,
      password
    });

    return res.status(201).json({
      message: 'Colaborador Cannoli cadastrado com sucesso.',
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'E-mail e senha são obrigatórios.'
      });
    }

    const result = await authService.login({
      email,
      password
    });

    return res.json({
      message: 'Login realizado com sucesso.',
      data: result
    });
  } catch (error) {
    return res.status(401).json({
      message: error.message
    });
  }
}

async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: 'E-mail é obrigatório.'
      });
    }

    const result = await authService.requestPasswordReset(email);

    if (result) {
      await sendPasswordResetEmail({
        to: result.user.email,
        name: result.user.name,
        code: result.resetCode
      });
    }

    return res.json({
      message: 'Se o e-mail existir, enviaremos o código de recuperação.'
    });
  } catch (error) {
    console.error('Erro em requestPasswordReset:', error);

    return res.status(500).json({
      message: 'Erro ao solicitar recuperação de senha.'
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        message: 'E-mail, código e nova senha são obrigatórios.'
      });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          'A senha deve ter no mínimo 8 caracteres, letra maiúscula, letra minúscula, número e caractere especial.'
      });
    }

    await authService.resetPassword({
      email,
      code,
      newPassword
    });

    return res.json({
      message: 'Senha redefinida com sucesso.'
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
}

async function me(req, res) {
  try {
    const user = await authService.getUserById(req.user.id);

    return res.json({
      user
    });
  } catch (error) {
    return res.status(404).json({
      message: error.message
    });
  }
}

async function updateMe(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: 'Nome e e-mail são obrigatórios.'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        message: 'E-mail inválido.'
      });
    }

    if (password && !isStrongPassword(password)) {
      return res.status(400).json({
        message:
          'A senha deve ter no mínimo 8 caracteres, letra maiúscula, letra minúscula, número e caractere especial.'
      });
    }

    const user = await authService.updateMe({
      userId: req.user.id,
      name,
      email,
      password
    });

    return res.json({
      message: 'Perfil atualizado com sucesso.',
      user
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
}

module.exports = {
  registerCompany,
  registerStaffByInvite,
  login,
  requestPasswordReset,
  resetPassword,
  me,
  updateMe
};