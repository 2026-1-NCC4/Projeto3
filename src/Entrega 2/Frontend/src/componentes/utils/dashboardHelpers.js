export const prepararSerieComparativa = (dados = [], chaveValor) => {
  return dados.map((item, index) => {
    const atual = Number(item[chaveValor] || 0);
    const anterior = index > 0 ? Number(dados[index - 1]?.[chaveValor] || 0) : 0;

    const variacaoPercentual =
      anterior > 0
        ? ((atual - anterior) / anterior) * 100
        : 0;

    return {
      ...item,
      atual,
      anterior,
      variacaoPercentual
    };
  });
};

export const sortearVariacaoMock = () => {
  const direcao = Math.random() >= 0.5 ? 'aumentar' : 'diminuir';
  const quantidade = Math.floor(Math.random() * 3) + 1;
  const percentualAjuste = Number((Math.random() * 0.08 + 0.02).toFixed(4));

  return {
    direcao,
    quantidade,
    percentualAjuste
  };
};

export const montarDetalhesDashboard = ({
  dashboard,
  graficos,
  campanhas,
  clientes,
  indicadoresObrigatorios
}) => {
  const rankingEmpresas = dashboard?.rankingEmpresas || [];
  const performanceCanais = graficos.performanceCanais || [];
  const receitaPorMes = graficos.receitaPorMes || [];
  const pedidosPorMes = graficos.pedidosPorMes || [];
  const pedidosPorTipo = graficos.pedidosPorTipo || [];
  const topClientes = clientes?.rfm?.topClientes || [];
  const melhoresCampanhas = campanhas?.melhoresCampanhas || [];
  const mensagensCampanhaEmpresa =
    indicadoresObrigatorios?.mensagensPorCampanhaEmpresa || [];

  return {
    receita: {
      titulo: 'Detalhamento da receita total',
      descricao: 'Receita consolidada por empresa, mês e canal.',
      nomeArquivo: 'detalhamento_receita.csv',
      colunas: [
        { key: 'empresa', label: 'Empresa' },
        { key: 'receita', label: 'Receita' },
        { key: 'pedidos', label: 'Pedidos' },
        { key: 'ticketMedio', label: 'Ticket médio' },
        { key: 'recorrencia', label: 'Recorrência' },
        { key: 'status', label: 'Status' }
      ],
      dados: rankingEmpresas
    },

    pedidos: {
      titulo: 'Detalhamento do total de pedidos',
      descricao: 'Volume de pedidos por empresa e tipo de pedido.',
      nomeArquivo: 'detalhamento_pedidos.csv',
      colunas: [
        { key: 'empresa', label: 'Empresa' },
        { key: 'pedidos', label: 'Pedidos' },
        { key: 'receita', label: 'Receita' },
        { key: 'clientes', label: 'Clientes' },
        { key: 'ticketMedio', label: 'Ticket médio' },
        { key: 'status', label: 'Status' }
      ],
      dados: rankingEmpresas
    },

    ticket: {
      titulo: 'Detalhamento do ticket médio',
      descricao: 'Empresas ordenadas por ticket médio.',
      nomeArquivo: 'detalhamento_ticket_medio.csv',
      colunas: [
        { key: 'empresa', label: 'Empresa' },
        { key: 'ticketMedio', label: 'Ticket médio' },
        { key: 'receita', label: 'Receita' },
        { key: 'pedidos', label: 'Pedidos' },
        { key: 'clientes', label: 'Clientes' },
        { key: 'status', label: 'Status' }
      ],
      dados: [...rankingEmpresas].sort(
        (a, b) => Number(b.ticketMedio || 0) - Number(a.ticketMedio || 0)
      )
    },

    recorrencia: {
      titulo: 'Detalhamento da recorrência',
      descricao: 'Clientes e empresas com maior relevância para análise de recompra.',
      nomeArquivo: 'detalhamento_recorrencia.csv',
      colunas: [
        { key: 'customerid', label: 'Cliente' },
        { key: 'segmento', label: 'Segmento' },
        { key: 'receita', label: 'Receita' },
        { key: 'pedidos', label: 'Pedidos' },
        { key: 'ticketMedio', label: 'Ticket médio' },
        { key: 'recenciaDias', label: 'Recência em dias' },
        { key: 'scoreRFM', label: 'Score RFM' }
      ],
      dados: topClientes
    },

    crescimentoReceita: {
      titulo: 'Detalhamento do crescimento da receita',
      descricao: 'Série temporal com crescimento mensal da receita.',
      nomeArquivo: 'detalhamento_crescimento_receita.csv',
      colunas: [
        { key: 'periodo', label: 'Período' },
        { key: 'receita', label: 'Receita' },
        { key: 'crescimento', label: 'Crescimento' }
      ],
      dados: receitaPorMes
    },

    crescimentoPedidos: {
      titulo: 'Detalhamento do crescimento dos pedidos',
      descricao: 'Série temporal com crescimento mensal dos pedidos.',
      nomeArquivo: 'detalhamento_crescimento_pedidos.csv',
      colunas: [
        { key: 'periodo', label: 'Período' },
        { key: 'pedidos', label: 'Pedidos' },
        { key: 'crescimento', label: 'Crescimento' }
      ],
      dados: pedidosPorMes
    },

    campanhas: {
      titulo: 'Detalhamento das campanhas',
      descricao: 'Campanhas com receita, pedidos, mensagens e conversão.',
      nomeArquivo: 'detalhamento_campanhas.csv',
      colunas: [
        { key: 'campanha', label: 'Campanha' },
        { key: 'receita', label: 'Receita' },
        { key: 'pedidos', label: 'Pedidos' },
        { key: 'mensagens', label: 'Mensagens' },
        { key: 'clientes', label: 'Clientes' },
        { key: 'conversao', label: 'Conversão' }
      ],
      dados: melhoresCampanhas
    },

    receitaCampanhas: {
      titulo: 'Detalhamento da receita via campanhas',
      descricao: 'Mensagens e conversões por campanha e empresa.',
      nomeArquivo: 'detalhamento_receita_campanhas.csv',
      colunas: [
        { key: 'empresa', label: 'Empresa' },
        { key: 'campanha', label: 'Campanha' },
        { key: 'mensagens', label: 'Mensagens' },
        { key: 'pedidosConvertidos', label: 'Pedidos convertidos' },
        { key: 'clientes', label: 'Clientes' },
        { key: 'receita', label: 'Receita' },
        { key: 'taxaConversao', label: 'Taxa de conversão' }
      ],
      dados: mensagensCampanhaEmpresa
    },

    empresas: {
      titulo: 'Detalhamento de empresas cadastradas',
      descricao: 'Ranking operacional das empresas da base.',
      nomeArquivo: 'detalhamento_empresas.csv',
      colunas: [
        { key: 'empresa', label: 'Empresa' },
        { key: 'receita', label: 'Receita' },
        { key: 'pedidos', label: 'Pedidos' },
        { key: 'clientes', label: 'Clientes' },
        { key: 'ticketMedio', label: 'Ticket médio' },
        { key: 'recorrencia', label: 'Recorrência' },
        { key: 'status', label: 'Status' }
      ],
      dados: rankingEmpresas
    },

    clientes: {
      titulo: 'Detalhamento de clientes totais',
      descricao: 'Top clientes classificados pelo RFM.',
      nomeArquivo: 'detalhamento_clientes.csv',
      colunas: [
        { key: 'customerid', label: 'Cliente' },
        { key: 'segmento', label: 'Segmento' },
        { key: 'receita', label: 'Receita' },
        { key: 'pedidos', label: 'Pedidos' },
        { key: 'ticketMedio', label: 'Ticket médio' },
        { key: 'recenciaDias', label: 'Recência em dias' },
        { key: 'scoreRFM', label: 'Score RFM' }
      ],
      dados: topClientes
    },

    clientesAtivos: {
      titulo: 'Detalhamento de clientes ativos',
      descricao: 'Top clientes ativos pela análise RFM.',
      nomeArquivo: 'detalhamento_clientes_ativos.csv',
      colunas: [
        { key: 'customerid', label: 'Cliente' },
        { key: 'segmento', label: 'Segmento' },
        { key: 'receita', label: 'Receita' },
        { key: 'pedidos', label: 'Pedidos' },
        { key: 'ticketMedio', label: 'Ticket médio' },
        { key: 'recenciaDias', label: 'Recência em dias' },
        { key: 'scoreRFM', label: 'Score RFM' }
      ],
      dados: topClientes.filter((cliente) => Number(cliente.recenciaDias || 9999) <= 90)
    },

    clientesInativos: {
      titulo: 'Detalhamento de clientes inativos',
      descricao: 'Clientes com maior recência, úteis para campanhas de reativação.',
      nomeArquivo: 'detalhamento_clientes_inativos.csv',
      colunas: [
        { key: 'customerid', label: 'Cliente' },
        { key: 'segmento', label: 'Segmento' },
        { key: 'receita', label: 'Receita' },
        { key: 'pedidos', label: 'Pedidos' },
        { key: 'ticketMedio', label: 'Ticket médio' },
        { key: 'recenciaDias', label: 'Recência em dias' },
        { key: 'scoreRFM', label: 'Score RFM' }
      ],
      dados: [...topClientes].sort(
        (a, b) => Number(b.recenciaDias || 0) - Number(a.recenciaDias || 0)
      )
    },

    canais: {
      titulo: 'Detalhamento por canal',
      descricao: 'Receita e pedidos por canal de venda.',
      nomeArquivo: 'detalhamento_canais.csv',
      colunas: [
        { key: 'canal', label: 'Canal' },
        { key: 'receita', label: 'Receita' },
        { key: 'pedidos', label: 'Pedidos' },
        { key: 'ticketMedio', label: 'Ticket médio' }
      ],
      dados: performanceCanais
    },

    tiposPedido: {
      titulo: 'Detalhamento por tipo de pedido',
      descricao: 'Receita e pedidos por tipo de pedido.',
      nomeArquivo: 'detalhamento_tipos_pedido.csv',
      colunas: [
        { key: 'tipo', label: 'Tipo' },
        { key: 'receita', label: 'Receita' },
        { key: 'pedidos', label: 'Pedidos' }
      ],
      dados: pedidosPorTipo
    }
  };
};