const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const db = require('../config/db');

function generateJwt(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.company_id
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    }
  );
}

async function registerCompany({ name, cnpj, email, password }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (existingUsers.length > 0) {
      throw new Error('Este e-mail já está cadastrado.');
    }

    if (cnpj) {
      const [existingCompanies] = await connection.query(
        'SELECT id FROM companies WHERE cnpj = ? LIMIT 1',
        [cnpj]
      );

      if (existingCompanies.length > 0) {
        throw new Error('Este CNPJ já está cadastrado.');
      }
    }

    const [companyResult] = await connection.query(
      `
      INSERT INTO companies (name, cnpj)
      VALUES (?, ?)
      `,
      [name, cnpj || null]
    );

    const companyId = companyResult.insertId;

    const passwordHash = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      `
      INSERT INTO users (company_id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, 'empresa')
      `,
      [companyId, name, email, passwordHash]
    );

    await connection.commit();

    return {
      userId: userResult.insertId,
      companyId
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function registerStaffByInvite({ name, email, inviteCode, password }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (existingUsers.length > 0) {
      throw new Error('Este e-mail já está cadastrado.');
    }

    const [invites] = await connection.query(
      `
      SELECT
        id,
        name,
        email,
        invite_code,
        status,
        expires_at,
        used_at
      FROM staff_invites
      WHERE invite_code = ?
      LIMIT 1
      `,
      [inviteCode]
    );

    if (invites.length === 0) {
      throw new Error('Código de convite inválido.');
    }

    const invite = invites[0];

    if (invite.status !== 'active') {
      throw new Error('Código de convite inativo ou já utilizado.');
    }

    if (invite.used_at) {
      throw new Error('Código de convite já utilizado.');
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('Código de convite expirado.');
    }

    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      throw new Error('Este código de convite não pertence a este e-mail.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const userName = name || invite.name || email;

    const [userResult] = await connection.query(
      `
      INSERT INTO users (
        company_id,
        name,
        email,
        password_hash,
        role,
        status
      )
      VALUES (NULL, ?, ?, ?, 'colaborador', 'active')
      `,
      [userName, email, passwordHash]
    );

    const userId = userResult.insertId;

    await connection.query(
      `
      UPDATE staff_invites
      SET
        status = 'used',
        used_by_user_id = ?,
        used_at = NOW()
      WHERE id = ?
      `,
      [userId, invite.id]
    );

    await connection.commit();

    return {
      userId,
      role: 'colaborador'
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function login({ email, password }) {
  const [users] = await db.query(
    `
    SELECT
      id,
      company_id,
      name,
      email,
      password_hash,
      role,
      status
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  );

  if (users.length === 0) {
    throw new Error('E-mail ou senha inválidos.');
  }

  const user = users[0];

  if (user.status !== 'active') {
    throw new Error('Usuário inativo.');
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    throw new Error('E-mail ou senha inválidos.');
  }

  const token = generateJwt(user);

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.company_id
    }
  };
}

async function getUserById(userId) {
  const [users] = await db.query(
    `
    SELECT
      id,
      company_id,
      name,
      email,
      role,
      status
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [userId]
  );

  if (users.length === 0) {
    throw new Error('Usuário não encontrado.');
  }

  const user = users[0];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyId: user.company_id,
    status: user.status
  };
}

async function updateMe({ userId, name, email, password }) {
  if (!name || !email) {
    throw new Error('Nome e e-mail são obrigatórios.');
  }

  const [currentUsers] = await db.query(
    `
    SELECT id
    FROM users
    WHERE id = ?
    LIMIT 1
    `,
    [userId]
  );

  if (currentUsers.length === 0) {
    throw new Error('Usuário não encontrado.');
  }

  const [existingEmail] = await db.query(
    `
    SELECT id
    FROM users
    WHERE email = ?
      AND id <> ?
    LIMIT 1
    `,
    [email, userId]
  );

  if (existingEmail.length > 0) {
    throw new Error('Este e-mail já está sendo usado por outro usuário.');
  }

  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);

    await db.query(
      `
      UPDATE users
      SET
        name = ?,
        email = ?,
        password_hash = ?
      WHERE id = ?
      `,
      [name, email, passwordHash, userId]
    );
  } else {
    await db.query(
      `
      UPDATE users
      SET
        name = ?,
        email = ?
      WHERE id = ?
      `,
      [name, email, userId]
    );
  }

  return getUserById(userId);
}

async function requestPasswordReset(email) {
  const [users] = await db.query(
    `
    SELECT id, name, email
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  );

  if (users.length === 0) {
    return null;
  }

  const user = users[0];

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  const tokenHash = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

  await db.query(
    `
    INSERT INTO password_reset_tokens (user_id, token_hash, reset_code, expires_at)
    VALUES (?, ?, ?, ?)
    `,
    [user.id, tokenHash, resetCode, expiresAt]
  );

  return {
    user,
    resetCode
  };
}

async function resetPassword({ email, code, newPassword }) {
  const tokenHash = crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');

  const [users] = await db.query(
    `
    SELECT id
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  );

  if (users.length === 0) {
    throw new Error('Código inválido ou expirado.');
  }

  const user = users[0];

  const [tokens] = await db.query(
    `
    SELECT id, user_id, expires_at, used_at
    FROM password_reset_tokens
    WHERE user_id = ?
      AND token_hash = ?
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [user.id, tokenHash]
  );

  if (tokens.length === 0) {
    throw new Error('Código inválido ou expirado.');
  }

  const resetToken = tokens[0];

  if (resetToken.used_at) {
    throw new Error('Código já utilizado.');
  }

  if (new Date(resetToken.expires_at) < new Date()) {
    throw new Error('Código expirado.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.query(
    `
    UPDATE users
    SET password_hash = ?
    WHERE id = ?
    `,
    [passwordHash, resetToken.user_id]
  );

  await db.query(
    `
    UPDATE password_reset_tokens
    SET used_at = NOW()
    WHERE id = ?
    `,
    [resetToken.id]
  );

  return true;
}

module.exports = {
  registerCompany,
  registerStaffByInvite,
  login,
  getUserById,
  updateMe,
  requestPasswordReset,
  resetPassword
};