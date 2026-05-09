import React, { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, X } from 'lucide-react';
import Sidebar from '../dashboard/Sidebar';
import { buscarAdminDashboard } from './services/adminDashboardService';
import FiltrosDashboard from './shared/FiltrosDashboard';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const INTERVALO_ATUALIZACAO = 60 * 60 * 1000;

const FILTROS_PADRAO = {
  periodo: 'todos',
  empresa: 'todas',
  canal: 'todos',
  tipoPedido: 'todos'
};

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

const coresGraficos = ['#f26322', '#ff8a4c', '#ffb088', '#ffd2bd', '#f7a072', '#d9480f'];

const TooltipGrafico = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-orange/10 p-3 max-w-[260px]">
      {label && (
        <p className="text-sm font-bold text-text-dark mb-2 break-words">
          {label}
        </p>
      )}

      {payload.map((item, index) => {
        const key = String(item.dataKey || '').toLowerCase();
        const valor = item.value;

        const valorFormatado =
          key.includes('receita') ||
          key.includes('faturamento') ||
          key.includes('ticket')
            ? formatarMoeda(valor)
            : key.includes('taxa') ||
                key.includes('conversao') ||
                key.includes('recorrencia')
              ? formatarPercentual(valor)
              : formatarNumero(valor);

        return (
          <p key={index} className="text-xs text-gray-600 break-words">
            <strong>{item.name || item.dataKey}:</strong> {valorFormatado}
          </p>
        );
      })}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
        status === 'saudavel'
          ? 'bg-green-100 text-green-700'
          : status === 'atencao'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
      }`}
    >
      {status || 'sem status'}
    </span>
  );
};

const CardResumo = ({ titulo, valor, descricao, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm min-w-0 text-left w-full hover:shadow-md hover:-translate-y-[1px] transition-all"
    >
      <p className="text-sm text-gray-500 break-words">{titulo}</p>

      <h2 className="text-2xl sm:text-3xl font-bold mt-2 text-text-dark break-words">
        {valor}
      </h2>

      {descricao && (
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          {descricao}
        </p>
      )}

      <p className="text-xs text-orange font-semibold mt-3">
        Clique para detalhar
      </p>
    </button>
  );
};

const renderizarValorTabela = (key, valor) => {
  const chave = String(key || '').toLowerCase();

  if (chave.includes('receita')) return formatarMoeda(valor);
  if (chave.includes('faturamento')) return formatarMoeda(valor);
  if (chave.includes('ticket')) return formatarMoeda(valor);
  if (chave.includes('recorrencia')) return formatarPercentual(valor);
  if (chave.includes('conversao')) return formatarPercentual(valor);
  if (chave.includes('taxa')) return formatarPercentual(valor);
  if (chave.includes('pedidos')) return formatarNumero(valor);
  if (chave.includes('clientes')) return formatarNumero(valor);
  if (chave.includes('mensagens')) return formatarNumero(valor);
  if (chave.includes('campanhas')) return formatarNumero(valor);

  return valor ?? '-';
};

const exportarCsv = ({ nomeArquivo, colunas, dados }) => {
  if (!dados || dados.length === 0) return;

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
  if (!dados || dados.length === 0) return;

  const documento = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4'
  });

  const dataAtual = new Date().toLocaleString('pt-BR');

  documento.setFontSize(16);
  documento.text(titulo || 'Detalhamento', 40, 40);

  documento.setFontSize(9);
  documento.text(descricao || 'Tabela de apoio exportada do painel.', 40, 58);

  documento.setFontSize(8);
  documento.text(`Exportado em: ${dataAtual}`, 40, 74);

  const head = [colunas.map((coluna) => coluna.label)];

  const body = dados.map((item) => {
    return colunas.map((coluna) => renderizarValorTabela(coluna.key, item[coluna.key]));
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

const CardGrafico = ({ titulo, descricao, children }) => {
  return (
    <section className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm min-w-0">
      <div className="mb-5">
        <h2 className="text-lg sm:text-xl font-bold text-text-dark leading-snug">
          {titulo}
        </h2>

        {descricao && (
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            {descricao}
          </p>
        )}
      </div>

      <div className="h-[300px] sm:h-80 w-full min-w-0">
        {children}
      </div>
    </section>
  );
};

const Empresas = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizando, setAtualizando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_PADRAO);
  const [detalheAtivo, setDetalheAtivo] = useState(null);

  const fontePoppins = {
    fontFamily: "'Poppins', sans-serif"
  };

  const filtrosRef = useRef(FILTROS_PADRAO);

  useEffect(() => {
    filtrosRef.current = filtros;
  }, [filtros]);

  const carregarDados = async ({
    silencioso = false,
    filtrosAplicados = filtrosRef.current
  } = {}) => {
    try {
      if (silencioso) {
        setAtualizando(true);
      } else {
        setLoading(true);
      }

      setErro('');

      const data = await buscarAdminDashboard(filtrosAplicados);
      setDashboard(data);
      setUltimaAtualizacao(new Date());
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
      setAtualizando(false);
    }
  };

  const aplicarFiltros = () => {
    setDetalheAtivo(null);
    filtrosRef.current = filtros;
    carregarDados({ filtrosAplicados: filtros });
  };

  const limparFiltros = () => {
    setDetalheAtivo(null);
    const filtrosLimpos = { ...FILTROS_PADRAO };

    setFiltros(filtrosLimpos);
    filtrosRef.current = filtrosLimpos;
    carregarDados({ filtrosAplicados: filtrosLimpos });
  };

  useEffect(() => {
    carregarDados();

    const intervalo = setInterval(() => {
      carregarDados({
        silencioso: true,
        filtrosAplicados: filtrosRef.current
      });
    }, INTERVALO_ATUALIZACAO);

    return () => clearInterval(intervalo);
  }, []);

  const empresas = dashboard?.empresas || {};
  const risco = empresas.empresasRisco || {};
  const ranking = empresas.rankingReceita || [];

  const indicadoresObrigatorios = dashboard?.indicadoresObrigatorios || {};
  const indicadoresPorEmpresa = indicadoresObrigatorios.porEmpresa || [];

  const totalMensagens = indicadoresPorEmpresa.reduce(
    (acc, item) => acc + Number(item.mensagens || 0),
    0
  );

  const totalPedidosConvertidos = indicadoresPorEmpresa.reduce(
    (acc, item) => acc + Number(item.pedidosConvertidos || 0),
    0
  );

  const totalReceitaCampanhas = indicadoresPorEmpresa.reduce(
    (acc, item) => acc + Number(item.receitaCampanhas || 0),
    0
  );

  const totalFaturamento = indicadoresPorEmpresa.reduce(
    (acc, item) => acc + Number(item.faturamentoTotal || 0),
    0
  );

  const conversaoNumeroMedia =
    totalMensagens > 0
      ? (totalPedidosConvertidos / totalMensagens) * 100
      : 0;

  const conversaoValorMedia =
    totalFaturamento > 0
      ? (totalReceitaCampanhas / totalFaturamento) * 100
      : 0;

  const topEmpresasReceita = useMemo(() => {
    return [...ranking]
      .sort((a, b) => Number(b.receita || 0) - Number(a.receita || 0))
      .slice(0, 10);
  }, [ranking]);

  const topIndicadoresCampanhas = useMemo(() => {
    return [...indicadoresPorEmpresa]
      .sort((a, b) => Number(b.receitaCampanhas || 0) - Number(a.receitaCampanhas || 0))
      .slice(0, 10);
  }, [indicadoresPorEmpresa]);

  const dadosConversaoVendas = useMemo(() => {
    return [...indicadoresPorEmpresa]
      .sort((a, b) => Number(b.taxaConversaoNumero || 0) - Number(a.taxaConversaoNumero || 0))
      .slice(0, 10);
  }, [indicadoresPorEmpresa]);

  const dadosRisco = useMemo(() => {
    return [
      {
        nome: 'Baixa recorrência',
        valor: Number(risco.baixaRecorrencia?.length || 0)
      },
      {
        nome: 'Ticket baixo',
        valor: Number(risco.ticketBaixo?.length || 0)
      },
      {
        nome: 'Melhores desempenhos',
        valor: Number(empresas.melhoresDesempenhos?.length || 0)
      }
    ].filter((item) => item.valor > 0);
  }, [risco, empresas.melhoresDesempenhos]);


  const detalhes = useMemo(() => {
    return {
      totalEmpresas: {
        titulo: 'Detalhamento das empresas cadastradas',
        descricao: 'Ranking operacional das empresas da base atual.',
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
        dados: ranking
      },
      melhoresDesempenhos: {
        titulo: 'Detalhamento dos melhores desempenhos',
        descricao: 'Empresas classificadas com melhor performance operacional.',
        nomeArquivo: 'detalhamento_melhores_desempenhos.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'receita', label: 'Receita' },
          { key: 'pedidos', label: 'Pedidos' },
          { key: 'clientes', label: 'Clientes' },
          { key: 'ticketMedio', label: 'Ticket médio' },
          { key: 'recorrencia', label: 'Recorrência' },
          { key: 'status', label: 'Status' }
        ],
        dados: empresas.melhoresDesempenhos || []
      },
      baixaRecorrencia: {
        titulo: 'Detalhamento de empresas com baixa recorrência',
        descricao: 'Empresas em risco por baixa recompra dos clientes.',
        nomeArquivo: 'detalhamento_baixa_recorrencia.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'recorrencia', label: 'Recorrência' },
          { key: 'receita', label: 'Receita' },
          { key: 'pedidos', label: 'Pedidos' },
          { key: 'ticketMedio', label: 'Ticket médio' }
        ],
        dados: risco.baixaRecorrencia || []
      },
      ticketBaixo: {
        titulo: 'Detalhamento de empresas com ticket baixo',
        descricao: 'Empresas com ticket médio baixo na visão atual.',
        nomeArquivo: 'detalhamento_ticket_baixo.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'ticketMedio', label: 'Ticket médio' },
          { key: 'receita', label: 'Receita' },
          { key: 'pedidos', label: 'Pedidos' },
          { key: 'clientes', label: 'Clientes' }
        ],
        dados: risco.ticketBaixo || []
      },
      mensagens: {
        titulo: 'Detalhamento de mensagens enviadas',
        descricao: 'Mensagens associadas a campanhas por empresa.',
        nomeArquivo: 'detalhamento_mensagens_empresas.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'mensagens', label: 'Mensagens' },
          { key: 'campanhas', label: 'Campanhas' },
          { key: 'pedidosConvertidos', label: 'Pedidos convertidos' },
          { key: 'receitaCampanhas', label: 'Receita campanhas' }
        ],
        dados: indicadoresPorEmpresa
      },
      pedidosConvertidos: {
        titulo: 'Detalhamento de pedidos convertidos',
        descricao: 'Pedidos gerados a partir das campanhas por empresa.',
        nomeArquivo: 'detalhamento_pedidos_convertidos_empresas.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'pedidosConvertidos', label: 'Pedidos convertidos' },
          { key: 'mensagens', label: 'Mensagens' },
          { key: 'taxaConversaoNumero', label: 'Conversão vendas' },
          { key: 'receitaCampanhas', label: 'Receita campanhas' }
        ],
        dados: indicadoresPorEmpresa
      },
      conversaoVendas: {
        titulo: 'Detalhamento da conversão em vendas',
        descricao: 'Pedidos convertidos divididos pelo total de mensagens enviadas.',
        nomeArquivo: 'detalhamento_conversao_vendas_empresas.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'taxaConversaoNumero', label: 'Conversão vendas' },
          { key: 'mensagens', label: 'Mensagens' },
          { key: 'pedidosConvertidos', label: 'Pedidos convertidos' },
          { key: 'receitaCampanhas', label: 'Receita campanhas' }
        ],
        dados: indicadoresPorEmpresa
      },
      conversaoValor: {
        titulo: 'Detalhamento da conversão em valor',
        descricao: 'Receita de campanhas dividida pelo faturamento total.',
        nomeArquivo: 'detalhamento_conversao_valor_empresas.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'taxaConversaoValor', label: 'Conversão valor' },
          { key: 'receitaCampanhas', label: 'Receita campanhas' },
          { key: 'faturamentoTotal', label: 'Faturamento total' }
        ],
        dados: indicadoresPorEmpresa
      }
    };
  }, [ranking, empresas, risco, indicadoresPorEmpresa]);

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

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 w-full min-w-0 lg:ml-72">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 bg-orange p-2 rounded-lg shadow-lg"
          aria-label="Abrir menu"
        >
          <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>

        <main className="w-full max-w-[1600px] mx-auto p-4 sm:p-5 lg:p-8 pt-20 lg:pt-8">
          <header
            className="mb-8 flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4"
            style={fontePoppins}
          >
            <div className="min-w-0">
              <h1
                className="text-2xl sm:text-3xl font-bold text-text-dark leading-tight"
                style={fontePoppins}
              >
                Empresas
              </h1>

              <p
                className="text-sm text-gray-500 mt-2 max-w-3xl leading-relaxed"
                style={fontePoppins}
              >
                Visão administrativa das empresas cadastradas na plataforma Cannoli.
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className="px-3 py-1 rounded-full bg-orange/10 text-orange text-xs font-semibold"
                  style={fontePoppins}
                >
                  Atualização automática a cada 1 hora
                </span>

                {ultimaAtualizacao && (
                  <span
                    className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold"
                    style={fontePoppins}
                  >
                    Última atualização: {ultimaAtualizacao.toLocaleString('pt-BR')}
                  </span>
                )}

                {atualizando && (
                  <span
                    className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold"
                    style={fontePoppins}
                  >
                    Atualizando dados...
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                carregarDados({
                  silencioso: true,
                  filtrosAplicados: filtrosRef.current
                })
              }
              disabled={loading || atualizando}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-60"
              style={fontePoppins}
            >
              Atualizar agora
            </button>
          </header>

          {loading && (
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-orange/10">
              Carregando empresas...
            </section>
          )}

          {erro && (
            <section className="bg-red-100 rounded-2xl p-5 sm:p-6 border border-red-300 text-red-700">
              {erro}
            </section>
          )}

          {!loading && !erro && dashboard && (
            <>
              <FiltrosDashboard
                filtros={filtros}
                setFiltros={setFiltros}
                opcoes={dashboard?.filtros || {}}
                onAplicar={aplicarFiltros}
                onLimpar={limparFiltros}
                loading={loading || atualizando}
                titulo="Filtros da aba"
                descricao="Use estes filtros para recalcular os dados exibidos nesta visão."
              />

              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
                <CardResumo
                  titulo="Total de empresas"
                  valor={formatarNumero(empresas.total)}
                  descricao="Empresas cadastradas na base"
                  onClick={() => abrirDetalhe('totalEmpresas')}
                />

                <CardResumo
                  titulo="Melhores desempenhos"
                  valor={formatarNumero(empresas.melhoresDesempenhos?.length || 0)}
                  descricao="Empresas com maior performance"
                  onClick={() => abrirDetalhe('melhoresDesempenhos')}
                />

                <CardResumo
                  titulo="Baixa recorrência"
                  valor={formatarNumero(risco.baixaRecorrencia?.length || 0)}
                  descricao="Empresas em risco de recorrência"
                  onClick={() => abrirDetalhe('baixaRecorrencia')}
                />

                <CardResumo
                  titulo="Ticket baixo"
                  valor={formatarNumero(risco.ticketBaixo?.length || 0)}
                  descricao="Empresas com ticket médio baixo"
                  onClick={() => abrirDetalhe('ticketBaixo')}
                />
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
                <CardResumo
                  titulo="Mensagens enviadas"
                  valor={formatarNumero(totalMensagens)}
                  descricao="Total de mensagens associadas a campanhas"
                  onClick={() => abrirDetalhe('mensagens')}
                />

                <CardResumo
                  titulo="Pedidos convertidos"
                  valor={formatarNumero(totalPedidosConvertidos)}
                  descricao="Pedidos gerados a partir de campanhas"
                  onClick={() => abrirDetalhe('pedidosConvertidos')}
                />

                <CardResumo
                  titulo="Conversão em vendas"
                  valor={formatarPercentual(conversaoNumeroMedia)}
                  descricao="Pedidos convertidos / mensagens"
                  onClick={() => abrirDetalhe('conversaoVendas')}
                />

                <CardResumo
                  titulo="Conversão em valor"
                  valor={formatarPercentual(conversaoValorMedia)}
                  descricao="Receita de campanhas / faturamento"
                  onClick={() => abrirDetalhe('conversaoValor')}
                />
              </section>

              {detalheSelecionado && (
                <section
                  id="detalhamento-kpi"
                  className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 mb-6 border border-orange/10"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-text-dark">
                        {detalheSelecionado.titulo}
                      </h2>

                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
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
                        className="px-4 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
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
                        className="px-4 py-3 rounded-xl bg-white border border-orange/20 text-orange font-semibold hover:bg-orange/5 transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <FileText size={18} />
                        Exportar PDF
                      </button>

                      <button
                        type="button"
                        onClick={() => setDetalheAtivo(null)}
                        className="px-4 py-3 rounded-xl bg-orange/10 text-orange font-semibold hover:bg-orange/15 transition flex items-center justify-center gap-2"
                      >
                        <X size={18} />
                        Fechar
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                    <table className="w-full min-w-[850px] text-sm">
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
                      Mostrando os primeiros 30 registros. A exportação CSV/PDF inclui todos os registros disponíveis.
                    </p>
                  )}
                </section>
              )}

              <section className="grid grid-cols-1 2xl:grid-cols-2 gap-5 sm:gap-6 mb-6">
                <CardGrafico
                  titulo="Top empresas por receita"
                  descricao="Ranking das empresas com maior faturamento na base atual."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topEmpresasReceita}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="empresa"
                        width={120}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip content={<TooltipGrafico />} />
                      <Bar
                        dataKey="receita"
                        name="Receita"
                        fill="#f26322"
                        radius={[0, 10, 10, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardGrafico>

                <CardGrafico
                  titulo="Conversão em vendas por empresa"
                  descricao="Pedidos convertidos divididos pelo total de mensagens enviadas."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dadosConversaoVendas}
                      margin={{ top: 5, right: 20, left: 0, bottom: 55 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis
                        dataKey="empresa"
                        tick={{ fontSize: 9 }}
                        angle={-30}
                        textAnchor="end"
                        height={80}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<TooltipGrafico />} />
                      <Bar
                        dataKey="taxaConversaoNumero"
                        name="Conversão em vendas"
                        fill="#f26322"
                        radius={[10, 10, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardGrafico>
              </section>

              <section className="grid grid-cols-1 2xl:grid-cols-3 gap-5 sm:gap-6 mb-6">
                <div className="2xl:col-span-2 min-w-0">
                  <CardGrafico
                    titulo="Faturamento x receita de campanhas"
                    descricao="Comparação entre faturamento total e receita gerada por campanhas."
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topIndicadoresCampanhas}
                        margin={{ top: 5, right: 20, left: 0, bottom: 55 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis
                          dataKey="empresa"
                          tick={{ fontSize: 9 }}
                          angle={-30}
                          textAnchor="end"
                          height={80}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip content={<TooltipGrafico />} />
                        <Bar
                          dataKey="faturamentoTotal"
                          name="Faturamento"
                          fill="#ffb088"
                          radius={[10, 10, 0, 0]}
                        />
                        <Bar
                          dataKey="receitaCampanhas"
                          name="Receita campanhas"
                          fill="#f26322"
                          radius={[10, 10, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardGrafico>
                </div>

                <CardGrafico
                  titulo="Distribuição de status"
                  descricao="Resumo visual de riscos e melhores desempenhos."
                >
                  {dadosRisco.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosRisco}
                          dataKey="valor"
                          nameKey="nome"
                          innerRadius={50}
                          outerRadius={95}
                          paddingAngle={3}
                        >
                          {dadosRisco.map((item, index) => (
                            <Cell key={item.nome} fill={coresGraficos[index % coresGraficos.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<TooltipGrafico />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500 text-center px-4">
                      Nenhum dado de risco encontrado.
                    </div>
                  )}
                </CardGrafico>
              </section>

              <section className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">
                      Indicadores obrigatórios por empresa
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Conversão em número de vendas, conversão em valor, mensagens e faturamento por empresa.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                  <table className="w-full min-w-[1100px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-3 pr-4">Empresa</th>
                        <th className="py-3 pr-4">Faturamento</th>
                        <th className="py-3 pr-4">Pedidos totais</th>
                        <th className="py-3 pr-4">Ticket médio</th>
                        <th className="py-3 pr-4">Mensagens</th>
                        <th className="py-3 pr-4">Campanhas</th>
                        <th className="py-3 pr-4">Pedidos convertidos</th>
                        <th className="py-3 pr-4">Receita campanhas</th>
                        <th className="py-3 pr-4">Conversão vendas</th>
                        <th className="py-3 pr-4">Conversão valor</th>
                      </tr>
                    </thead>

                    <tbody>
                      {indicadoresPorEmpresa.map((empresa, index) => (
                        <tr key={`${empresa.storeid}-${index}`} className="border-b last:border-b-0">
                          <td className="py-3 pr-4 font-medium">
                            {empresa.empresa}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarMoeda(empresa.faturamentoTotal)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarNumero(empresa.pedidosTotais)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarMoeda(empresa.ticketMedio)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarNumero(empresa.mensagens)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarNumero(empresa.campanhas)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarNumero(empresa.pedidosConvertidos)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarMoeda(empresa.receitaCampanhas)}
                          </td>

                          <td className="py-3 pr-4 font-semibold text-orange">
                            {formatarPercentual(empresa.taxaConversaoNumero)}
                          </td>

                          <td className="py-3 pr-4 font-semibold text-orange">
                            {formatarPercentual(empresa.taxaConversaoValor)}
                          </td>
                        </tr>
                      ))}

                      {indicadoresPorEmpresa.length === 0 && (
                        <tr>
                          <td colSpan="10" className="py-6 text-center text-gray-500">
                            Nenhum indicador obrigatório encontrado para a visão atual.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm mb-6">
                <h2 className="text-lg sm:text-xl font-bold mb-4">
                  Ranking de empresas por receita
                </h2>

                <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-3 pr-4">Empresa</th>
                        <th className="py-3 pr-4">Receita</th>
                        <th className="py-3 pr-4">Pedidos</th>
                        <th className="py-3 pr-4">Clientes</th>
                        <th className="py-3 pr-4">Ticket médio</th>
                        <th className="py-3 pr-4">Recorrência</th>
                        <th className="py-3 pr-4">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {ranking.map((empresa, index) => (
                        <tr key={`${empresa.storeid}-${index}`} className="border-b last:border-b-0">
                          <td className="py-3 pr-4 font-medium">{empresa.empresa}</td>
                          <td className="py-3 pr-4">{formatarMoeda(empresa.receita)}</td>
                          <td className="py-3 pr-4">{formatarNumero(empresa.pedidos)}</td>
                          <td className="py-3 pr-4">{formatarNumero(empresa.clientes)}</td>
                          <td className="py-3 pr-4">{formatarMoeda(empresa.ticketMedio)}</td>
                          <td className="py-3 pr-4">{formatarPercentual(empresa.recorrencia)}</td>
                          <td className="py-3 pr-4">
                            <StatusBadge status={empresa.status} />
                          </td>
                        </tr>
                      ))}

                      {ranking.length === 0 && (
                        <tr>
                          <td colSpan="7" className="py-6 text-center text-gray-500">
                            Nenhuma empresa encontrada para a visão atual.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-lg sm:text-xl font-bold mb-4">
                    Empresas com baixa recorrência
                  </h2>

                  <div className="space-y-3">
                    {(risco.baixaRecorrencia || []).map((empresa, index) => (
                      <div key={index} className="rounded-xl bg-red-50 border border-red-100 p-4">
                        <p className="font-bold break-words">{empresa.empresa}</p>
                        <p className="text-sm text-red-700 mt-1">
                          Recorrência: {formatarPercentual(empresa.recorrencia)}
                        </p>
                      </div>
                    ))}

                    {(risco.baixaRecorrencia || []).length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nenhuma empresa com baixa recorrência identificada.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-lg sm:text-xl font-bold mb-4">
                    Empresas com ticket baixo
                  </h2>

                  <div className="space-y-3">
                    {(risco.ticketBaixo || []).map((empresa, index) => (
                      <div key={index} className="rounded-xl bg-yellow-50 border border-yellow-100 p-4">
                        <p className="font-bold break-words">{empresa.empresa}</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Ticket médio: {formatarMoeda(empresa.ticketMedio)}
                        </p>
                      </div>
                    ))}

                    {(risco.ticketBaixo || []).length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nenhuma empresa com ticket baixo identificada.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Empresas;