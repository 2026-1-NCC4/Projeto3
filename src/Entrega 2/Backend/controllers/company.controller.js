const db = require('../config/db');

function usuarioPodeGerenciarEmpresas(req) {
  return req.user && ['admin', 'colaborador'].includes(req.user.role);
}

async function listCompaniesForInvite(req, res) {
  try {
    if (!usuarioPodeGerenciarEmpresas(req)) {
      return res.status(403).json({
        message: 'Acesso não autorizado para listar empresas.'
      });
    }

    const [companies] = await db.query(
      `
      SELECT
        id,
        name,
        cnpj,
        email,
        external_store_id,
        status,
        invited_at,
        activated_at
      FROM companies
      ORDER BY name ASC
      `
    );

    return res.json({
      data: companies
    });
  } catch (error) {
    console.error('Erro ao listar empresas:', error);

    return res.status(500).json({
      message: 'Erro ao listar empresas.'
    });
  }
}

module.exports = {
  listCompaniesForInvite
};