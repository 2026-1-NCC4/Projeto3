const validarSenhaForte = (senha) => {
  // Verificar tamanho mínimo
  if (senha.length < 6) {
    return {
      isValid: false,
      message: 'A senha deve ter pelo menos 6 caracteres'
    };
  }

  // Verificar se tem letra maiúscula
  if (!/[A-Z]/.test(senha)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos uma letra maiúscula'
    };
  }

  // Verificar se tem letra minúscula
  if (!/[a-z]/.test(senha)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos uma letra minúscula'
    };
  }

  // Verificar se tem número
  if (!/[0-9]/.test(senha)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos um número'
    };
  }

  // Verificar se tem caractere especial
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
    return {
      isValid: false,
      message: 'A senha deve conter pelo menos um caractere especial (!@#$%^&*)'
    };
  }

  return {
    isValid: true,
    message: 'Senha válida'
  };
};

module.exports = { validarSenhaForte };