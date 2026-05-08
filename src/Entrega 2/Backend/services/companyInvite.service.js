const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../config/db');

function generateInviteCode() {
  return crypto.randomInt(100000, 999999).toString();
}

async function generateUniqueInviteCode(connection) {
  let inviteCode = generateInviteCode();
  let codeIsUnique = false;

  while (!codeIsUnique) {
    const [existingCodes] = await connection.query(
      `
      SELECT id
      FROM company_invites
      WHERE invite_code = ?
      LIMIT 1
      `,
      [inviteCode]
    );

    if (existingCodes.length === 0) {
      codeIsUnique = true;
    } else {
      inviteCode = generateInviteCode();
    }
  }

  return inviteCode;
}

async function createCompanyInvite({ companyId, email, invitedByUserId }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [companies] = await connection.query(
      `
      SELECT id, name, external_store_id
      FROM companies
      WHERE id = ?
      LIMIT 1
      `,
      [companyId]
    );

    if (companies.length === 0) {
      throw new Error('Empresa não encontrada.');
    }

    const company = companies[0];

    if (!company.external_store_id) {
      throw new Error('Empresa ainda não possui vínculo com o STORE.csv.');
    }

    const [existingUsers] = await connection.query(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [email]
    );

    if (existingUsers.length > 0) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    await connection.query(
      `
      UPDATE company_invites
      SET status = 'inactive'
      WHERE company_id = ?
        AND status = 'active'
        AND used_at IS NULL
      `,
      [companyId]
    );

    const inviteCode = await generateUniqueInviteCode(connection);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const [inviteResult] = await connection.query(
      `
      INSERT INTO company_invites (
        company_id,
        email,
        invite_code,
        status,
        expires_at
      )
      VALUES (?, ?, ?, 'active', ?)
      `,
      [companyId, email, inviteCode, expiresAt]
    );

    await connection.query(
      `
      UPDATE companies
      SET
        email = ?,
        invited_at = NOW()
      WHERE id = ?
      `,
      [email, companyId]
    );

    await connection.commit();

    return {
      inviteId: inviteResult.insertId,
      companyId,
      companyName: company.name,
      email,
      inviteCode,
      expiresAt
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function listCompanyInvites() {
  const [invites] = await db.query(
    `
    SELECT
      ci.id,
      ci.company_id,
      c.name AS company_name,
      c.external_store_id,
      ci.email,
      ci.invite_code,
      ci.status,
      ci.expires_at,
      ci.used_at,
      ci.used_by_user_id,
      ci.created_at
    FROM company_invites ci
    INNER JOIN companies c ON c.id = ci.company_id
    ORDER BY ci.created_at DESC
    `
  );

  return invites;
}

async function getCompanyInviteByCode(inviteCode) {
  const [invites] = await db.query(
    `
    SELECT
      ci.id,
      ci.company_id,
      ci.email,
      ci.invite_code,
      ci.status,
      ci.expires_at,
      ci.used_at,
      c.name AS company_name,
      c.external_store_id
    FROM company_invites ci
    INNER JOIN companies c ON c.id = ci.company_id
    WHERE ci.invite_code = ?
    LIMIT 1
    `,
    [inviteCode]
  );

  if (invites.length === 0) {
    throw new Error('Convite não encontrado.');
  }

  const invite = invites[0];

  if (invite.status !== 'active' || invite.used_at) {
    throw new Error('Convite inválido ou já utilizado.');
  }

  if (new Date(invite.expires_at) < new Date()) {
    throw new Error('Convite expirado.');
  }

  return invite;
}

async function acceptCompanyInvite({ inviteCode, name, cnpj, password }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [invites] = await connection.query(
      `
      SELECT
        ci.id,
        ci.company_id,
        ci.email,
        ci.status,
        ci.expires_at,
        ci.used_at,
        c.name AS company_name,
        c.external_store_id
      FROM company_invites ci
      INNER JOIN companies c ON c.id = ci.company_id
      WHERE ci.invite_code = ?
      LIMIT 1
      `,
      [inviteCode]
    );

    if (invites.length === 0) {
      throw new Error('Convite não encontrado.');
    }

    const invite = invites[0];

    if (invite.status !== 'active' || invite.used_at) {
      throw new Error('Convite inválido ou já utilizado.');
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('Convite expirado.');
    }

    if (!invite.external_store_id) {
      throw new Error('Empresa ainda não possui vínculo com a base analítica.');
    }

    const [existingUsers] = await connection.query(
      `
      SELECT id
      FROM users
      WHERE email = ?
      LIMIT 1
      `,
      [invite.email]
    );

    if (existingUsers.length > 0) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [userResult] = await connection.query(
      `
      INSERT INTO users (
        name,
        email,
        password_hash,
        role,
        company_id
      )
      VALUES (?, ?, ?, 'empresa', ?)
      `,
      [name, invite.email, passwordHash, invite.company_id]
    );

    const userId = userResult.insertId;

    await connection.query(
      `
      UPDATE companies
      SET
        cnpj = ?,
        email = ?,
        status = 'active',
        activated_at = NOW()
      WHERE id = ?
      `,
      [cnpj, invite.email, invite.company_id]
    );

    await connection.query(
      `
      UPDATE company_invites
      SET
        used_at = NOW(),
        used_by_user_id = ?,
        status = 'inactive'
      WHERE id = ?
      `,
      [userId, invite.id]
    );

    await connection.commit();

    return {
      userId,
      companyId: invite.company_id,
      companyName: invite.company_name,
      email: invite.email
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  createCompanyInvite,
  listCompanyInvites,
  getCompanyInviteByCode,
  acceptCompanyInvite
};