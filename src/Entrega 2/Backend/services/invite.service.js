const crypto = require('crypto');
const db = require('../config/db');

function generateInviteCode() {
  return crypto.randomInt(100000, 999999).toString();
}

async function createCollaboratorInvite({ companyId, name, email }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [companies] = await connection.query(
      `
      SELECT id, name
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
      UPDATE collaborator_invites
      SET status = 'inactive'
      WHERE email = ?
        AND company_id = ?
        AND status = 'active'
        AND used_at IS NULL
      `,
      [email, companyId]
    );

    let inviteCode = generateInviteCode();
    let codeIsUnique = false;

    while (!codeIsUnique) {
      const [existingCodes] = await connection.query(
        `
        SELECT id
        FROM collaborator_invites
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

    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const [inviteResult] = await connection.query(
      `
      INSERT INTO collaborator_invites (
        company_id,
        name,
        email,
        invite_code,
        status,
        expires_at
      )
      VALUES (?, ?, ?, ?, 'active', ?)
      `,
      [companyId, name, email, inviteCode, expiresAt]
    );

    await connection.commit();

    return {
      inviteId: inviteResult.insertId,
      companyId,
      companyName: company.name,
      name,
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

async function listCollaboratorInvites({ companyId, isAdmin }) {
  let query = `
    SELECT
      ci.id,
      ci.company_id,
      c.name AS company_name,
      ci.name,
      ci.email,
      ci.invite_code,
      ci.status,
      ci.expires_at,
      ci.used_at,
      ci.created_at
    FROM collaborator_invites ci
    INNER JOIN companies c ON c.id = ci.company_id
  `;

  const params = [];

  if (!isAdmin) {
    query += ` WHERE ci.company_id = ? `;
    params.push(companyId);
  }

  query += ` ORDER BY ci.created_at DESC `;

  const [invites] = await db.query(query, params);

  return invites;
}

module.exports = {
  createCollaboratorInvite,
  listCollaboratorInvites
};