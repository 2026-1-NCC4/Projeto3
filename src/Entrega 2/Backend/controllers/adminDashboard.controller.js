const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

let ultimaChaveFiltros = null;
let ultimoProcessamento = 0;
let ultimaModificacaoArquivo = 0;
let processamentoEmAndamento = null;

const TEMPO_CACHE_MS = 10000;

function getDashboardFilePath() {
  return path.join(__dirname, '..', 'data', 'admin_dashboard.json');
}

function montarChaveFiltros({ periodo, empresa, canal, tipoPedido }) {
  return JSON.stringify({
    periodo: periodo || 'todos',
    empresa: empresa || 'todas',
    canal: canal || 'todos',
    tipoPedido: tipoPedido || 'todos'
  });
}

function obterModificacaoArquivoDashboard() {
  const filePath = getDashboardFilePath();

  if (!fs.existsSync(filePath)) {
    return 0;
  }

  const stats = fs.statSync(filePath);
  return stats.mtimeMs;
}

function executarPythonDashboard({ periodo, empresa, canal, tipoPedido }) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'python', 'processar_admin.py');
    const backendPath = path.join(__dirname, '..');

    const args = [
      scriptPath,
      '--periodo',
      periodo || 'todos',
      '--empresa',
      empresa || 'todas',
      '--canal',
      canal || 'todos',
      '--tipoPedido',
      tipoPedido || 'todos'
    ];

    console.log('Executando Python:', 'python', args.join(' '));

    execFile(
      'python',
      args,
      {
        cwd: backendPath,
        windowsHide: true,
        timeout: 120000,
        maxBuffer: 1024 * 1024 * 10
      },
      (error, stdout, stderr) => {
        if (stdout) {
          console.log('stdout Python:', stdout);
        }

        if (stderr) {
          console.warn('stderr Python:', stderr);
        }

        if (error) {
          console.error('Erro ao executar Python:', error);
          return reject(error);
        }

        return resolve();
      }
    );
  });
}

function lerArquivoDashboard() {
  const filePath = getDashboardFilePath();

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

async function getAdminDashboard(req, res) {
  try {
    console.log('GET /api/admin-dashboard chamado');
    console.log('URL:', req.originalUrl);
    console.log('Referer:', req.headers.referer || 'sem referer');

    if (!req.user || !['admin', 'colaborador'].includes(req.user.role)) {
      return res.status(403).json({
        message: 'Acesso não autorizado ao dashboard global.'
      });
    }

    const {
      periodo = 'todos',
      empresa = 'todas',
      canal = 'todos',
      tipoPedido = 'todos'
    } = req.query;

    const filtros = {
      periodo,
      empresa,
      canal,
      tipoPedido
    };

    const chaveFiltros = montarChaveFiltros(filtros);
    const agora = Date.now();

    const dashboardExistente = lerArquivoDashboard();
    const modificacaoAtualArquivo = obterModificacaoArquivoDashboard();

    const arquivoMudouDepoisDoCache =
      modificacaoAtualArquivo > ultimaModificacaoArquivo;

    const podeUsarCache =
      dashboardExistente &&
      ultimaChaveFiltros === chaveFiltros &&
      agora - ultimoProcessamento < TEMPO_CACHE_MS &&
      !arquivoMudouDepoisDoCache;

    if (podeUsarCache) {
      console.log('Usando dashboard em cache. Python não será executado novamente.');

      return res.json({
        data: dashboardExistente
      });
    }

    if (arquivoMudouDepoisDoCache && dashboardExistente) {
      console.log('Arquivo admin_dashboard.json mudou. Cache será atualizado sem rodar Python novamente.');

      ultimaChaveFiltros = chaveFiltros;
      ultimoProcessamento = Date.now();
      ultimaModificacaoArquivo = modificacaoAtualArquivo;

      return res.json({
        data: dashboardExistente
      });
    }

    if (processamentoEmAndamento) {
      console.log('Aguardando processamento Python já em andamento...');
      await processamentoEmAndamento;
    } else {
      processamentoEmAndamento = executarPythonDashboard(filtros);

      await processamentoEmAndamento;

      ultimaChaveFiltros = chaveFiltros;
      ultimoProcessamento = Date.now();
      ultimaModificacaoArquivo = obterModificacaoArquivoDashboard();
      processamentoEmAndamento = null;
    }

    const dashboard = lerArquivoDashboard();

    if (!dashboard) {
      return res.status(404).json({
        message: 'Arquivo de dashboard ainda não foi gerado pelo Python.'
      });
    }

    return res.json({
      data: dashboard
    });
  } catch (error) {
    processamentoEmAndamento = null;

    console.error('Erro ao carregar dashboard admin:', error);

    return res.status(500).json({
      message: 'Erro ao carregar dashboard admin.',
      detail: error.message
    });
  }
}

module.exports = {
  getAdminDashboard
};