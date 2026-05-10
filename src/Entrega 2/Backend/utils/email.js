const axios = require('axios');

function parseEmailFrom() {
  const from = process.env.EMAIL_FROM || 'Cannoli CRM <estherjaeg@gmail.com>';

  const match = from.match(/^(.*?)\s*<(.+?)>$/);

  if (match) {
    return {
      name: match[1].trim() || 'Cannoli CRM',
      email: match[2].trim()
    };
  }

  return {
    name: 'Cannoli CRM',
    email: from.trim()
  };
}

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    throw new Error('BREVO_API_KEY não configurada no ambiente.');
  }

  const sender = parseEmailFrom();

  if (!sender.email) {
    throw new Error('EMAIL_FROM não configurado corretamente.');
  }

  return {
    apiKey,
    sender
  };
}

async function sendMailWithLog({ to, subject, html, context }) {
  const startTime = Date.now();

  try {
    const { apiKey, sender } = getBrevoConfig();

    console.log('[EMAIL_API] Iniciando envio via Brevo API.', {
      to,
      subject,
      context,
      sender: sender.email
    });

    const response = await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: sender.name,
          email: sender.email
        },
        to: [
          {
            email: to
          }
        ],
        subject,
        htmlContent: html
      },
      {
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('[EMAIL_API] E-mail enviado com sucesso.', {
      to,
      subject,
      context,
      messageId: response.data?.messageId,
      durationMs: Date.now() - startTime
    });

    return response.data;
  } catch (error) {
    console.error('[EMAIL_API] Erro ao enviar e-mail via Brevo API.', {
      to,
      subject,
      context,
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
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