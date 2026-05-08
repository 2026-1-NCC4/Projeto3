const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const db = require('../config/db');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PYTHON_SCRIPT = path.join(__dirname, '..', 'python', 'processar_admin.py');
const OUTPUT_FILE = path.join(DATA_DIR, 'admin_dashboard.json');

function normalizarFiltro(valor, padrao = 'todos') {
  if (!valor || valor === 'undefined' || valor === 'null') {
    return padrao;
  }

  return valor;
}

function executarPython({ periodo, empresa, canal, tipoPedido }) {
  return new Promise((resolve, reject) => {
    const pythonCommand = process.env.PYTHON_COMMAND || 'python';

    const args = [
      PYTHON_SCRIPT,
      '--periodo',
      periodo,
      '--empresa',
      empresa,
      '--canal',
      canal,
      '--tipoPedido',
      tipoPedido
    ];

    const processo = spawn(pythonCommand, args, {
      cwd: path.join(__dirname, '..')
    });

    let stderr = '';

    processo.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    processo.on('error', (error) => {
      reject(error);
    });

    processo.on('close', (code) => {
      if (code !== 0) {
        return reject(
          new Error(stderr || 'Erro ao processar dashboard da empresa.')
        );
      }

      resolve();
    });
  });
}

function lerDashboardGerado() {
  if (!fs.existsSync(OUTPUT_FILE)) {
    throw new Error('Arquivo admin_dashboard.json não encontrado.');
  }

  const conteudo = fs.readFileSync(OUTPUT_FILE, 'utf-8');
  return JSON.parse(conteudo);
}

async function getCompanyDashboard(req, res) {
  try {
    if (!req.user || req.user.role !== 'empresa') {
      return res.status(403).json({
        message: 'Acesso permitido apenas para usuários empresa.'
      });
    }

    if (!req.user.companyId) {
      return res.status(403).json({
        message: 'Usuário empresa não está vinculado a uma empresa.'
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
        status
      FROM companies
      WHERE id = ?
      LIMIT 1
      `,
      [req.user.companyId]
    );

    if (companies.length === 0) {
      return res.status(404).json({
        message: 'Empresa vinculada ao usuário não encontrada.'
      });
    }

    const company = companies[0];

    if (!company.external_store_id) {
      return res.status(400).json({
        message: 'Empresa ainda não possui vínculo com a base analítica.'
      });
    }

    const periodo = normalizarFiltro(req.query.periodo);
    const canal = normalizarFiltro(req.query.canal);
    const tipoPedido = normalizarFiltro(req.query.tipoPedido);

    const filtrosAplicados = {
      periodo,
      empresa: company.external_store_id,
      canal,
      tipoPedido
    };

    await executarPython(filtrosAplicados);

    const dashboard = lerDashboardGerado();

    return res.json({
      message: 'Dashboard da empresa carregado com sucesso.',
      data: {
        ...dashboard,
        perfil: 'empresa',
        contextoEmpresa: {
          companyId: company.id,
          companyName: company.name,
          externalStoreId: company.external_store_id
        },
        filtrosAplicados: {
          ...dashboard.filtrosAplicados,
          empresa: company.external_store_id
        }
      }
    });
  } catch (error) {
    console.error('Erro ao carregar dashboard da empresa:', error);

    return res.status(500).json({
      message: error.message || 'Erro ao carregar dashboard da empresa.'
    });
  }
}

module.exports = {
  getCompanyDashboard
};