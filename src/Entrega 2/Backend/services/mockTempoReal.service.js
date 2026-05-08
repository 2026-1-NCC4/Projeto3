const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { execFile } = require('child_process');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ORDER_FILE = path.join(DATA_DIR, 'STOREORDER.csv');

function normalizarNomeColuna(coluna) {
  return String(coluna || '')
    .trim()
    .toLowerCase()
    .replace(/^\uFEFF/, '')
    .replace(/\s+/g, '_');
}

function lerCsvParaJson(caminhoArquivo) {
  if (!fs.existsSync(caminhoArquivo)) {
    throw new Error(`Arquivo não encontrado: ${caminhoArquivo}`);
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

  return linhas.map((linha) => {
    const novaLinha = {};

    Object.keys(linha).forEach((chave) => {
      novaLinha[normalizarNomeColuna(chave)] = linha[chave];
    });

    return novaLinha;
  });
}

function obterCabecalhoCsv(caminhoArquivo) {
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

function gerarValorAleatorio(min, max) {
  return Number((Math.random() * (max - min) + min).toFixed(2));
}

function escolherItemAleatorio(lista) {
  return lista[Math.floor(Math.random() * lista.length)];
}

function gerarPedidoMock({ indice, pedidoReferencia }) {
  const agora = new Date();
  const id = `MOCK_RT_${Date.now()}_${indice}`;

  const totalAmount = gerarValorAleatorio(35, 180);
  const desconto = Math.random() > 0.65 ? gerarValorAleatorio(5, 20) : 0;
  const subtotal = Number((totalAmount + desconto).toFixed(2));

  const canais = ['delivery_proprio', 'app', 'balcao'];
  const tiposPedido = ['delivery', 'takeout'];

  return {
    id,
    storeid: pedidoReferencia.storeid,
    customerid: pedidoReferencia.customerid,
    scheduledat: agora.toISOString(),
    totalamount: totalAmount.toFixed(2),
    subtotalamount: subtotal.toFixed(2),
    discountamount: desconto.toFixed(2),
    taxamount: '0.00',
    saleschannel: escolherItemAleatorio(canais),
    status: 'completed',
    ordertype: escolherItemAleatorio(tiposPedido),
    createdat: agora.toISOString(),
    createdby: 'mock_tempo_real',
    status_label: 'Concluído'
  };
}

function acrescentarPedidosNoCsv(pedidosNovos) {
  const cabecalhoOriginal = obterCabecalhoCsv(ORDER_FILE);
  const cabecalhoNormalizado = cabecalhoOriginal.map(normalizarNomeColuna);

  const linhasCsv = pedidosNovos.map((pedido) => {
    return cabecalhoNormalizado
      .map((colunaNormalizada) => escaparCsv(pedido[colunaNormalizada]))
      .join(',');
  });

  const conteudoAtual = fs.readFileSync(ORDER_FILE, 'utf-8');

  const precisaQuebraLinha =
    !conteudoAtual.endsWith('\n') && !conteudoAtual.endsWith('\r\n');

  const conteudoParaAcrescentar =
    `${precisaQuebraLinha ? '\n' : ''}${linhasCsv.join('\n')}\n`;

  fs.appendFileSync(ORDER_FILE, conteudoParaAcrescentar, 'utf-8');
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

async function gerarPedidosMock({ quantidade }) {
  if (!fs.existsSync(ORDER_FILE)) {
    throw new Error('Arquivo STOREORDER.csv não encontrado.');
  }

  const pedidosExistentes = lerCsvParaJson(ORDER_FILE).filter((pedido) => {
    return (
      pedido.storeid &&
      pedido.customerid &&
      Number(pedido.totalamount || 0) > 0
    );
  });

  if (pedidosExistentes.length === 0) {
    throw new Error('Não há pedidos existentes suficientes para usar como referência.');
  }

  const quantidadeSegura = Math.min(Math.max(Number(quantidade || 2), 1), 5);

  const pedidosNovos = [];

  for (let i = 1; i <= quantidadeSegura; i += 1) {
    const pedidoReferencia = escolherItemAleatorio(pedidosExistentes);

    pedidosNovos.push(
      gerarPedidoMock({
        indice: i,
        pedidoReferencia
      })
    );
  }

  acrescentarPedidosNoCsv(pedidosNovos);

  await executarProcessarAdmin();

  const receitaGerada = pedidosNovos.reduce((acc, pedido) => {
    return acc + Number(pedido.totalamount || 0);
  }, 0);

  return {
    quantidadeGerada: pedidosNovos.length,
    receitaGerada: Number(receitaGerada.toFixed(2)),
    pedidos: pedidosNovos.map((pedido) => ({
      id: pedido.id,
      storeid: pedido.storeid,
      customerid: pedido.customerid,
      totalamount: Number(pedido.totalamount),
      saleschannel: pedido.saleschannel,
      ordertype: pedido.ordertype,
      createdat: pedido.createdat
    })),
    dashboardAtualizado: true
  };
}

module.exports = {
  gerarPedidosMock
};