import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  Activity,
  AlertTriangle,
  Building2,
  DollarSign,
  Download,
  FileText,
  Filter,
  Megaphone,
  Receipt,
  Repeat,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
  UserCheck,
  UserX,
  X
} from 'lucide-react';

import Sidebar from './Sidebar';

const API_URL = 'http://localhost:3001/api';

const formatarMoeda = (valor) => {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

const formatarNumero = (valor) => {
  return Number(valor || 0).toLocaleString('pt-BR');
};

const formatarPercentual = (valor) => {
  return `${Number(valor || 0).toFixed(2)}%`;
};

const cores = ['#f26322', '#ff8a4c', '#ffb088', '#ffd2bd', '#f7a072', '#d9480f'];


const prepararSerieComparativa = (dados = [], chaveValor) => {
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

const TooltipSerieTemporal = ({ active, payload, label, tipo }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-orange/10 p-3">
      <p className="text-sm font-bold text-text-dark mb-2">
        {label}
      </p>

      {payload.map((item, index) => {
        const key = String(item.dataKey || '').toLowerCase();
        const valor = item.value;

        const valorFormatado =
          key.includes('variacao')
            ? formatarPercentual(valor)
            : tipo === 'moeda'
              ? formatarMoeda(valor)
              : formatarNumero(valor);

        return (
          <p key={`${item.dataKey}-${index}`} className="text-xs text-gray-600">
            <strong>{item.name || item.dataKey}:</strong> {valorFormatado}
          </p>
        );
      })}
    </div>
  );
};

const CardGrafico = ({ titulo, descricao, children }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-orange/10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-dark">
          {titulo}
        </h2>

        {descricao && (
          <p className="text-sm text-gray-500 mt-1">
            {descricao}
          </p>
        )}
      </div>

      <div className="h-80">
        {children}
      </div>
    </div>
  );
};

const KpiCard = ({ titulo, valor, descricao, icon: Icon, status, onClick }) => {
  const statusClass =
    status === 'risco'
      ? 'bg-red-100 text-red-700'
      : status === 'atencao'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-orange/10 text-orange';

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm p-6 border border-orange/10 hover:shadow-md transition-all text-left w-full"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{titulo}</p>

          <h3 className="text-3xl font-bold mt-2 text-text-dark">
            {valor}
          </h3>

          {descricao && (
            <p className="text-xs text-gray-400 mt-2">
              {descricao}
            </p>
          )}

          <p className="text-xs text-orange font-semibold mt-3">
            Clique para detalhar
          </p>
        </div>

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${statusClass}`}>
          <Icon size={24} />
        </div>
      </div>
    </button>
  );
};

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        status === 'saudavel'
          ? 'bg-green-100 text-green-700'
          : status === 'atencao'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
      }`}
    >
      {status}
    </span>
  );
};

const exportarCsv = ({ nomeArquivo, colunas, dados }) => {
  if (!dados || dados.length === 0) {
    return;
  }

  const cabecalho = colunas.map((coluna) => coluna.label).join(';');

  const linhas = dados.map((item) => {
    return colunas
      .map((coluna) => {
        const valor = item[coluna.key] ?? '';
        const texto = String(valor).replace(/"/g, '""');
        return `"${texto}"`;
      })
      .join(';');
  });

  const csv = [cabecalho, ...linhas].join('\n');

  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};


const exportarPdf = ({ titulo, descricao, nomeArquivo, colunas, dados }) => {
  if (!dados || dados.length === 0) {
    return;
  }

  const documento = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  const dataAtual = new Date().toLocaleString('pt-BR');

  documento.setFontSize(16);
  documento.text(titulo || 'Detalhamento do Dashboard', 40, 40);

  documento.setFontSize(9);
  documento.text(descricao || 'Tabela de apoio exportada do painel.', 40, 58);

  documento.setFontSize(8);
  documento.text(`Exportado em: ${dataAtual}`, 40, 74);

  const head = [colunas.map((coluna) => coluna.label)];

  const body = dados.map((item) => {
    return colunas.map((coluna) => {
      const valor = item[coluna.key];
      const key = coluna.key.toLowerCase();

      if (key.includes('receita')) return formatarMoeda(valor);
      if (key.includes('ticket')) return formatarMoeda(valor);
      if (key.includes('recorrencia')) return formatarPercentual(valor);
      if (key.includes('conversao')) return formatarPercentual(valor);
      if (key.includes('crescimento')) return formatarPercentual(valor);
      if (key.includes('pedidos')) return formatarNumero(valor);
      if (key.includes('clientes')) return formatarNumero(valor);
      if (key.includes('mensagens')) return formatarNumero(valor);
      if (key.includes('score')) return formatarNumero(valor);

      return valor ?? '-';
    });
  });

  autoTable(documento, {
    head,
    body,
    startY: 92,
    styles: {
      fontSize: 7,
      cellPadding: 4,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [242, 99, 34],
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [250, 246, 241]
    },
    margin: {
      left: 40,
      right: 40
    }
  });

  documento.save(nomeArquivo.replace('.csv', '.pdf'));
};

const Dashboard = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [periodoSelecionado, setPeriodoSelecionado] = useState('todos');
  const [empresaSelecionada, setEmpresaSelecionada] = useState('todas');
  const [canalSelecionado, setCanalSelecionado] = useState('todos');
  const [tipoPedidoSelecionado, setTipoPedidoSelecionado] = useState('todos');

  const [detalheAtivo, setDetalheAtivo] = useState(null);
  const [tempoRealAtivo] = useState(true);
  const [gerandoMock, setGerandoMock] = useState(false);
  const [resultadoTempoReal, setResultadoTempoReal] = useState(null);
  const [erroTempoReal, setErroTempoReal] = useState('');
  const [ultimaAtualizacaoTempoReal, setUltimaAtualizacaoTempoReal] = useState(null);

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const token = localStorage.getItem('token');

  const podeConvidarStaff = usuario.role === 'admin';
  const isPainelCannoli = usuario.role === 'admin' || usuario.role === 'colaborador';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const carregarDashboardAdmin = async (filtrosSelecionados = {}, opcoes = {}) => {
    try {
      if (!opcoes.silencioso) {
        setLoading(true);
      }

      setErro('');

      const params = new URLSearchParams({
        periodo: filtrosSelecionados.periodo || periodoSelecionado,
        empresa: filtrosSelecionados.empresa || empresaSelecionada,
        canal: filtrosSelecionados.canal || canalSelecionado,
        tipoPedido: filtrosSelecionados.tipoPedido || tipoPedidoSelecionado
      });

      const response = await fetch(`${API_URL}/admin-dashboard?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao carregar dashboard.');
      }

      setDashboard(data.data);
    } catch (error) {
      setErro(error.message);
    } finally {
      if (!opcoes.silencioso) {
        setLoading(false);
      }
    }
  };

  const gerarAtualizacaoMock = async ({ silencioso = false } = {}) => {
    try {
      setErroTempoReal('');

      if (!silencioso) {
        setGerandoMock(true);
      }

      const response = await fetch(`${API_URL}/mock-tempo-real/gerar-pedidos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quantidade: 2
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Erro ao gerar dados simulados.');
      }

      setResultadoTempoReal(data.data);
      setUltimaAtualizacaoTempoReal(new Date());

      await carregarDashboardAdmin(
        {
          periodo: periodoSelecionado,
          empresa: empresaSelecionada,
          canal: canalSelecionado,
          tipoPedido: tipoPedidoSelecionado
        },
        { silencioso: true }
      );
    } catch (error) {
      setErroTempoReal(error.message);
    } finally {
      if (!silencioso) {
        setGerandoMock(false);
      }
    }
  };

  const aplicarFiltros = () => {
    setDetalheAtivo(null);

    carregarDashboardAdmin({
      periodo: periodoSelecionado,
      empresa: empresaSelecionada,
      canal: canalSelecionado,
      tipoPedido: tipoPedidoSelecionado
    });
  };

  const limparFiltros = () => {
    setPeriodoSelecionado('todos');
    setEmpresaSelecionada('todas');
    setCanalSelecionado('todos');
    setTipoPedidoSelecionado('todos');
    setDetalheAtivo(null);

    carregarDashboardAdmin({
      periodo: 'todos',
      empresa: 'todas',
      canal: 'todos',
      tipoPedido: 'todos'
    });
  };

  useEffect(() => {
    if (!tempoRealAtivo || !isPainelCannoli || !token) {
      return undefined;
    }

    gerarAtualizacaoMock({ silencioso: true });

    const intervalo = setInterval(() => {
      gerarAtualizacaoMock({ silencioso: true });
    }, 60 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, [
    tempoRealAtivo,
    isPainelCannoli,
    token,
    periodoSelecionado,
    empresaSelecionada,
    canalSelecionado,
    tipoPedidoSelecionado
  ]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (isPainelCannoli) {
      carregarDashboardAdmin({
        periodo: 'todos',
        empresa: 'todas',
        canal: 'todos',
        tipoPedido: 'todos'
      });
    } else {
      setLoading(false);
    }
  }, []);

  const kpis = dashboard?.kpis || {};
  const graficos = dashboard?.graficos || {};
  const filtros = dashboard?.filtros || {};
  const crescimento = dashboard?.crescimento || {};
  const segmentacao = dashboard?.segmentacaoClientes || {};
  const empresasRisco = dashboard?.empresasRisco || {};
  const indicadoresObrigatorios = dashboard?.indicadoresObrigatorios || {};
  const campanhas = dashboard?.campanhas || {};
  const clientes = dashboard?.clientes || {};

  const serieReceitaComparativa = useMemo(() => {
    return prepararSerieComparativa(graficos.receitaPorMes || [], 'receita');
  }, [graficos.receitaPorMes]);

  const seriePedidosComparativa = useMemo(() => {
    return prepararSerieComparativa(graficos.pedidosPorMes || [], 'pedidos');
  }, [graficos.pedidosPorMes]);


  const empresaSelecionadaNome = useMemo(() => {
    if (empresaSelecionada === 'todas') return 'Todas as empresas';

    const empresa = filtros.empresas?.find((item) => item.id === empresaSelecionada);
    return empresa?.nome || 'Empresa selecionada';
  }, [empresaSelecionada, filtros.empresas]);

  const detalhes = useMemo(() => {
    const rankingEmpresas = dashboard?.rankingEmpresas || [];
    const performanceCanais = graficos.performanceCanais || [];
    const receitaPorMes = graficos.receitaPorMes || [];
    const pedidosPorMes = graficos.pedidosPorMes || [];
    const pedidosPorTipo = graficos.pedidosPorTipo || [];
    const topClientes = clientes?.rfm?.topClientes || [];
    const melhoresCampanhas = campanhas?.melhoresCampanhas || [];
    const mensagensCampanhaEmpresa = indicadoresObrigatorios?.mensagensPorCampanhaEmpresa || [];

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
        dados: [...rankingEmpresas].sort((a, b) => Number(b.ticketMedio || 0) - Number(a.ticketMedio || 0))
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
        dados: [...topClientes].sort((a, b) => Number(b.recenciaDias || 0) - Number(a.recenciaDias || 0))
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
  }, [dashboard, graficos, campanhas, clientes, indicadoresObrigatorios]);

  const detalheSelecionado = detalheAtivo ? detalhes[detalheAtivo] : null;

  const abrirDetalhe = (tipo) => {
    setDetalheAtivo(tipo);

    setTimeout(() => {
      const elemento = document.getElementById('detalhamento-kpi');
      if (elemento) {
        elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const renderizarValorTabela = (key, valor) => {
    if (key.toLowerCase().includes('receita')) return formatarMoeda(valor);
    if (key.toLowerCase().includes('ticket')) return formatarMoeda(valor);
    if (key.toLowerCase().includes('recorrencia')) return formatarPercentual(valor);
    if (key.toLowerCase().includes('conversao')) return formatarPercentual(valor);
    if (key.toLowerCase().includes('crescimento')) return formatarPercentual(valor);
    if (key.toLowerCase().includes('pedidos')) return formatarNumero(valor);
    if (key.toLowerCase().includes('clientes')) return formatarNumero(valor);
    if (key.toLowerCase().includes('mensagens')) return formatarNumero(valor);
    if (key.toLowerCase().includes('score')) return formatarNumero(valor);

    return valor ?? '-';
  };

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 lg:ml-72">
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed top-4 left-4 z-50 bg-orange p-2 rounded-lg shadow-lg"
        >
          <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>

        <main className="p-5 lg:p-8">
          <header className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-dark">
                {isPainelCannoli ? 'Painel Global Cannoli' : 'Painel da Empresa'}
              </h1>

              <p className="text-sm text-gray-500 mt-2">
                {isPainelCannoli
                  ? 'Visão consolidada de empresas, clientes, pedidos, campanhas e performance comercial.'
                  : 'Visão estratégica e operacional do seu negócio.'}
              </p>
            </div>

            {podeConvidarStaff && (
              <button
                onClick={() => navigate('/staff')}
                className="px-5 py-3 rounded-xl bg-orange text-white font-medium hover:bg-orange-dark transition-colors shadow-sm"
              >
                Convidar colaborador Cannoli
              </button>
            )}
          </header>

          <section className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-orange/10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Acesso atual</p>

                <h2 className="text-2xl font-bold mt-1">
                  Olá, {usuario.name || 'usuário'}
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Perfil: <strong>{usuario.role || '-'}</strong>
                </p>
              </div>

              {dashboard?.atualizadoEm && (
                <div className="text-sm text-gray-500">
                  Atualizado em:{' '}
                  <strong>
                    {new Date(dashboard.atualizadoEm).toLocaleString('pt-BR')}
                  </strong>
                </div>
              )}
            </div>
          </section>

          {isPainelCannoli && (
            <section className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-orange/10">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tempoRealAtivo ? 'bg-green-100 text-green-700' : 'bg-orange/10 text-orange'}`}>
                    <Activity size={24} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-text-dark">
                      API mock em tempo real
                    </h2>

                    <p className="text-sm text-gray-500 mt-1 max-w-3xl">
                      Simula novos pedidos via API e atualiza automaticamente o dashboard por polling a cada 1 hora.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="px-3 py-1 rounded-full font-semibold bg-green-100 text-green-700">
                        Tempo real ativo
                      </span>

                      {ultimaAtualizacaoTempoReal && (
                        <span className="px-3 py-1 rounded-full bg-orange/10 text-orange font-semibold">
                          Última atualização: {ultimaAtualizacaoTempoReal.toLocaleTimeString('pt-BR')}
                        </span>
                      )}

                      {resultadoTempoReal && (
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                          Último mock: {formatarNumero(resultadoTempoReal.quantidadeGerada)} pedido(s) · {formatarMoeda(resultadoTempoReal.receitaGerada)}
                        </span>
                      )}
                    </div>

                    {erroTempoReal && (
                      <p className="text-sm text-red-700 mt-3">
                        {erroTempoReal}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-left xl:text-right rounded-2xl bg-green-50 border border-green-100 px-5 py-4 min-w-[210px]">
                  <p className="text-xs text-green-700">
                    Atualização automática
                  </p>

                  <p className="text-lg font-bold text-green-700 mt-1">
                    Ativa
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Polling a cada 1 hora
                  </p>
                </div>
              </div>
            </section>
          )}

          {loading && (
            <section className="bg-white rounded-2xl shadow-sm p-8 border border-orange/10">
              <p className="text-gray-500">Carregando dados do painel...</p>
            </section>
          )}

          {erro && (
            <section className="bg-red-100 rounded-2xl p-6 border border-red-300 text-red-700">
              {erro}
            </section>
          )}

          {!loading && !erro && isPainelCannoli && dashboard && (
            <>
              <section className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-orange/10">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-orange/10 text-orange flex items-center justify-center">
                    <Filter size={20} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold text-text-dark">
                      Filtros globais
                    </h2>
                    <p className="text-sm text-gray-500">
                      Os filtros recalculam a visão global usando o motor Python do dashboard.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Período
                    </label>
                    <select
                      value={periodoSelecionado}
                      onChange={(e) => setPeriodoSelecionado(e.target.value)}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 bg-white text-sm outline-none focus:border-orange"
                    >
                      <option value="todos">Todos os períodos</option>
                      {filtros.periodos?.map((periodo) => (
                        <option key={periodo} value={periodo}>
                          {periodo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Empresa
                    </label>
                    <select
                      value={empresaSelecionada}
                      onChange={(e) => setEmpresaSelecionada(e.target.value)}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 bg-white text-sm outline-none focus:border-orange"
                    >
                      <option value="todas">Todas as empresas</option>
                      {filtros.empresas?.map((empresa) => (
                        <option key={empresa.id} value={empresa.id}>
                          {empresa.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Canal
                    </label>
                    <select
                      value={canalSelecionado}
                      onChange={(e) => setCanalSelecionado(e.target.value)}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 bg-white text-sm outline-none focus:border-orange"
                    >
                      <option value="todos">Todos os canais</option>
                      {filtros.canais?.map((canal) => (
                        <option key={canal} value={canal}>
                          {canal}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Tipo de pedido
                    </label>
                    <select
                      value={tipoPedidoSelecionado}
                      onChange={(e) => setTipoPedidoSelecionado(e.target.value)}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 bg-white text-sm outline-none focus:border-orange"
                    >
                      <option value="todos">Todos os tipos</option>
                      {filtros.tiposPedido?.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-5 text-xs text-gray-500">
                  Visão atual:{' '}
                  <strong>{empresaSelecionadaNome}</strong> ·{' '}
                  <strong>{periodoSelecionado === 'todos' ? 'todos os períodos' : periodoSelecionado}</strong> ·{' '}
                  <strong>{canalSelecionado === 'todos' ? 'todos os canais' : canalSelecionado}</strong> ·{' '}
                  <strong>{tipoPedidoSelecionado === 'todos' ? 'todos os tipos' : tipoPedidoSelecionado}</strong>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={aplicarFiltros}
                    disabled={loading}
                    className="px-5 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-60"
                  >
                    Aplicar filtros
                  </button>

                  <button
                    type="button"
                    onClick={limparFiltros}
                    disabled={loading}
                    className="px-5 py-3 rounded-xl bg-orange/10 text-orange font-semibold hover:bg-orange/15 transition disabled:opacity-60"
                  >
                    Limpar filtros
                  </button>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                <KpiCard
                  titulo="Receita total"
                  valor={formatarMoeda(kpis.receitaTotal)}
                  descricao="Consolidado da visão atual"
                  icon={DollarSign}
                  onClick={() => abrirDetalhe('receita')}
                />

                <KpiCard
                  titulo="Total de pedidos"
                  valor={formatarNumero(kpis.totalPedidos)}
                  descricao="Pedidos concluídos"
                  icon={Receipt}
                  onClick={() => abrirDetalhe('pedidos')}
                />

                <KpiCard
                  titulo="Ticket médio"
                  valor={formatarMoeda(kpis.ticketMedio)}
                  descricao="Receita / pedidos"
                  icon={ShoppingBag}
                  onClick={() => abrirDetalhe('ticket')}
                />

                <KpiCard
                  titulo="Taxa de recorrência"
                  valor={formatarPercentual(kpis.taxaRecorrencia)}
                  descricao="Clientes com 2+ pedidos"
                  icon={Repeat}
                  onClick={() => abrirDetalhe('recorrencia')}
                />
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                <KpiCard
                  titulo="Crescimento da receita"
                  valor={formatarPercentual(kpis.crescimentoReceita)}
                  descricao="Comparação com mês anterior"
                  icon={kpis.crescimentoReceita < 0 ? TrendingDown : TrendingUp}
                  status={crescimento.statusReceita}
                  onClick={() => abrirDetalhe('crescimentoReceita')}
                />

                <KpiCard
                  titulo="Crescimento dos pedidos"
                  valor={formatarPercentual(kpis.crescimentoPedidos)}
                  descricao="Comparação com mês anterior"
                  icon={kpis.crescimentoPedidos < 0 ? TrendingDown : TrendingUp}
                  status={crescimento.statusPedidos}
                  onClick={() => abrirDetalhe('crescimentoPedidos')}
                />

                <KpiCard
                  titulo="Total de campanhas"
                  valor={formatarNumero(kpis.totalCampanhas)}
                  descricao="Campanhas registradas"
                  icon={Megaphone}
                  onClick={() => abrirDetalhe('campanhas')}
                />

                <KpiCard
                  titulo="Receita via campanhas"
                  valor={formatarMoeda(kpis.receitaCampanhas)}
                  descricao="Pedidos associados a campanhas"
                  icon={DollarSign}
                  onClick={() => abrirDetalhe('receitaCampanhas')}
                />
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                <KpiCard
                  titulo="Empresas cadastradas"
                  valor={formatarNumero(kpis.totalEmpresas)}
                  descricao="Lojas na base"
                  icon={Building2}
                  onClick={() => abrirDetalhe('empresas')}
                />

                <KpiCard
                  titulo="Clientes totais"
                  valor={formatarNumero(kpis.totalClientes)}
                  descricao="Base consolidada"
                  icon={Users}
                  onClick={() => abrirDetalhe('clientes')}
                />

                <KpiCard
                  titulo="Clientes ativos"
                  valor={formatarNumero(kpis.clientesAtivos)}
                  descricao="Compraram nos últimos 90 dias"
                  icon={UserCheck}
                  onClick={() => abrirDetalhe('clientesAtivos')}
                />

                <KpiCard
                  titulo="Clientes inativos"
                  valor={formatarNumero(kpis.clientesInativos)}
                  descricao="Oportunidade de reativação"
                  icon={UserX}
                  status="atencao"
                  onClick={() => abrirDetalhe('clientesInativos')}
                />
              </section>

              {detalheSelecionado && (
                <section
                  id="detalhamento-kpi"
                  className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-orange/10"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                    <div>
                      <h2 className="text-xl font-bold text-text-dark">
                        {detalheSelecionado.titulo}
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        {detalheSelecionado.descricao}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          exportarCsv({
                            nomeArquivo: detalheSelecionado.nomeArquivo,
                            colunas: detalheSelecionado.colunas,
                            dados: detalheSelecionado.dados
                          })
                        }
                        disabled={!detalheSelecionado.dados || detalheSelecionado.dados.length === 0}
                        className="px-4 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-50 flex items-center gap-2"
                      >
                        <Download size={18} />
                        Exportar CSV
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          exportarPdf({
                            titulo: detalheSelecionado.titulo,
                            descricao: detalheSelecionado.descricao,
                            nomeArquivo: detalheSelecionado.nomeArquivo,
                            colunas: detalheSelecionado.colunas,
                            dados: detalheSelecionado.dados
                          })
                        }
                        disabled={!detalheSelecionado.dados || detalheSelecionado.dados.length === 0}
                        className="px-4 py-3 rounded-xl bg-white border border-orange/20 text-orange font-semibold hover:bg-orange/5 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        <FileText size={18} />
                        Exportar PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => setDetalheAtivo(null)}
                        className="px-4 py-3 rounded-xl bg-orange/10 text-orange font-semibold hover:bg-orange/15 transition flex items-center gap-2"
                      >
                        <X size={18} />
                        Fechar
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          {detalheSelecionado.colunas.map((coluna) => (
                            <th key={coluna.key} className="py-3 pr-4">
                              {coluna.label}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {(detalheSelecionado.dados || []).slice(0, 30).map((item, index) => (
                          <tr key={index} className="border-b last:border-b-0">
                            {detalheSelecionado.colunas.map((coluna) => (
                              <td key={coluna.key} className="py-3 pr-4">
                                {coluna.key === 'status' ? (
                                  <StatusBadge status={item[coluna.key]} />
                                ) : (
                                  renderizarValorTabela(coluna.key, item[coluna.key])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}

                        {(!detalheSelecionado.dados || detalheSelecionado.dados.length === 0) && (
                          <tr>
                            <td
                              colSpan={detalheSelecionado.colunas.length}
                              className="py-6 text-center text-gray-500"
                            >
                              Nenhum dado encontrado para este detalhamento.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {detalheSelecionado.dados?.length > 30 && (
                    <p className="text-xs text-gray-500 mt-4">
                      Mostrando os primeiros 30 registros. A exportação CSV inclui todos os registros disponíveis.
                    </p>
                  )}
                </section>
              )}

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <CardGrafico
                  titulo="Receita por mês"
                  descricao="Série temporal comparando o período atual com o período anterior e a variação percentual."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={serieReceitaComparativa}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                      <YAxis
                        yAxisId="valor"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatarMoeda(value)}
                      />
                      <YAxis
                        yAxisId="percentual"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${Number(value || 0).toFixed(0)}%`}
                      />
                      <Tooltip content={<TooltipSerieTemporal tipo="moeda" />} />
                      <Legend />
                      <ReferenceLine yAxisId="percentual" y={0} stroke="#999" strokeDasharray="3 3" />
                      <Bar
                        yAxisId="valor"
                        dataKey="anterior"
                        name="Período anterior"
                        fill="#ffb088"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        yAxisId="valor"
                        dataKey="atual"
                        name="Período atual"
                        fill="#f26322"
                        radius={[8, 8, 0, 0]}
                      />
                      <Line
                        yAxisId="percentual"
                        type="monotone"
                        dataKey="variacaoPercentual"
                        name="Variação %"
                        stroke="#d9480f"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardGrafico>

                <CardGrafico
                  titulo="Pedidos por mês"
                  descricao="Série temporal comparando pedidos do período atual com o período anterior e a variação percentual."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={seriePedidosComparativa}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                      <YAxis
                        yAxisId="valor"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => formatarNumero(value)}
                      />
                      <YAxis
                        yAxisId="percentual"
                        orientation="right"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${Number(value || 0).toFixed(0)}%`}
                      />
                      <Tooltip content={<TooltipSerieTemporal tipo="numero" />} />
                      <Legend />
                      <ReferenceLine yAxisId="percentual" y={0} stroke="#999" strokeDasharray="3 3" />
                      <Bar
                        yAxisId="valor"
                        dataKey="anterior"
                        name="Período anterior"
                        fill="#ffb088"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        yAxisId="valor"
                        dataKey="atual"
                        name="Período atual"
                        fill="#f26322"
                        radius={[8, 8, 0, 0]}
                      />
                      <Line
                        yAxisId="percentual"
                        type="monotone"
                        dataKey="variacaoPercentual"
                        name="Variação %"
                        stroke="#d9480f"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardGrafico>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-orange/10">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-text-dark">
                      Segmentação global de clientes
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Distribuição da base por comportamento de compra dentro da visão atual.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <button type="button" onClick={() => abrirDetalhe('clientesAtivos')} className="rounded-2xl bg-orange/5 p-5 text-left">
                      <p className="text-sm text-gray-500">Ativos</p>
                      <h3 className="text-2xl font-bold mt-1">
                        {formatarNumero(segmentacao.ativos)}
                      </h3>
                    </button>

                    <button type="button" onClick={() => abrirDetalhe('clientesInativos')} className="rounded-2xl bg-orange/5 p-5 text-left">
                      <p className="text-sm text-gray-500">Inativos</p>
                      <h3 className="text-2xl font-bold mt-1">
                        {formatarNumero(segmentacao.inativos)}
                      </h3>
                    </button>

                    <button type="button" onClick={() => abrirDetalhe('recorrencia')} className="rounded-2xl bg-orange/5 p-5 text-left">
                      <p className="text-sm text-gray-500">Recorrentes</p>
                      <h3 className="text-2xl font-bold mt-1">
                        {formatarNumero(segmentacao.recorrentes)}
                      </h3>
                    </button>

                    <button type="button" onClick={() => abrirDetalhe('clientes')} className="rounded-2xl bg-orange/5 p-5 text-left">
                      <p className="text-sm text-gray-500">Ocasionais</p>
                      <h3 className="text-2xl font-bold mt-1">
                        {formatarNumero(segmentacao.ocasionais)}
                      </h3>
                    </button>

                    <button type="button" onClick={() => abrirDetalhe('clientes')} className="rounded-2xl bg-orange/5 p-5 text-left">
                      <p className="text-sm text-gray-500">Sem pedido</p>
                      <h3 className="text-2xl font-bold mt-1">
                        {formatarNumero(segmentacao.semPedido)}
                      </h3>
                    </button>

                    <button type="button" onClick={() => abrirDetalhe('clientes')} className="rounded-2xl bg-orange/5 p-5 text-left">
                      <p className="text-sm text-gray-500">Com pedido</p>
                      <h3 className="text-2xl font-bold mt-1">
                        {formatarNumero(segmentacao.comPedido)}
                      </h3>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => abrirDetalhe('canais')}
                  className="bg-white rounded-2xl shadow-sm p-6 border border-orange/10 text-left"
                >
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-text-dark">
                      Receita por canal
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Participação dos principais canais. Clique para detalhar.
                    </p>
                  </div>

                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={(graficos.performanceCanais || []).slice(0, 6)}
                          dataKey="receita"
                          nameKey="canal"
                          innerRadius={55}
                          outerRadius={100}
                          paddingAngle={3}
                        >
                          {(graficos.performanceCanais || []).slice(0, 6).map((entry, index) => (
                            <Cell key={entry.canal} fill={cores[index % cores.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatarMoeda(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 mt-2">
                    {(graficos.performanceCanais || []).slice(0, 6).map((canal, index) => (
                      <div key={canal.canal} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cores[index % cores.length] }}
                          />
                          <span className="text-gray-600">{canal.canal}</span>
                        </div>

                        <span className="font-semibold text-text-dark">
                          {formatarMoeda(canal.receita)}
                        </span>
                      </div>
                    ))}
                  </div>
                </button>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-orange/10">
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-text-dark">
                      Top empresas por receita
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Empresas com maior faturamento dentro da visão atual.
                    </p>
                  </div>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={graficos.topEmpresasReceita || []}
                        layout="vertical"
                        margin={{ left: 40, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis
                          type="category"
                          dataKey="empresa"
                          tick={{ fontSize: 11 }}
                          width={170}
                        />
                        <Tooltip formatter={(value) => formatarMoeda(value)} />
                        <Bar dataKey="receita" radius={[0, 10, 10, 0]} fill="#f26322" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 border border-orange/10">
                  <h2 className="text-xl font-bold text-text-dark mb-4">
                    Empresas em risco
                  </h2>

                  <div className="space-y-3">
                    {(empresasRisco.baixaRecorrencia || []).slice(0, 5).map((empresa, index) => (
                      <div key={index} className="rounded-xl border border-red-100 bg-red-50 p-4">
                        <p className="text-sm font-bold text-text-dark">
                          {empresa.empresa}
                        </p>

                        <p className="text-xs text-red-700 mt-1">
                          Recorrência: {formatarPercentual(empresa.recorrencia)}
                        </p>
                      </div>
                    ))}

                    {(empresasRisco.baixaRecorrencia || []).length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nenhuma empresa em risco identificada na visão atual.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-orange/10">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-xl font-bold text-text-dark">
                      Ranking de empresas por receita
                    </h2>

                    <button
                      type="button"
                      onClick={() => abrirDetalhe('empresas')}
                      className="text-sm text-orange font-semibold"
                    >
                      Ver detalhe
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="py-3 pr-4">Empresa</th>
                          <th className="py-3 pr-4">Receita</th>
                          <th className="py-3 pr-4">Pedidos</th>
                          <th className="py-3 pr-4">Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {dashboard.rankingEmpresas?.slice(0, 8).map((empresa, index) => (
                          <tr key={index} className="border-b last:border-b-0">
                            <td className="py-3 pr-4 font-medium">
                              {empresa.empresa}
                            </td>

                            <td className="py-3 pr-4">
                              {formatarMoeda(empresa.receita)}
                            </td>

                            <td className="py-3 pr-4">
                              {formatarNumero(empresa.pedidos)}
                            </td>

                            <td className="py-3 pr-4">
                              <StatusBadge status={empresa.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 border border-orange/10">
                  <h2 className="text-xl font-bold text-text-dark mb-4">
                    Alertas estratégicos
                  </h2>

                  {dashboard.alertas?.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Nenhum alerta crítico identificado no momento.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {dashboard.alertas?.map((alerta, index) => (
                        <div
                          key={index}
                          className={`border rounded-xl p-4 ${
                            alerta.prioridade === 'alta'
                              ? 'border-red-100 bg-red-50'
                              : 'border-orange/10 bg-orange/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-text-dark">
                                {alerta.empresa}
                              </p>

                              <p className="text-sm text-gray-600 mt-1">
                                {alerta.mensagem}
                              </p>

                              {alerta.acaoSugerida && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Ação sugerida: {alerta.acaoSugerida}
                                </p>
                              )}

                              <p className="text-xs text-orange mt-3 font-semibold">
                                {alerta.tipo}
                              </p>
                            </div>

                            <span className="text-xs font-bold text-red-700">
                              {alerta.prioridade}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {!loading && !erro && !isPainelCannoli && (
            <section className="bg-white rounded-2xl shadow-sm p-8 border border-orange/10">
              <h2 className="text-xl font-bold text-text-dark">
                Dashboard da empresa
              </h2>

              <p className="text-sm text-gray-500 mt-3 max-w-2xl">
                O painel da empresa será configurado na próxima etapa, filtrando os dados somente para a empresa logada.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;