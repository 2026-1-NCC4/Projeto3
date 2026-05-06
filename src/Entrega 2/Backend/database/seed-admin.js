require('dotenv').config();

const bcrypt = require('bcrypt');
const db = require('../config/db');

async function seedAdmin() {
  try {
    const adminName = 'Cannoli CRM';
    const adminEmail = 'admin@cannolicrm.com';
    const adminPassword = 'Admin@123';

    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [adminEmail]
    );

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    if (existingUsers.length > 0) {
      await db.query(
        `
        UPDATE users
        SET
          company_id = NULL,
          name = ?,
          password_hash = ?,
          role = 'admin',
          status = 'active'
        WHERE email = ?
        `,
        [adminName, passwordHash, adminEmail]
      );

      console.log('Admin Cannoli CRM já existia e foi atualizado.');
      console.log('E-mail:', adminEmail);
      console.log('Senha:', adminPassword);

      process.exit(0);
    }

    await db.query(
      `
      INSERT INTO users (
        company_id,
        name,
        email,
        password_hash,
        role,
        status
      )
      VALUES (NULL, ?, ?, ?, 'admin', 'active')
      `,
      [adminName, adminEmail, passwordHash]
    );

    console.log('Admin Cannoli CRM criado com sucesso.');
    console.log('E-mail:', adminEmail);
    console.log('Senha:', adminPassword);

    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar admin:', error);
    process.exit(1);
  }
}

seedAdmin();