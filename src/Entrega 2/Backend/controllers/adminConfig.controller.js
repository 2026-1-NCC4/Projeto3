const db = require('../config/db');

const configPadrao = {
  nomePlataforma: 'Cannoli CRM',
  emailSuporte: 'suporte@cannolicrm.com',
  limiteRecorrencia: 25,
  limiteTicketMedio: 40,
  limiteQuedaReceita: 15,
  alertasCriticos: true,
  recalculoAutomatico: true,
  permitirConvites: true
};

function formatarConfig(row) {
  return {
    nomePlataforma: row.nome_plataforma,
    emailSuporte: row.email_suporte,
    limiteRecorrencia: Number(row.limite_recorrencia),
    limiteTicketMedio: Number(row.limite_ticket_medio),
    limiteQuedaReceita: Number(row.limite_queda_receita),
    alertasCriticos: Boolean(row.alertas_criticos),
    recalculoAutomatico: Boolean(row.recalculo_automatico),
    permitirConvites: Boolean(row.permitir_convites)
  };
}

async function garantirConfigPadrao() {
  const [rows] = await db.query(
    `
    SELECT id
    FROM admin_settings
    WHERE id = 1
    LIMIT 1
    `
  );

  if (rows.length === 0) {
    await db.query(
      `
      INSERT INTO admin_settings (
        id,
        nome_plataforma,
        email_suporte,
        limite_recorrencia,
        limite_ticket_medio,
        limite_queda_receita,
        alertas_criticos,
        recalculo_automatico,
        permitir_convites
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        1,
        configPadrao.nomePlataforma,
        configPadrao.emailSuporte,
        configPadrao.limiteRecorrencia,
        configPadrao.limiteTicketMedio,
        configPadrao.limiteQuedaReceita,
        configPadrao.alertasCriticos,
        configPadrao.recalculoAutomatico,
        configPadrao.permitirConvites
      ]
    );
  }
}

async function buscarConfig() {
  await garantirConfigPadrao();

  const [rows] = await db.query(
    `
    SELECT
      id,
      nome_plataforma,
      email_suporte,
      limite_recorrencia,
      limite_ticket_medio,
      limite_queda_receita,
      alertas_criticos,
      recalculo_automatico,
      permitir_convites,
      created_at,
      updated_at
    FROM admin_settings
    WHERE id = 1
    LIMIT 1
    `
  );

  if (rows.length === 0) {
    throw new Error('Configurações administrativas não encontradas.');
  }

  return formatarConfig(rows[0]);
}

async function getAdminConfig(req, res) {
  try {
    if (!req.user || !['admin', 'colaborador'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Acesso não autorizado às configurações.'
      });
    }

    const config = await buscarConfig();

    return res.json({
      data: config
    });
  } catch (error) {
    console.error('Erro ao carregar configurações:', error);

    return res.status(500).json({
      message: 'Erro ao carregar configurações.',
      detail: error.message
    });
  }
}

async function updateAdminConfig(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Apenas administradores podem alterar configurações.'
      });
    }

    await garantirConfigPadrao();

    const {
      nomePlataforma,
      emailSuporte,
      limiteRecorrencia,
      limiteTicketMedio,
      limiteQuedaReceita,
      alertasCriticos,
      recalculoAutomatico,
      permitirConvites
    } = req.body;

    if (!nomePlataforma || !emailSuporte) {
      return res.status(400).json({
        message: 'Nome da plataforma e e-mail de suporte são obrigatórios.'
      });
    }

    await db.query(
      `
      UPDATE admin_settings
      SET
        nome_plataforma = ?,
        email_suporte = ?,
        limite_recorrencia = ?,
        limite_ticket_medio = ?,
        limite_queda_receita = ?,
        alertas_criticos = ?,
        recalculo_automatico = ?,
        permitir_convites = ?
      WHERE id = 1
      `,
      [
        nomePlataforma,
        emailSuporte,
        Number(limiteRecorrencia),
        Number(limiteTicketMedio),
        Number(limiteQuedaReceita),
        Boolean(alertasCriticos),
        Boolean(recalculoAutomatico),
        Boolean(permitirConvites)
      ]
    );

    const configAtualizada = await buscarConfig();

    return res.json({
      message: 'Configurações atualizadas com sucesso.',
      data: configAtualizada
    });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);

    return res.status(500).json({
      message: 'Erro ao salvar configurações.',
      detail: error.message
    });
  }
}

async function resetAdminConfig(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Apenas administradores podem restaurar configurações.'
      });
    }

    await garantirConfigPadrao();

    await db.query(
      `
      UPDATE admin_settings
      SET
        nome_plataforma = ?,
        email_suporte = ?,
        limite_recorrencia = ?,
        limite_ticket_medio = ?,
        limite_queda_receita = ?,
        alertas_criticos = ?,
        recalculo_automatico = ?,
        permitir_convites = ?
      WHERE id = 1
      `,
      [
        configPadrao.nomePlataforma,
        configPadrao.emailSuporte,
        configPadrao.limiteRecorrencia,
        configPadrao.limiteTicketMedio,
        configPadrao.limiteQuedaReceita,
        configPadrao.alertasCriticos,
        configPadrao.recalculoAutomatico,
        configPadrao.permitirConvites
      ]
    );

    const configRestaurada = await buscarConfig();

    return res.json({
      message: 'Configurações restauradas com sucesso.',
      data: configRestaurada
    });
  } catch (error) {
    console.error('Erro ao restaurar configurações:', error);

    return res.status(500).json({
      message: 'Erro ao restaurar configurações.',
      detail: error.message
    });
  }
}

module.exports = {
  getAdminConfig,
  updateAdminConfig,
  resetAdminConfig
};