const crypto = require('crypto');
const db = require('../config/db');

function generateInviteCode() {
  return crypto.randomInt(100000, 999999).toString();
}

async function createStaffInvite({ name, email }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

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
      UPDATE staff_invites
      SET status = 'inactive'
      WHERE email = ?
        AND status = 'active'
        AND used_at IS NULL
      `,
      [email]
    );

    let inviteCode = generateInviteCode();
    let codeIsUnique = false;

    while (!codeIsUnique) {
      const [existingCodes] = await connection.query(
        `
        SELECT id
        FROM staff_invites
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
      INSERT INTO staff_invites (
        name,
        email,
        invite_code,
        status,
        expires_at
      )
      VALUES (?, ?, ?, 'active', ?)
      `,
      [name, email, inviteCode, expiresAt]
    );

    await connection.commit();

    return {
      inviteId: inviteResult.insertId,
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

async function listStaffInvites() {
  const [invites] = await db.query(
    `
    SELECT
      id,
      name,
      email,
      invite_code,
      status,
      used_by_user_id,
      expires_at,
      used_at,
      created_at
    FROM staff_invites
    ORDER BY created_at DESC
    `
  );

  return invites;
}

module.exports = {
  createStaffInvite,
  listStaffInvites
};