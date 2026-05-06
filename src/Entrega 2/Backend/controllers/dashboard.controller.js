const db = require('../config/db');

async function getAdminOverview(req, res) {
  try {
    const [[ordersSummary]] = await db.query(`
      SELECT
        COUNT(*) AS totalPedidos,
        COALESCE(SUM(total_amount), 0) AS receitaTotal,
        COALESCE(AVG(total_amount), 0) AS ticketMedio
      FROM orders
    `);

    const [[companiesSummary]] = await db.query(`
      SELECT
        COUNT(*) AS totalEmpresas
      FROM companies
    `);

    const [[customersSummary]] = await db.query(`
      SELECT
        COUNT(*) AS totalClientes
      FROM customers
    `);

    return res.json({
      scope: 'admin',
      metrics: {
        totalEmpresas: Number(companiesSummary.totalEmpresas),
        totalClientes: Number(customersSummary.totalClientes),
        totalPedidos: Number(ordersSummary.totalPedidos),
        receitaTotal: Number(ordersSummary.receitaTotal),
        ticketMedio: Number(ordersSummary.ticketMedio)
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao carregar dashboard admin.'
    });
  }
}

async function getCompanyOverview(req, res) {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(403).json({
        message: 'Usuário não está vinculado a uma empresa.'
      });
    }

    const [[ordersSummary]] = await db.query(
      `
      SELECT
        COUNT(*) AS totalPedidos,
        COALESCE(SUM(total_amount), 0) AS receitaTotal,
        COALESCE(AVG(total_amount), 0) AS ticketMedio
      FROM orders
      WHERE company_id = ?
      `,
      [companyId]
    );

    const [[customersSummary]] = await db.query(
      `
      SELECT
        COUNT(*) AS clientesAtivos
      FROM customers
      WHERE company_id = ?
      `,
      [companyId]
    );

    return res.json({
      scope: 'empresa',
      companyId,
      metrics: {
        totalPedidos: Number(ordersSummary.totalPedidos),
        receitaTotal: Number(ordersSummary.receitaTotal),
        ticketMedio: Number(ordersSummary.ticketMedio),
        clientesAtivos: Number(customersSummary.clientesAtivos)
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Erro ao carregar dashboard da empresa.'
    });
  }
}

module.exports = {
  getAdminOverview,
  getCompanyOverview
};