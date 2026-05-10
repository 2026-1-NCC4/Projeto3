const nodemailer = require('nodemailer');

function getEmailConfig() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT) || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !user || !pass || !from) {
    throw new Error('Configuração de e-mail ausente. Verifique EMAIL_HOST, EMAIL_USER, EMAIL_PASS e EMAIL_FROM.');
  }

  return {
    host,
    port,
    user,
    pass,
    from
  };
}

function createTransporter() {
  const { host, port, user, pass } = getEmailConfig();

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    pool: false
  });
}

async function sendMailWithLog({ to, subject, html, context }) {
  const startTime = Date.now();

  try {
    const { from } = getEmailConfig();
    const transporter = createTransporter();

    console.log('[EMAIL] Iniciando envio.', {
      to,
      subject,
      context,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });

    console.log('[EMAIL] Enviado com sucesso.', {
      to,
      subject,
      context,
      messageId: info.messageId,
      durationMs: Date.now() - startTime
    });

    return info;
  } catch (error) {
    console.error('[EMAIL] Erro ao enviar e-mail.', {
      to,
      subject,
      context,
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      durationMs: Date.now() - startTime
    });

    throw error;
  }
}

async function sendPasswordResetEmail({ to, name, code }) {
  return sendMailWithLog({
    to,
    subject: 'Código de recuperação de senha - Cannoli CRM',
    context: 'password_reset',
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
  return sendMailWithLog({
    to,
    subject: 'Convite para acessar o Cannoli CRM',
    context: 'staff_invite',
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

async function sendCollaboratorInviteEmail({ to, name, companyName, inviteCode }) {
  return sendMailWithLog({
    to,
    subject: 'Convite para acessar o Cannoli CRM',
    context: 'collaborator_invite',
    html: `
      <p>Olá, ${name}.</p>

      <p>Você foi convidado(a) para acessar o painel da empresa <strong>${companyName}</strong> na plataforma Cannoli CRM.</p>

      <p>Use o código abaixo para criar sua conta:</p>

      <h2 style="letter-spacing: 4px;">${inviteCode}</h2>

      <p>Esse código expira em 7 dias.</p>

      <p>Para concluir o cadastro, acesse a plataforma, clique em <strong>Cadastre-se</strong>, escolha <strong>Colaborador da Empresa</strong> e informe esse código.</p>

      <p>Se você não esperava esse convite, ignore este e-mail.</p>
    `
  });
}

async function sendCompanyInviteEmail({ to, companyName, inviteCode }) {
  return sendMailWithLog({
    to,
    subject: 'Convite para ativar sua empresa no Cannoli CRM',
    context: 'company_invite',
    html: `
      <p>Olá.</p>

      <p>A empresa <strong>${companyName}</strong> foi convidada para acessar a plataforma Cannoli CRM.</p>

      <p>Use o código abaixo para ativar o cadastro da empresa:</p>

      <h2 style="letter-spacing: 4px;">${inviteCode}</h2>

      <p>Esse código expira em 7 dias.</p>

      <p>Para concluir o cadastro, acesse a plataforma, clique em <strong>Cadastre-se</strong>, escolha <strong>Empresa</strong> e informe esse código.</p>

      <p>Durante o cadastro, você deverá informar os dados do responsável, o CNPJ da empresa e criar uma senha de acesso.</p>

      <p>Se você não esperava esse convite, ignore este e-mail.</p>
    `
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendStaffInviteEmail,
  sendCollaboratorInviteEmail,
  sendCompanyInviteEmail
};