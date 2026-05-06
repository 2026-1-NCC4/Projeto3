const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { execFile } = require('child_process');
const pool = require('../config/db');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups_importacao');

const arquivosPorTipoBase = {
  stores: 'STORE.csv',
  pedidos: 'STOREORDER.csv',
  clientes: 'CUSTOMER.CSV',
  enderecos: 'CUSTOMERADDRESS.CSV',
  campanhas: 'CAMPAIGN.CSV',
  campanhas_pedidos: 'CAMPAIGNxORDER.CSV',
  templates: 'TEMPLATE.csv'
};

const colunasObrigatoriasPorTipo = {
  stores: ['id', 'name'],
  pedidos: ['id', 'storeid', 'customerid', 'totalamount', 'status_label', 'createdat'],
  clientes: ['id', 'createdat'],
  enderecos: ['customerid', 'state'],
  campanhas: ['storeid', 'customerid', 'templateid'],
  campanhas_pedidos: ['campaignid', 'order_id', 'storeid', 'customerid', 'message_id', 'totalamount'],
  templates: ['id', 'storeid', 'name'],
  generico: []
};

const chavesUnicasPorTipo = {
  stores: ['id'],
  pedidos: ['id'],
  clientes: ['id'],
  enderecos: ['customerid', 'state'],
  campanhas: ['storeid', 'customerid', 'templateid', 'createdat'],
  campanhas_pedidos: ['campaignid', 'order_id', 'message_id'],
  templates: ['id'],
  generico: []
};

function normalizarNomeColuna(coluna) {
  return String(coluna || '')
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, '')
    .replace(/\s+/g, '_');
}

function normalizarLinha(linha) {
  const novaLinha = {};

  Object.keys(linha).forEach((chave) => {
    const chaveNormalizada = normalizarNomeColuna(chave);
    novaLinha[chaveNormalizada] = linha[chave];
  });

  return novaLinha;
}

function valorVazio(valor) {
  return valor === null || valor === undefined || String(valor).trim() === '';
}

function lerArquivoParaJson(arquivo) {
  const workbook = xlsx.read(arquivo.buffer, {
    type: 'buffer',
    cellDates: true
  });

  const primeiraAba = workbook.SheetNames[0];

  if (!primeiraAba) {
    throw new Error('O arquivo não possui abas ou dados válidos.');
  }

  const worksheet = workbook.Sheets[primeiraAba];

  const linhas = xlsx.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false
  });

  return linhas.map(normalizarLinha);
}

function lerCsvExistenteParaJson(caminhoArquivo) {
  if (!fs.existsSync(caminhoArquivo)) {
    return [];
  }

  const workbook = xlsx.readFile(caminhoArquivo, {
    type: 'file',
    cellDates: true
  });

  const primeiraAba = workbook.SheetNames[0];

  if (!primeiraAba) {
    return [];
  }

  const worksheet = workbook.Sheets[primeiraAba];

  const linhas = xlsx.utils.sheet_to_json(worksheet, {
    defval: '',
    raw: false
  });

  return linhas.map(normalizarLinha);
}

function obterCabecalhoCsv(caminhoArquivo) {
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo base não encontrado: ${caminhoArquivo}`);
  }

  const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');

  const primeiraLinha = conteudo
    .split(/\r?\n/)
    .find((linha) => linha.trim() !== '');

  if (!primeiraLinha) {
    throw new Error('Arquivo base não possui cabeçalho.');
  }

  return primeiraLinha
    .split(',')
    .map((coluna) => coluna.replace(/^"|"$/g, '').trim());
}

function escaparCsv(valor) {
  if (valor === null || valor === undefined) {
    return '';
  }

  const texto = String(valor);

  if (
    texto.includes(',') ||
    texto.includes('"') ||
    texto.includes('\n') ||
    texto.includes('\r')
  ) {
    return `"${texto.replace(/"/g, '""')}"`;
  }

  return texto;
}

function gerarChaveUnica(linha, tipoBase) {
  const colunasChave = chavesUnicasPorTipo[tipoBase] || [];

  if (colunasChave.length === 0) {
    return JSON.stringify(linha);
  }

  return colunasChave
    .map((coluna) => String(linha[coluna] ?? '').trim().toLowerCase())
    .join('|');
}

function criarBackupArquivo(caminhoArquivo, nomeArquivoDestino) {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const agora = new Date()
    .toISOString()
    .replace(/:/g, '-')
    .replace(/\./g, '-');

  const nomeBackup = `${agora}_${nomeArquivoDestino}`;
  const caminhoBackup = path.join(BACKUP_DIR, nomeBackup);

  fs.copyFileSync(caminhoArquivo, caminhoBackup);

  return caminhoBackup;
}

function calcularQualidadeDados({ linhas, tipoBase }) {
  const colunasObrigatorias = colunasObrigatoriasPorTipo[tipoBase] || [];

  const chavesEncontradas = new Set();

  let linhasAceitas = 0;
  let linhasRejeitadas = 0;
  let linhasDuplicadas = 0;
  let camposFaltantes = 0;

  const linhasValidas = [];
  const detalhesRejeicao = [];

  linhas.forEach((linha, index) => {
    const camposAusentesNaLinha = colunasObrigatorias.filter((coluna) => {
      return valorVazio(linha[coluna]);
    });

    if (camposAusentesNaLinha.length > 0) {
      linhasRejeitadas += 1;
      camposFaltantes += camposAusentesNaLinha.length;

      detalhesRejeicao.push({
        linha: index + 2,
        motivo: `Campos obrigatórios ausentes: ${camposAusentesNaLinha.join(', ')}.`
      });

      return;
    }

    const chaveLinha = gerarChaveUnica(linha, tipoBase);

    if (chavesEncontradas.has(chaveLinha)) {
      linhasDuplicadas += 1;

      detalhesRejeicao.push({
        linha: index + 2,
        motivo: 'Linha duplicada dentro do arquivo importado.'
      });

      return;
    }

    chavesEncontradas.add(chaveLinha);
    linhasAceitas += 1;
    linhasValidas.push(linha);
  });

  return {
    totalLinhas: linhas.length,
    linhasAceitas,
    linhasRejeitadas,
    linhasDuplicadas,
    camposFaltantes,
    linhasValidas,
    detalhesRejeicao: detalhesRejeicao.slice(0, 20)
  };
}

function acrescentarLinhasNoCsv({ tipoBase, linhasNovas }) {
  const nomeArquivoDestino = arquivosPorTipoBase[tipoBase];

  if (!nomeArquivoDestino) {
    return {
      arquivoAtualizado: null,
      caminhoBackup: null,
      linhasBaseAntes: 0,
      linhasNovasInseridas: 0,
      linhasDuplicadasNaBase: 0,
      mensagem: 'Tipo de base genérico validado apenas para qualidade. Nenhum CSV foi atualizado.'
    };
  }

  const caminhoArquivoDestino = path.join(DATA_DIR, nomeArquivoDestino);

  if (!fs.existsSync(caminhoArquivoDestino)) {
    throw new Error(`Arquivo de destino não encontrado: ${nomeArquivoDestino}`);
  }

  const linhasExistentes = lerCsvExistenteParaJson(caminhoArquivoDestino);

  const chavesExistentes = new Set(
    linhasExistentes.map((linha) => gerarChaveUnica(linha, tipoBase))
  );

  const linhasParaInserir = [];
  let linhasDuplicadasNaBase = 0;

  linhasNovas.forEach((linha) => {
    const chave = gerarChaveUnica(linha, tipoBase);

    if (chavesExistentes.has(chave)) {
      linhasDuplicadasNaBase += 1;
      return;
    }

    chavesExistentes.add(chave);
    linhasParaInserir.push(linha);
  });

  if (linhasParaInserir.length === 0) {
    return {
      arquivoAtualizado: nomeArquivoDestino,
      caminhoBackup: null,
      linhasBaseAntes: linhasExistentes.length,
      linhasNovasInseridas: 0,
      linhasDuplicadasNaBase,
      mensagem: `Nenhuma linha nova foi acrescentada ao arquivo ${nomeArquivoDestino}.`
    };
  }

  const caminhoBackup = criarBackupArquivo(caminhoArquivoDestino, nomeArquivoDestino);

  const cabecalhoOriginal = obterCabecalhoCsv(caminhoArquivoDestino);
  const cabecalhoNormalizado = cabecalhoOriginal.map(normalizarNomeColuna);

  const linhasCsv = linhasParaInserir.map((linha) => {
    return cabecalhoNormalizado
      .map((colunaNormalizada) => escaparCsv(linha[colunaNormalizada]))
      .join(',');
  });

  const conteudoAtual = fs.readFileSync(caminhoArquivoDestino, 'utf-8');

  const precisaQuebraLinha =
    !conteudoAtual.endsWith('\n') && !conteudoAtual.endsWith('\r\n');

  const conteudoParaAcrescentar =
    `${precisaQuebraLinha ? '\n' : ''}${linhasCsv.join('\n')}\n`;

  fs.appendFileSync(caminhoArquivoDestino, conteudoParaAcrescentar, 'utf-8');

  return {
    arquivoAtualizado: nomeArquivoDestino,
    caminhoBackup,
    linhasBaseAntes: linhasExistentes.length,
    linhasNovasInseridas: linhasParaInserir.length,
    linhasDuplicadasNaBase,
    mensagem: `Arquivo ${nomeArquivoDestino} recebeu ${linhasParaInserir.length} nova(s) linha(s).`
  };
}

function executarProcessarAdmin() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', 'python', 'processar_admin.py');
    const backendPath = path.join(__dirname, '..');

    execFile(
      'python',
      [scriptPath],
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
          return reject(error);
        }

        return resolve();
      }
    );
  });
}

async function registrarLogImportacao({
  nomeArquivo,
  tipoArquivo,
  tipoBase,
  totalLinhas,
  linhasAceitas,
  linhasRejeitadas,
  linhasDuplicadas,
  camposFaltantes,
  statusProcessamento,
  mensagemErro,
  usuarioImportadorId
}) {
  const [resultado] = await pool.execute(
    `
      INSERT INTO logs_importacao_dados (
        nome_arquivo,
        tipo_arquivo,
        origem,
        total_linhas,
        linhas_aceitas,
        linhas_rejeitadas,
        linhas_duplicadas,
        campos_faltantes,
        status_processamento,
        mensagem_erro,
        usuario_importador_id,
        finalizado_em
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
    [
      nomeArquivo,
      tipoArquivo,
      tipoBase || 'upload_admin',
      totalLinhas,
      linhasAceitas,
      linhasRejeitadas,
      linhasDuplicadas,
      camposFaltantes,
      statusProcessamento,
      mensagemErro || null,
      usuarioImportadorId || null
    ]
  );

  return resultado.insertId;
}

async function processarImportacao({ arquivo, tipoBase, usuarioImportadorId }) {
  const nomeArquivo = arquivo.originalname;
  const tipoArquivo = nomeArquivo.split('.').pop().toLowerCase();

  try {
    const linhas = lerArquivoParaJson(arquivo);

    const qualidade = calcularQualidadeDados({
      linhas,
      tipoBase
    });

    const resultadoAtualizacao = acrescentarLinhasNoCsv({
      tipoBase,
      linhasNovas: qualidade.linhasValidas
    });

    const totalDuplicadas =
      qualidade.linhasDuplicadas + resultadoAtualizacao.linhasDuplicadasNaBase;

    const linhasAceitasFinais = resultadoAtualizacao.arquivoAtualizado
      ? resultadoAtualizacao.linhasNovasInseridas
      : qualidade.linhasAceitas;

    const statusProcessamento =
      qualidade.linhasRejeitadas > 0 || totalDuplicadas > 0
        ? 'processado_com_alertas'
        : 'processado';

    if (
      resultadoAtualizacao.arquivoAtualizado &&
      resultadoAtualizacao.linhasNovasInseridas > 0
    ) {
      await executarProcessarAdmin();
    }

    const logId = await registrarLogImportacao({
      nomeArquivo,
      tipoArquivo,
      tipoBase,
      totalLinhas: qualidade.totalLinhas,
      linhasAceitas: linhasAceitasFinais,
      linhasRejeitadas: qualidade.linhasRejeitadas,
      linhasDuplicadas: totalDuplicadas,
      camposFaltantes: qualidade.camposFaltantes,
      statusProcessamento,
      mensagemErro: null,
      usuarioImportadorId
    });

    return {
      id: logId,
      nomeArquivo,
      tipoArquivo,
      tipoBase,
      statusProcessamento,
      totalLinhas: qualidade.totalLinhas,
      linhasAceitas: linhasAceitasFinais,
      linhasRejeitadas: qualidade.linhasRejeitadas,
      linhasDuplicadas: totalDuplicadas,
      camposFaltantes: qualidade.camposFaltantes,
      arquivoAtualizado: resultadoAtualizacao.arquivoAtualizado,
      caminhoBackup: resultadoAtualizacao.caminhoBackup,
      linhasBaseAntes: resultadoAtualizacao.linhasBaseAntes,
      linhasNovasInseridas: resultadoAtualizacao.linhasNovasInseridas,
      linhasDuplicadasNaBase: resultadoAtualizacao.linhasDuplicadasNaBase,
      dashboardAtualizado: Boolean(
        resultadoAtualizacao.arquivoAtualizado &&
        resultadoAtualizacao.linhasNovasInseridas > 0
      ),
      mensagemAtualizacao: resultadoAtualizacao.mensagem,
      detalhesRejeicao: qualidade.detalhesRejeicao
    };
  } catch (error) {
    const logId = await registrarLogImportacao({
      nomeArquivo,
      tipoArquivo,
      tipoBase,
      totalLinhas: 0,
      linhasAceitas: 0,
      linhasRejeitadas: 0,
      linhasDuplicadas: 0,
      camposFaltantes: 0,
      statusProcessamento: 'erro',
      mensagemErro: error.message,
      usuarioImportadorId
    });

    return {
      id: logId,
      nomeArquivo,
      tipoArquivo,
      tipoBase,
      statusProcessamento: 'erro',
      totalLinhas: 0,
      linhasAceitas: 0,
      linhasRejeitadas: 0,
      linhasDuplicadas: 0,
      camposFaltantes: 0,
      arquivoAtualizado: null,
      caminhoBackup: null,
      linhasBaseAntes: 0,
      linhasNovasInseridas: 0,
      linhasDuplicadasNaBase: 0,
      dashboardAtualizado: false,
      detalhesRejeicao: [],
      erro: error.message
    };
  }
}

async function listarHistoricoImportacoes() {
  const [linhas] = await pool.execute(
    `
      SELECT
        id,
        nome_arquivo AS nomeArquivo,
        tipo_arquivo AS tipoArquivo,
        origem,
        total_linhas AS totalLinhas,
        linhas_aceitas AS linhasAceitas,
        linhas_rejeitadas AS linhasRejeitadas,
        linhas_duplicadas AS linhasDuplicadas,
        campos_faltantes AS camposFaltantes,
        status_processamento AS statusProcessamento,
        mensagem_erro AS mensagemErro,
        usuario_importador_id AS usuarioImportadorId,
        iniciado_em AS iniciadoEm,
        finalizado_em AS finalizadoEm,
        criado_em AS criadoEm
      FROM logs_importacao_dados
      ORDER BY criado_em DESC
      LIMIT 50
    `
  );

  return linhas;
}

module.exports = {
  processarImportacao,
  listarHistoricoImportacoes
};