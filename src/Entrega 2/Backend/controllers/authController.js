const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { conexao, query } = require('../config/database');
const { validarSenhaForte } = require('../utils/passwordValidator');


const login = async (req, res) => {
  try {
    const { email, senha, lembrar } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    
    conexao.query(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()],
      async (err, results) => {
        if (err) {
          console.error('Erro no banco:', err);
          return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
          });
        }

        if (results.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'Email ou senha incorretos'
          });
        }

        const usuario = results[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        
        if (!senhaValida) {
          return res.status(401).json({
            success: false,
            message: 'Email ou senha incorretos'
          });
        }

        // Atualizar last_login
        conexao.query(
          'UPDATE users SET last_login = NOW() WHERE id = ?',
          [usuario.id]
        );

        const expiresIn = lembrar ? '30d' : '7d';
        const token = jwt.sign(
          { id: usuario.id, email: usuario.email, nome: usuario.nome, tipo: usuario.tipo },
          process.env.JWT_SECRET,
          { expiresIn }
        );

        const { senha: _, ...usuarioSemSenha } = usuario;

        res.json({
          success: true,
          message: 'Login realizado com sucesso!',
          token,
          usuario: usuarioSemSenha
        });
      }
    );

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Cadastro
const cadastro = async (req, res) => {
  try {
    const { nome, email, senha, confirmarSenha } = req.body;

    if (!nome || !email || !senha || !confirmarSenha) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    if (nome.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Nome deve ter pelo menos 3 caracteres'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    if (senha !== confirmarSenha) {
      return res.status(400).json({
        success: false,
        message: 'As senhas não coincidem'
      });
    }

    const validacaoSenha = validarSenhaForte(senha);
    if (!validacaoSenha.isValid) {
      return res.status(400).json({
        success: false,
        message: validacaoSenha.message
      });
    }

    // Verificar se email já existe
    conexao.query(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()],
      async (err, results) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Erro ao verificar email'
          });
        }

        if (results.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Este email já está cadastrado'
          });
        }

        const salt = await bcrypt.genSalt(12);
        const senhaCriptografada = await bcrypt.hash(senha, salt);

        conexao.query(
          'INSERT INTO users (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
          [nome.trim(), email.toLowerCase(), senhaCriptografada, 'estudante'],
          (err, result) => {
            if (err) {
              console.error('Erro ao inserir:', err);
              return res.status(500).json({
                success: false,
                message: 'Erro ao criar usuário'
              });
            }

            const novoUsuario = {
              id: result.insertId,
              nome: nome.trim(),
              email: email.toLowerCase(),
              tipo: 'estudante'
            };

            res.status(201).json({
              success: true,
              message: 'Conta criada com sucesso!',
              usuario: novoUsuario
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Verificar token
const verificarToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    conexao.query(
      'SELECT id, nome, email, tipo, created_at FROM users WHERE id = ?',
      [decoded.id],
      (err, results) => {
        if (err || results.length === 0) {
          return res.status(401).json({
            success: false,
            message: 'Usuário não encontrado'
          });
        }

        res.json({
          success: true,
          usuario: results[0]
        });
      }
    );

  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado'
    });
  }
};

// Logout
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });
};

module.exports = {
  login,
  cadastro,
  verificarToken,
  logout
};