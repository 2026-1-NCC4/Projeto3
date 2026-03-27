const validationMiddleware = (req, res, next) => {
  const { nome, email, senha, confirmarSenha } = req.body;


  if (!email || !senha) {
    return res.status(400).json({
      success: false,
      message: 'Email e senha são obrigatórios'
    });
  }

  if (nome) {
    if (nome.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Nome deve ter pelo menos 3 caracteres'
      });
    }

    if (!confirmarSenha) {
      return res.status(400).json({
        success: false,
        message: 'Confirmação de senha é obrigatória'
      });
    }

    if (senha !== confirmarSenha) {
      return res.status(400).json({
        success: false,
        message: 'As senhas não coincidem'
      });
    }

    if (senha.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres'
      });
    }
  }

  // Validar email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Email inválido'
    });
  }

  next();
};

module.exports = validationMiddleware;