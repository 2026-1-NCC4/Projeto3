const db = require('../config/db');

function numeroAleatorioEntre(min, max) {
  return Math.random() * (max - min) + min;
}

function inteiroAleatorioEntre(min, max) {
  return Math.floor(numeroAleatorioEntre(min, max + 1));
}

function escolherDirecao(direcao) {
  if (direcao === 'aumentar' || direcao === 'diminuir') {
    return direcao;
  }

  return Math.random() >= 0.5 ? 'aumentar' : 'diminuir';
}

function normalizarQuantidade(quantidade) {
  const valor = Number(quantidade || 2);

  if (Number.isNaN(valor) || valor <= 0) {
    return 2;
  }

  return Math.min(Math.floor(valor), 10);
}

function normalizarPercentual(percentualAjuste) {
  const valor = Number(percentualAjuste);

  if (Number.isNaN(valor) || valor <= 0) {
    return Number(numeroAleatorioEntre(0.02, 0.08).toFixed(4));
  }

  return Math.min(valor, 0.3);
}

async function tabelaExiste(connection, tableName) {
  const [rows] = await connection.query(
    `
    SELECT COUNT(*) AS total
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ?
    `,
    [tableName]
  );

  return Number(rows[0]?.total || 0) > 0;
}

async function obterColunas(connection, tableName) {
  const [columns] = await connection.query(`SHOW COLUMNS FROM \`${tableName}\``);
  return columns;
}

function obterColunaPrimaria(columns) {
  const primaria = columns.find((column) => column.Key === 'PRI');

  if (primaria) {
    return primaria.Field;
  }

  const id = columns.find((column) => column.Field === 'id');

  return id ? id.Field : null;
}

function colunaEhAutoIncrement(column) {
  return String(column.Extra || '').toLowerCase().includes('auto_increment');
}

function colunaEhData(column) {
  const nome = String(column.Field || '').toLowerCase();
  const tipo = String(column.Type || '').toLowerCase();

  return (
    tipo.includes('date') ||
    tipo.includes('time') ||
    nome.includes('date') ||
    nome.includes('created_at') ||
    nome.includes('updated_at') ||
    nome.includes('order_date')
  );
}

function colunaEhTexto(column) {
  const tipo = String(column.Type || '').toLowerCase();

  return (
    tipo.includes('char') ||
    tipo.includes('text') ||
    tipo.includes('varchar')
  );
}

function colunaEhNumerica(column) {
  const tipo = String(column.Type || '').toLowerCase();

  return (
    tipo.includes('int') ||
    tipo.includes('decimal') ||
    tipo.includes('float') ||
    tipo.includes('double')
  );
}

function colunaEhEnum(column) {
  return String(column.Type || '').toLowerCase().startsWith('enum');
}

function extrairValoresEnum(column) {
  const tipo = String(column.Type || '');
  const matches = [...tipo.matchAll(/'([^']*)'/g)];

  return matches.map((match) => match[1]);
}

function obterValorEnum(column, preferidos = []) {
  const valores = extrairValoresEnum(column);

  if (valores.length === 0) {
    return null;
  }

  for (const preferido of preferidos) {
    const encontrado = valores.find(
      (valor) => String(valor).toLowerCase() === String(preferido).toLowerCase()
    );

    if (encontrado) {
      return encontrado;
    }
  }

  return valores[0];
}

function obterColunaValor(columns) {
  const prioridades = [
    'total_amount',
    'total',
    'amount',
    'valor',
    'receita',
    'subtotal',
    'revenue',
    'price',
    'order_total'
  ];

  for (const prioridade of prioridades) {
    const encontrada = columns.find((column) => column.Field === prioridade);

    if (encontrada) {
      return encontrada.Field;
    }
  }

  return columns.find((column) => {
    const nome = String(column.Field || '').toLowerCase();

    const pareceValor =
      nome.includes('amount') ||
      nome.includes('total') ||
      nome.includes('valor') ||
      nome.includes('receita') ||
      nome.includes('subtotal') ||
      nome.includes('revenue') ||
      nome.includes('price');

    return colunaEhNumerica(column) && pareceValor;
  })?.Field || null;
}

function obterColunaStatus(columns) {
  const prioridades = [
    'status',
    'order_status',
    'situation'
  ];

  for (const prioridade of prioridades) {
    const encontrada = columns.find((column) => column.Field === prioridade);

    if (encontrada) {
      return encontrada.Field;
    }
  }

  return null;
}

function obterValorStatusConcluido(column) {
  if (!column) {
    return 'completed';
  }

  if (colunaEhEnum(column)) {
    return obterValorEnum(column, [
      'completed',
      'concluido',
      'concluído',
      'paid',
      'approved',
      'finalizado',
      'done',
      'success',
      'active'
    ]);
  }

  return 'completed';
}

function obterValorStatusCancelado(column) {
  if (!column) {
    return 'cancelled';
  }

  if (colunaEhEnum(column)) {
    return obterValorEnum(column, [
      'cancelled',
      'canceled',
      'cancelado',
      'refunded',
      'void',
      'inactive'
    ]);
  }

  return 'cancelled';
}

function colunaTemDefault(column) {
  return column.Default !== null && column.Default !== undefined;
}

function colunaAceitaNull(column) {
  return String(column.Null || '').toUpperCase() === 'YES';
}

function colunaEhCodigoUnico(column) {
  const nome = String(column.Field || '').toLowerCase();

  return (
    nome.includes('external') ||
    nome.includes('uuid') ||
    nome.includes('code') ||
    nome.includes('number') ||
    nome.includes('order_id') ||
    nome.includes('pedido_id')
  );
}

async function obterPrimeiroIdTabela(connection, tableName) {
  const existe = await tabelaExiste(connection, tableName);

  if (!existe) {
    return null;
  }

  const columns = await obterColunas(connection, tableName);
  const colunaPrimaria = obterColunaPrimaria(columns);

  if (!colunaPrimaria) {
    return null;
  }

  const [rows] = await connection.query(
    `
    SELECT \`${colunaPrimaria}\` AS id
    FROM \`${tableName}\`
    ORDER BY \`${colunaPrimaria}\` ASC
    LIMIT 1
    `
  );

  return rows[0]?.id || null;
}

async function obterPrimeiroValorTabela(connection, tableName, possibleColumns = []) {
  const existe = await tabelaExiste(connection, tableName);

  if (!existe) {
    return null;
  }

  const columns = await obterColunas(connection, tableName);

  const colunaEncontrada = possibleColumns.find((nome) =>
    columns.some((column) => column.Field === nome)
  );

  if (!colunaEncontrada) {
    return null;
  }

  const [rows] = await connection.query(
    `
    SELECT \`${colunaEncontrada}\` AS valor
    FROM \`${tableName}\`
    WHERE \`${colunaEncontrada}\` IS NOT NULL
    LIMIT 1
    `
  );

  return rows[0]?.valor || null;
}

async function criarCompanyMockSeNecessario(connection) {
  const companyIdExistente = await obterPrimeiroIdTabela(connection, 'companies');

  if (companyIdExistente) {
    return companyIdExistente;
  }

  const companiesExists = await tabelaExiste(connection, 'companies');

  if (!companiesExists) {
    return null;
  }

  const columns = await obterColunas(connection, 'companies');

  const colunasInsert = columns
    .filter((column) => !colunaEhAutoIncrement(column))
    .filter((column) => {
      if (!colunaAceitaNull(column) && !colunaTemDefault(column)) {
        return true;
      }

      const nome = String(column.Field || '').toLowerCase();

      return (
        nome === 'name' ||
        nome === 'nome' ||
        nome === 'cnpj' ||
        nome === 'email' ||
        nome === 'status' ||
        nome === 'external_store_id' ||
        nome === 'storeid' ||
        nome === 'store_id' ||
        nome === 'created_at' ||
        nome === 'updated_at'
      );
    });

  if (colunasInsert.length === 0) {
    return null;
  }

  const valores = colunasInsert.map((column) => {
    const nome = String(column.Field || '').toLowerCase();

    if (nome === 'name' || nome === 'nome') {
      return 'Empresa Mock';
    }

    if (nome === 'email') {
      return `empresa-mock-${Date.now()}@cannoli.local`;
    }

    if (nome === 'cnpj') {
      return String(Date.now()).slice(0, 14).padEnd(14, '0');
    }

    if (
      nome === 'external_store_id' ||
      nome === 'storeid' ||
      nome === 'store_id'
    ) {
      return `store-mock-${Date.now()}`;
    }

    if (nome === 'status') {
      return 'active';
    }

    if (colunaEhData(column)) {
      return new Date();
    }

    if (colunaEhEnum(column)) {
      return obterValorEnum(column, ['active', 'ativo', 'enabled']);
    }

    if (colunaEhTexto(column)) {
      return `mock-${Date.now()}`;
    }

    if (colunaEhNumerica(column)) {
      return 1;
    }

    return null;
  });

  const colunasSql = colunasInsert.map((column) => `\`${column.Field}\``).join(', ');
  const placeholders = colunasInsert.map(() => '?').join(', ');

  const [result] = await connection.query(
    `
    INSERT INTO companies (${colunasSql})
    VALUES (${placeholders})
    `,
    valores
  );

  return result.insertId;
}

async function criarCustomerMockSeNecessario(connection) {
  const customerIdExistente = await obterPrimeiroIdTabela(connection, 'customers');

  if (customerIdExistente) {
    return customerIdExistente;
  }

  const customersExists = await tabelaExiste(connection, 'customers');

  if (!customersExists) {
    return null;
  }

  const columns = await obterColunas(connection, 'customers');
  const companyId = await criarCompanyMockSeNecessario(connection);

  const colunasInsert = columns
    .filter((column) => !colunaEhAutoIncrement(column))
    .filter((column) => {
      if (!colunaAceitaNull(column) && !colunaTemDefault(column)) {
        return true;
      }

      const nome = String(column.Field || '').toLowerCase();

      return (
        nome === 'company_id' ||
        nome === 'empresa_id' ||
        nome === 'customerid' ||
        nome === 'customer_id' ||
        nome === 'external_customer_id' ||
        nome === 'name' ||
        nome === 'nome' ||
        nome === 'email' ||
        nome === 'phone' ||
        nome === 'telefone' ||
        nome === 'created_at' ||
        nome === 'updated_at'
      );
    });

  if (colunasInsert.length === 0) {
    return null;
  }

  const valores = colunasInsert.map((column, index) => {
    const nome = String(column.Field || '').toLowerCase();

    if (nome === 'company_id' || nome === 'empresa_id') {
      return companyId || 1;
    }

    if (
      nome === 'customerid' ||
      nome === 'customer_id' ||
      nome === 'external_customer_id'
    ) {
      return `customer-mock-${Date.now()}-${index}`;
    }

    if (nome === 'name' || nome === 'nome') {
      return `Cliente Mock ${index + 1}`;
    }

    if (nome === 'email') {
      return `cliente-mock-${Date.now()}-${index}@cannoli.local`;
    }

    if (nome === 'phone' || nome === 'telefone') {
      return '11999999999';
    }

    if (colunaEhData(column)) {
      return new Date();
    }

    if (colunaEhEnum(column)) {
      return obterValorEnum(column, ['active', 'ativo', 'enabled']);
    }

    if (colunaEhTexto(column)) {
      return `mock-${Date.now()}-${index}`;
    }

    if (colunaEhNumerica(column)) {
      return 1;
    }

    return null;
  });

  const colunasSql = colunasInsert.map((column) => `\`${column.Field}\``).join(', ');
  const placeholders = colunasInsert.map(() => '?').join(', ');

  const [result] = await connection.query(
    `
    INSERT INTO customers (${colunasSql})
    VALUES (${placeholders})
    `,
    valores
  );

  return result.insertId;
}

async function montarValorMockParaColuna({
  connection,
  column,
  colunaValor,
  colunaStatus,
  index
}) {
  const nome = String(column.Field || '');
  const nomeLower = nome.toLowerCase();

  if (nome === colunaValor) {
    return Number(numeroAleatorioEntre(35, 250).toFixed(2));
  }

  if (nome === colunaStatus) {
    return obterValorStatusConcluido(column);
  }

  if (colunaEhData(column)) {
    return new Date();
  }

  if (colunaEhEnum(column)) {
    return obterValorEnum(column, [
      'completed',
      'concluido',
      'concluído',
      'paid',
      'approved',
      'active'
    ]);
  }

  if (
    nomeLower === 'company_id' ||
    nomeLower === 'empresa_id'
  ) {
    const companyId = await criarCompanyMockSeNecessario(connection);

    if (!companyId) {
      return null;
    }

    return companyId;
  }

  if (
    nomeLower === 'store_id' ||
    nomeLower === 'storeid' ||
    nomeLower === 'external_store_id'
  ) {
    return (
      await obterPrimeiroValorTabela(connection, 'companies', [
        'external_store_id',
        'storeid',
        'store_id',
        'id'
      ])
    ) || `store-mock-${index}`;
  }

  if (
    nomeLower === 'customer_id' ||
    nomeLower === 'cliente_id'
  ) {
    const customerId = await criarCustomerMockSeNecessario(connection);

    if (!customerId) {
      return null;
    }

    return customerId;
  }

  if (
    nomeLower === 'customerid' ||
    nomeLower === 'external_customer_id'
  ) {
    return (
      await obterPrimeiroValorTabela(connection, 'customers', [
        'customerid',
        'external_customer_id',
        'id'
      ])
    ) || `customer-mock-${Date.now()}-${index}`;
  }

  if (
    nomeLower === 'campaign_id' ||
    nomeLower === 'campanha_id'
  ) {
    const campaignId = await obterPrimeiroIdTabela(connection, 'campaigns');

    if (!campaignId) {
      return null;
    }

    return campaignId;
  }

  if (colunaEhTexto(column) && colunaEhCodigoUnico(column)) {
    return `mock-${nomeLower}-${Date.now()}-${index}`;
  }

  if (colunaEhTexto(column)) {
    if (nomeLower.includes('email')) {
      return `mock-${Date.now()}-${index}@cannoli.local`;
    }

    if (nomeLower.includes('name') || nomeLower.includes('nome')) {
      return `Mock ${index + 1}`;
    }

    if (nomeLower.includes('canal') || nomeLower.includes('channel')) {
      return 'Mock';
    }

    if (nomeLower.includes('tipo') || nomeLower.includes('type')) {
      return 'Mock';
    }

    return `mock-${index + 1}`;
  }

  if (colunaEhNumerica(column)) {
    if (nomeLower.includes('quantity') || nomeLower.includes('quantidade')) {
      return inteiroAleatorioEntre(1, 5);
    }

    if (nomeLower.includes('pedido') || nomeLower.includes('order')) {
      return inteiroAleatorioEntre(1, 10);
    }

    return Number(numeroAleatorioEntre(1, 100).toFixed(2));
  }

  if (colunaAceitaNull(column)) {
    return null;
  }

  return null;
}

function ajustarValorParaInsert({
  column,
  row,
  colunaValor,
  colunaStatus,
  percentualAjuste,
  index
}) {
  const nome = column.Field;
  const nomeLower = String(nome || '').toLowerCase();
  const valor = row[nome];

  if (nome === colunaValor) {
    return Number((Number(valor || 0) * (1 + percentualAjuste)).toFixed(2));
  }

  if (nome === colunaStatus) {
    return obterValorStatusConcluido(column);
  }

  if (colunaEhData(column)) {
    return new Date();
  }

  if (colunaEhTexto(column) && colunaEhCodigoUnico(column)) {
    const base = valor ? String(valor) : nomeLower;
    return `${base}-mock-${Date.now()}-${index}`;
  }

  return valor;
}

async function buscarPedidosBase(connection, quantidade) {
  const ordersExists = await tabelaExiste(connection, 'orders');

  if (!ordersExists) {
    throw new Error('Tabela orders não encontrada.');
  }

  const columns = await obterColunas(connection, 'orders');
  const colunaPrimaria = obterColunaPrimaria(columns);

  if (!colunaPrimaria) {
    throw new Error('Não foi possível identificar a chave primária da tabela orders.');
  }

  const [orders] = await connection.query(
    `
    SELECT *
    FROM orders
    ORDER BY RAND()
    LIMIT ?
    `,
    [quantidade]
  );

  return {
    columns,
    colunaPrimaria,
    orders: orders || []
  };
}

async function criarPedidosMockSemBase({
  connection,
  quantidade
}) {
  const ordersExists = await tabelaExiste(connection, 'orders');

  if (!ordersExists) {
    throw new Error('Tabela orders não encontrada.');
  }

  const columns = await obterColunas(connection, 'orders');
  const colunaValor = obterColunaValor(columns);
  const colunaStatus = obterColunaStatus(columns);

  const colunasInsert = columns
    .filter((column) => !colunaEhAutoIncrement(column))
    .filter((column) => {
      if (column.Field === colunaValor) return true;
      if (column.Field === colunaStatus) return true;

      if (!colunaAceitaNull(column) && !colunaTemDefault(column)) {
        return true;
      }

      const nomeLower = String(column.Field || '').toLowerCase();

      return (
        nomeLower.includes('company') ||
        nomeLower.includes('store') ||
        nomeLower.includes('customer') ||
        nomeLower.includes('cliente') ||
        nomeLower.includes('date') ||
        nomeLower.includes('created_at') ||
        nomeLower.includes('updated_at') ||
        nomeLower.includes('status') ||
        nomeLower.includes('total') ||
        nomeLower.includes('amount') ||
        nomeLower.includes('valor') ||
        nomeLower.includes('receita')
      );
    })
    .map((column) => column.Field);

  let quantidadeGerada = 0;
  let receitaGerada = 0;

  for (let index = 0; index < quantidade; index += 1) {
    const valores = [];

    for (const coluna of colunasInsert) {
      const columnInfo = columns.find((column) => column.Field === coluna);

      const valor = await montarValorMockParaColuna({
        connection,
        column: columnInfo,
        colunaValor,
        colunaStatus,
        index
      });

      if (
        valor === null &&
        !colunaAceitaNull(columnInfo) &&
        !colunaTemDefault(columnInfo)
      ) {
        throw new Error(
          `Não foi possível gerar valor mock para a coluna obrigatória ${coluna} da tabela orders.`
        );
      }

      valores.push(valor);
    }

    const placeholders = colunasInsert.map(() => '?').join(', ');
    const colunasSql = colunasInsert.map((coluna) => `\`${coluna}\``).join(', ');

    await connection.query(
      `
      INSERT INTO orders (${colunasSql})
      VALUES (${placeholders})
      `,
      valores
    );

    quantidadeGerada += 1;

    if (colunaValor) {
      const indexValor = colunasInsert.indexOf(colunaValor);
      receitaGerada += Number(valores[indexValor] || 0);
    }
  }

  return {
    quantidadeGerada,
    receitaGerada
  };
}

async function duplicarPedidos({
  connection,
  quantidade,
  percentualAjuste
}) {
  const {
    columns,
    orders
  } = await buscarPedidosBase(connection, quantidade);

  if (!orders || orders.length === 0) {
    return await criarPedidosMockSemBase({
      connection,
      quantidade
    });
  }

  const colunaValor = obterColunaValor(columns);
  const colunaStatus = obterColunaStatus(columns);

  const colunasInsert = columns
    .filter((column) => !colunaEhAutoIncrement(column))
    .map((column) => column.Field);

  let quantidadeGerada = 0;
  let receitaGerada = 0;

  for (let index = 0; index < orders.length; index += 1) {
    const order = orders[index];

    const valores = colunasInsert.map((coluna) => {
      const columnInfo = columns.find((column) => column.Field === coluna);

      return ajustarValorParaInsert({
        column: columnInfo,
        row: order,
        colunaValor,
        colunaStatus,
        percentualAjuste,
        index
      });
    });

    const placeholders = colunasInsert.map(() => '?').join(', ');
    const colunasSql = colunasInsert.map((coluna) => `\`${coluna}\``).join(', ');

    await connection.query(
      `
      INSERT INTO orders (${colunasSql})
      VALUES (${placeholders})
      `,
      valores
    );

    quantidadeGerada += 1;

    if (colunaValor) {
      receitaGerada += Number(order[colunaValor] || 0) * (1 + percentualAjuste);
    }
  }

  return {
    quantidadeGerada,
    receitaGerada
  };
}

async function aumentarValoresPedidos({
  connection,
  quantidade,
  percentualAjuste
}) {
  const {
    columns,
    colunaPrimaria,
    orders
  } = await buscarPedidosBase(connection, quantidade);

  if (!orders || orders.length === 0) {
    const criados = await criarPedidosMockSemBase({
      connection,
      quantidade
    });

    return {
      quantidadeAfetada: criados.quantidadeGerada,
      impactoReceita: criados.receitaGerada
    };
  }

  const colunaValor = obterColunaValor(columns);

  if (!colunaValor) {
    return {
      quantidadeAfetada: 0,
      impactoReceita: 0
    };
  }

  let quantidadeAfetada = 0;
  let impactoReceita = 0;

  for (const order of orders) {
    const valorAtual = Number(order[colunaValor] || 0);
    const novoValor = Number((valorAtual * (1 + percentualAjuste)).toFixed(2));
    const diferenca = novoValor - valorAtual;

    await connection.query(
      `
      UPDATE orders
      SET \`${colunaValor}\` = ?
      WHERE \`${colunaPrimaria}\` = ?
      `,
      [novoValor, order[colunaPrimaria]]
    );

    quantidadeAfetada += 1;
    impactoReceita += diferenca;
  }

  return {
    quantidadeAfetada,
    impactoReceita
  };
}

async function reduzirValoresPedidos({
  connection,
  quantidade,
  percentualAjuste
}) {
  const {
    columns,
    colunaPrimaria,
    orders
  } = await buscarPedidosBase(connection, quantidade);

  if (!orders || orders.length === 0) {
    return {
      quantidadeAfetada: 0,
      impactoReceita: 0
    };
  }

  const colunaValor = obterColunaValor(columns);
  const colunaStatus = obterColunaStatus(columns);
  const statusColumn = columns.find((column) => column.Field === colunaStatus);

  if (!colunaValor) {
    return {
      quantidadeAfetada: 0,
      impactoReceita: 0
    };
  }

  let quantidadeAfetada = 0;
  let impactoReceita = 0;

  for (const order of orders) {
    const valorAtual = Number(order[colunaValor] || 0);
    const novoValor = Number(Math.max(valorAtual * (1 - percentualAjuste), 0).toFixed(2));
    const diferenca = novoValor - valorAtual;

    const deveCancelar = colunaStatus && Math.random() >= 0.65;

    if (deveCancelar) {
      await connection.query(
        `
        UPDATE orders
        SET \`${colunaValor}\` = ?,
            \`${colunaStatus}\` = ?
        WHERE \`${colunaPrimaria}\` = ?
        `,
        [
          novoValor,
          obterValorStatusCancelado(statusColumn),
          order[colunaPrimaria]
        ]
      );
    } else {
      await connection.query(
        `
        UPDATE orders
        SET \`${colunaValor}\` = ?
        WHERE \`${colunaPrimaria}\` = ?
        `,
        [novoValor, order[colunaPrimaria]]
      );
    }

    quantidadeAfetada += 1;
    impactoReceita += diferenca;
  }

  return {
    quantidadeAfetada,
    impactoReceita
  };
}

async function tentarAtualizarCamposDeCampanha({
  connection,
  direcao,
  percentualAjuste
}) {
  const campaignsExists = await tabelaExiste(connection, 'campaigns');

  if (!campaignsExists) {
    return {
      campanhasAfetadas: 0
    };
  }

  const columns = await obterColunas(connection, 'campaigns');
  const colunaPrimaria = obterColunaPrimaria(columns);

  if (!colunaPrimaria) {
    return {
      campanhasAfetadas: 0
    };
  }

  const colunasNumericas = columns
    .filter((column) => {
      const nome = String(column.Field || '').toLowerCase();

      const campoDePerformance =
        nome.includes('mensagem') ||
        nome.includes('message') ||
        nome.includes('pedido') ||
        nome.includes('order') ||
        nome.includes('receita') ||
        nome.includes('revenue') ||
        nome.includes('conversion') ||
        nome.includes('conversao');

      return colunaEhNumerica(column) && campoDePerformance;
    })
    .map((column) => column.Field);

  if (colunasNumericas.length === 0) {
    return {
      campanhasAfetadas: 0
    };
  }

  const [campanhas] = await connection.query(
    `
    SELECT *
    FROM campaigns
    ORDER BY RAND()
    LIMIT 5
    `
  );

  if (!campanhas || campanhas.length === 0) {
    return {
      campanhasAfetadas: 0
    };
  }

  let campanhasAfetadas = 0;

  for (const campanha of campanhas) {
    for (const coluna of colunasNumericas) {
      const valorAtual = Number(campanha[coluna] || 0);

      const novoValor =
        direcao === 'diminuir'
          ? Math.max(valorAtual * (1 - percentualAjuste), 0)
          : valorAtual * (1 + percentualAjuste);

      await connection.query(
        `
        UPDATE campaigns
        SET \`${coluna}\` = ?
        WHERE \`${colunaPrimaria}\` = ?
        `,
        [Number(novoValor.toFixed(2)), campanha[colunaPrimaria]]
      );
    }

    campanhasAfetadas += 1;
  }

  return {
    campanhasAfetadas
  };
}

async function gerarPedidos({ quantidade = 2 }) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const quantidadeNormalizada = normalizarQuantidade(quantidade);
    const percentualAjuste = Number(numeroAleatorioEntre(0.01, 0.05).toFixed(4));

    const resultadoDuplicacao = await duplicarPedidos({
      connection,
      quantidade: quantidadeNormalizada,
      percentualAjuste
    });

    await connection.commit();

    return {
      direcao: 'aumentar',
      quantidadeGerada: resultadoDuplicacao.quantidadeGerada,
      quantidadeAfetada: resultadoDuplicacao.quantidadeGerada,
      receitaGerada: Number(resultadoDuplicacao.receitaGerada.toFixed(2)),
      impactoReceita: Number(resultadoDuplicacao.receitaGerada.toFixed(2)),
      percentualAjuste,
      campanhasAfetadas: 0,
      atualizadoEm: new Date()
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function atualizarDados({
  direcao,
  quantidade,
  percentualAjuste
}) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const direcaoNormalizada = escolherDirecao(direcao);
    const quantidadeNormalizada = normalizarQuantidade(quantidade);
    const percentualNormalizado = normalizarPercentual(percentualAjuste);

    let resultadoPedidos;

    if (direcaoNormalizada === 'aumentar') {
      const deveDuplicarPedido = Math.random() >= 0.45;

      if (deveDuplicarPedido) {
        const resultadoDuplicacao = await duplicarPedidos({
          connection,
          quantidade: quantidadeNormalizada,
          percentualAjuste: percentualNormalizado
        });

        resultadoPedidos = {
          quantidadeAfetada: resultadoDuplicacao.quantidadeGerada,
          impactoReceita: resultadoDuplicacao.receitaGerada
        };
      } else {
        resultadoPedidos = await aumentarValoresPedidos({
          connection,
          quantidade: quantidadeNormalizada,
          percentualAjuste: percentualNormalizado
        });
      }
    } else {
      resultadoPedidos = await reduzirValoresPedidos({
        connection,
        quantidade: quantidadeNormalizada,
        percentualAjuste: percentualNormalizado
      });
    }

    const resultadoCampanhas = await tentarAtualizarCamposDeCampanha({
      connection,
      direcao: direcaoNormalizada,
      percentualAjuste: percentualNormalizado
    });

    await connection.commit();

    return {
      direcao: direcaoNormalizada,
      quantidadeAfetada: resultadoPedidos.quantidadeAfetada || 0,
      impactoReceita: Number((resultadoPedidos.impactoReceita || 0).toFixed(2)),
      percentualAjuste: percentualNormalizado,
      campanhasAfetadas: resultadoCampanhas.campanhasAfetadas || 0,
      atualizadoEm: new Date()
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  gerarPedidos,
  atualizarDados
};