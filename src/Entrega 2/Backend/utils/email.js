const nodemailer = require('nodemailer');

function createTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Configuração de e-mail ausente.');
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendPasswordResetEmail({ to, name, code }) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Código de recuperação de senha - Cannoli CRM',
    html: `
      <p>Olá, ${name}.</p>

      <p>Recebemos uma solicitação para redefinir sua senha.</p>

      <p>Use o código abaixo para continuar:</p>

      <h2 style="letter-spacing: 4px;">${code}</h2>

      <p>Este código expira em 15 minutos.</p>

      <p>Se você não solicitou essa recuperação, ignore este e-mail.</p>
    `
  });
}

async function sendStaffInviteEmail({ to, name, inviteCode }) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Convite para acessar o Cannoli CRM',
    html: `
      <p>Olá, ${name}.</p>

      <p>Você foi convidado(a) para acessar o painel interno da Cannoli CRM.</p>

      <p>Use o código abaixo para criar sua conta:</p>

      <h2 style="letter-spacing: 4px;">${inviteCode}</h2>

      <p>Esse código expira em 7 dias.</p>

      <p>Para concluir o cadastro, acesse a plataforma, clique em <strong>Cadastre-se</strong>, escolha <strong>Colaborador Cannoli</strong> e informe esse código.</p>

      <p>Se você não esperava esse convite, ignore este e-mail.</p>
    `
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendStaffInviteEmail
};