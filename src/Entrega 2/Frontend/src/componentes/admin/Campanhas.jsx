import React, { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, X } from 'lucide-react';
import Sidebar from '../dashboard/Sidebar';
import FiltrosDashboard from './shared/FiltrosDashboard';
import {
  buscarAdminDashboard,
  buscarCompanyDashboard
} from './services/adminDashboardService';

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

const renderizarValorTabela = (key, valor) => {
  const chave = String(key || '').toLowerCase();

  if (chave.includes('receita')) return formatarMoeda(valor);
  if (chave.includes('valor')) return formatarMoeda(valor);
  if (chave.includes('faturamento')) return formatarMoeda(valor);
  if (chave.includes('ticket')) return formatarMoeda(valor);

  if (chave.includes('conversao')) return formatarPercentual(valor);
  if (chave.includes('taxa')) return formatarPercentual(valor);
  if (chave.includes('percentual')) return formatarPercentual(valor);

  if (chave.includes('pedidos')) return formatarNumero(valor);
  if (chave.includes('clientes')) return formatarNumero(valor);
  if (chave.includes('mensagens')) return formatarNumero(valor);
  if (chave.includes('campanhas')) return formatarNumero(valor);
  if (chave.includes('usos')) return formatarNumero(valor);

  return valor ?? '-';
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
  documento.text(titulo || 'Detalhamento de campanhas', 40, 40);

  documento.setFontSize(9);
  documento.text(descricao || 'Tabela de apoio exportada da aba Campanhas.', 40, 58);

  documento.setFontSize(8);
  documento.text(`Exportado em: ${dataAtual}`, 40, 74);

  autoTable(documento, {
    head: [colunas.map((coluna) => coluna.label)],
    body: dados.map((item) => {
      return colunas.map((coluna) => renderizarValorTabela(coluna.key, item[coluna.key]));
    }),
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

  documento.save((nomeArquivo || 'detalhamento_campanhas.csv').replace('.csv', '.pdf'));
};

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
          key.includes('receita')
            ? formatarMoeda(valor)
            : key.includes('conversao') || key.includes('taxa')
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

const CardResumo = ({ titulo, valor, descricao, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm min-w-0 text-left w-full hover:shadow-md hover:-translate-y-[1px] transition-all"
    >
      <p className="text-sm text-gray-500 break-words">
        {titulo}
      </p>

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

const Campanhas = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizando, setAtualizando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_PADRAO);
  const [detalheAtivo, setDetalheAtivo] = useState(null);

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const isEmpresa = usuario.role === 'empresa';

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

      const data = isEmpresa
        ? await buscarCompanyDashboard(filtrosAplicados)
        : await buscarAdminDashboard(filtrosAplicados);

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

  const campanhas = dashboard?.campanhas || {};
  const melhoresCampanhas = campanhas.melhoresCampanhas || [];
  const baixaConversao = campanhas.campanhasBaixaConversao || [];
  const templates = campanhas.templatesMaisUsados || [];

  const indicadoresObrigatorios = dashboard?.indicadoresObrigatorios || {};
  const mensagensPorCampanhaEmpresa = indicadoresObrigatorios.mensagensPorCampanhaEmpresa || [];

  const totalMensagensPorCampanhaEmpresa = mensagensPorCampanhaEmpresa.reduce(
    (acc, item) => acc + Number(item.mensagens || 0),
    0
  );

  const totalPedidosConvertidosPorCampanhaEmpresa = mensagensPorCampanhaEmpresa.reduce(
    (acc, item) => acc + Number(item.pedidosConvertidos || 0),
    0
  );

  const totalReceitaCampanhaEmpresa = mensagensPorCampanhaEmpresa.reduce(
    (acc, item) => acc + Number(item.receita || 0),
    0
  );

  const conversaoObrigatoria =
    totalMensagensPorCampanhaEmpresa > 0
      ? (totalPedidosConvertidosPorCampanhaEmpresa / totalMensagensPorCampanhaEmpresa) * 100
      : 0;

  const topCampanhasReceita = useMemo(() => {
    return [...melhoresCampanhas]
      .sort((a, b) => Number(b.receita || 0) - Number(a.receita || 0))
      .slice(0, 10);
  }, [melhoresCampanhas]);

  const topCampanhasConversao = useMemo(() => {
    return [...melhoresCampanhas]
      .sort((a, b) => Number(b.conversao || 0) - Number(a.conversao || 0))
      .slice(0, 10);
  }, [melhoresCampanhas]);

  const topCampanhaEmpresaReceita = useMemo(() => {
    return [...mensagensPorCampanhaEmpresa]
      .sort((a, b) => Number(b.receita || 0) - Number(a.receita || 0))
      .slice(0, 10);
  }, [mensagensPorCampanhaEmpresa]);

  const topCampanhaEmpresaConversao = useMemo(() => {
    return [...mensagensPorCampanhaEmpresa]
      .sort((a, b) => Number(b.taxaConversao || 0) - Number(a.taxaConversao || 0))
      .slice(0, 10);
  }, [mensagensPorCampanhaEmpresa]);

  const dadosTemplates = useMemo(() => {
    return [...templates]
      .sort((a, b) => Number(b.usos || 0) - Number(a.usos || 0))
      .slice(0, 8);
  }, [templates]);

  const detalhes = useMemo(() => {
    return {
      totalCampanhas: {
        titulo: 'Detalhamento das campanhas',
        descricao: 'Campanhas cadastradas/processadas na visão atual.',
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
        titulo: 'Detalhamento da receita por campanhas',
        descricao: 'Receita vinculada às campanhas por campanha e empresa.',
        nomeArquivo: 'detalhamento_receita_campanhas.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'campanha', label: 'Campanha' },
          { key: 'receita', label: 'Receita' },
          { key: 'mensagens', label: 'Mensagens' },
          { key: 'pedidosConvertidos', label: 'Pedidos convertidos' },
          { key: 'clientes', label: 'Clientes' },
          { key: 'taxaConversao', label: 'Conversão' }
        ],
        dados: mensagensPorCampanhaEmpresa
      },
      pedidosGerados: {
        titulo: 'Detalhamento dos pedidos gerados',
        descricao: 'Pedidos associados às campanhas.',
        nomeArquivo: 'detalhamento_pedidos_gerados_campanhas.csv',
        colunas: [
          { key: 'campanha', label: 'Campanha' },
          { key: 'pedidos', label: 'Pedidos' },
          { key: 'receita', label: 'Receita' },
          { key: 'mensagens', label: 'Mensagens' },
          { key: 'clientes', label: 'Clientes' },
          { key: 'conversao', label: 'Conversão' }
        ],
        dados: melhoresCampanhas
      },
      conversaoMedia: {
        titulo: 'Detalhamento da conversão média',
        descricao: 'Conversão das campanhas por mensagens enviadas.',
        nomeArquivo: 'detalhamento_conversao_campanhas.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'campanha', label: 'Campanha' },
          { key: 'taxaConversao', label: 'Conversão' },
          { key: 'mensagens', label: 'Mensagens' },
          { key: 'pedidosConvertidos', label: 'Pedidos convertidos' },
          { key: 'clientes', label: 'Clientes' },
          { key: 'receita', label: 'Receita' }
        ],
        dados: mensagensPorCampanhaEmpresa
      },
      mensagensCampanhaEmpresa: {
        titulo: 'Detalhamento de mensagens por campanha e empresa',
        descricao: 'Indicador obrigatório: mensagens por campanha e empresa.',
        nomeArquivo: 'detalhamento_mensagens_campanha_empresa.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'campanha', label: 'Campanha' },
          { key: 'mensagens', label: 'Mensagens' },
          { key: 'pedidosConvertidos', label: 'Pedidos convertidos' },
          { key: 'clientes', label: 'Clientes' },
          { key: 'receita', label: 'Receita' },
          { key: 'taxaConversao', label: 'Conversão' }
        ],
        dados: mensagensPorCampanhaEmpresa
      },
      pedidosConvertidos: {
        titulo: 'Detalhamento dos pedidos convertidos',
        descricao: 'Pedidos convertidos por campanha e empresa.',
        nomeArquivo: 'detalhamento_pedidos_convertidos.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'campanha', label: 'Campanha' },
          { key: 'pedidosConvertidos', label: 'Pedidos convertidos' },
          { key: 'mensagens', label: 'Mensagens' },
          { key: 'taxaConversao', label: 'Conversão' },
          { key: 'receita', label: 'Receita' }
        ],
        dados: mensagensPorCampanhaEmpresa
      },
      receitaConvertida: {
        titulo: 'Detalhamento da receita convertida',
        descricao: 'Receita das campanhas por empresa e campanha.',
        nomeArquivo: 'detalhamento_receita_convertida.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'campanha', label: 'Campanha' },
          { key: 'receita', label: 'Receita' },
          { key: 'pedidosConvertidos', label: 'Pedidos convertidos' },
          { key: 'mensagens', label: 'Mensagens' },
          { key: 'taxaConversao', label: 'Conversão' }
        ],
        dados: mensagensPorCampanhaEmpresa
      },
      conversaoObrigatoria: {
        titulo: 'Detalhamento da conversão obrigatória',
        descricao: 'Pedidos convertidos divididos por mensagens.',
        nomeArquivo: 'detalhamento_conversao_obrigatoria.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'campanha', label: 'Campanha' },
          { key: 'taxaConversao', label: 'Conversão' },
          { key: 'pedidosConvertidos', label: 'Pedidos convertidos' },
          { key: 'mensagens', label: 'Mensagens' },
          { key: 'receita', label: 'Receita' }
        ],
        dados: mensagensPorCampanhaEmpresa
      },
      baixaConversao: {
        titulo: 'Detalhamento de campanhas com baixa conversão',
        descricao: 'Campanhas com baixa eficiência de conversão.',
        nomeArquivo: 'detalhamento_baixa_conversao.csv',
        colunas: [
          { key: 'campanha', label: 'Campanha' },
          { key: 'conversao', label: 'Conversão' },
          { key: 'mensagens', label: 'Mensagens' },
          { key: 'pedidos', label: 'Pedidos' },
          { key: 'receita', label: 'Receita' }
        ],
        dados: baixaConversao
      },
      templates: {
        titulo: 'Detalhamento dos templates mais usados',
        descricao: 'Templates ordenados por quantidade de usos.',
        nomeArquivo: 'detalhamento_templates.csv',
        colunas: [
          { key: 'template', label: 'Template' },
          { key: 'usos', label: 'Usos' }
        ],
        dados: templates
      }
    };
  }, [melhoresCampanhas, mensagensPorCampanhaEmpresa, baixaConversao, templates]);

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
                Campanhas
              </h1>

              <p
                className="text-sm text-gray-500 mt-2 max-w-3xl leading-relaxed"
                style={fontePoppins}
              >
                {isEmpresa
                  ? 'Performance das campanhas da sua empresa, pedidos gerados, conversão e templates utilizados.'
                  : 'Performance global das campanhas, pedidos gerados, conversão e templates utilizados.'}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className="px-3 py-1 rounded-full bg-orange/10 text-orange text-xs font-semibold"
                  style={fontePoppins}
                >
                  Atualização automática a cada 1 hora
                </span>

                {isEmpresa && (
                  <span
                    className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold"
                    style={fontePoppins}
                  >
                    Visão filtrada pela empresa logada
                  </span>
                )}

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
              Carregando campanhas...
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
                esconderEmpresa={isEmpresa}
                titulo={isEmpresa ? 'Filtros da empresa' : 'Filtros da aba'}
                descricao={
                  isEmpresa
                    ? 'Use estes filtros para recalcular apenas os dados da sua empresa.'
                    : 'Use estes filtros para recalcular os dados exibidos em campanhas.'
                }
              />

              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
                <CardResumo
                  titulo="Total de campanhas"
                  valor={formatarNumero(campanhas.totalCampanhas)}
                  descricao="Campanhas cadastradas/processadas"
                  onClick={() => abrirDetalhe('totalCampanhas')}
                />

                <CardResumo
                  titulo="Receita por campanhas"
                  valor={formatarMoeda(campanhas.receitaCampanhas)}
                  descricao="Receita vinculada às campanhas"
                  onClick={() => abrirDetalhe('receitaCampanhas')}
                />

                <CardResumo
                  titulo="Pedidos gerados"
                  valor={formatarNumero(campanhas.pedidosGerados)}
                  descricao="Pedidos associados às campanhas"
                  onClick={() => abrirDetalhe('pedidosGerados')}
                />

                <CardResumo
                  titulo="Conversão média"
                  valor={formatarPercentual(campanhas.conversaoMedia)}
                  descricao="Pedidos / mensagens"
                  onClick={() => abrirDetalhe('conversaoMedia')}
                />
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
                <CardResumo
                  titulo="Mensagens por campanha/empresa"
                  valor={formatarNumero(totalMensagensPorCampanhaEmpresa)}
                  descricao="Total do indicador obrigatório"
                  onClick={() => abrirDetalhe('mensagensCampanhaEmpresa')}
                />

                <CardResumo
                  titulo="Pedidos convertidos"
                  valor={formatarNumero(totalPedidosConvertidosPorCampanhaEmpresa)}
                  descricao="Pedidos convertidos por campanha/empresa"
                  onClick={() => abrirDetalhe('pedidosConvertidos')}
                />

                <CardResumo
                  titulo="Receita convertida"
                  valor={formatarMoeda(totalReceitaCampanhaEmpresa)}
                  descricao="Receita das campanhas por empresa"
                  onClick={() => abrirDetalhe('receitaConvertida')}
                />

                <CardResumo
                  titulo="Conversão obrigatória"
                  valor={formatarPercentual(conversaoObrigatoria)}
                  descricao="Pedidos convertidos / mensagens"
                  onClick={() => abrirDetalhe('conversaoObrigatoria')}
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
                    <table className="w-full min-w-[900px] text-sm">
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
                                {renderizarValorTabela(coluna.key, item[coluna.key])}
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
                  titulo="Melhores campanhas por receita"
                  descricao="Ranking das campanhas com maior receita gerada."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCampanhasReceita}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="campanha"
                        width={125}
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
                  titulo="Conversão por campanha"
                  descricao="Campanhas com maior taxa de conversão."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCampanhasConversao}
                      margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis
                        dataKey="campanha"
                        tick={{ fontSize: 9 }}
                        angle={-30}
                        textAnchor="end"
                        height={85}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<TooltipGrafico />} />
                      <Bar
                        dataKey="conversao"
                        name="Conversão"
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
                    titulo="Receita por campanha e empresa"
                    descricao="Top combinações de campanha e empresa por receita convertida."
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topCampanhaEmpresaReceita}
                        margin={{ top: 5, right: 20, left: 0, bottom: 65 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis
                          dataKey="campanha"
                          tick={{ fontSize: 9 }}
                          angle={-30}
                          textAnchor="end"
                          height={90}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip content={<TooltipGrafico />} />
                        <Bar
                          dataKey="receita"
                          name="Receita"
                          fill="#f26322"
                          radius={[10, 10, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardGrafico>
                </div>

                <CardGrafico
                  titulo="Templates mais usados"
                  descricao="Distribuição dos templates com maior quantidade de usos."
                >
                  {dadosTemplates.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosTemplates}
                          dataKey="usos"
                          nameKey="template"
                          innerRadius={50}
                          outerRadius={95}
                          paddingAngle={3}
                        >
                          {dadosTemplates.map((item, index) => (
                            <Cell key={item.template} fill={coresGraficos[index % coresGraficos.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<TooltipGrafico />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500 text-center px-4">
                      Nenhum template identificado.
                    </div>
                  )}
                </CardGrafico>
              </section>

              <section className="grid grid-cols-1 2xl:grid-cols-2 gap-5 sm:gap-6 mb-6">
                <CardGrafico
                  titulo="Mensagens x pedidos convertidos"
                  descricao="Comparação por campanha/empresa para avaliar eficiência da comunicação."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCampanhaEmpresaConversao}
                      margin={{ top: 5, right: 20, left: 0, bottom: 65 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis
                        dataKey="campanha"
                        tick={{ fontSize: 9 }}
                        angle={-30}
                        textAnchor="end"
                        height={90}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<TooltipGrafico />} />
                      <Bar
                        dataKey="mensagens"
                        name="Mensagens"
                        fill="#ffb088"
                        radius={[10, 10, 0, 0]}
                      />
                      <Bar
                        dataKey="pedidosConvertidos"
                        name="Pedidos convertidos"
                        fill="#f26322"
                        radius={[10, 10, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardGrafico>

                <CardGrafico
                  titulo="Taxa de conversão por campanha/empresa"
                  descricao="Top combinações por taxa de conversão."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCampanhaEmpresaConversao}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="campanha"
                        width={125}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip content={<TooltipGrafico />} />
                      <Bar
                        dataKey="taxaConversao"
                        name="Conversão"
                        fill="#f26322"
                        radius={[0, 10, 10, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardGrafico>
              </section>

              <section className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">
                      Mensagens por campanha e empresa
                    </h2>

                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Indicador obrigatório: mensagens, pedidos convertidos, clientes, receita e taxa de conversão por campanha/empresa.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-3 pr-4">Empresa</th>
                        <th className="py-3 pr-4">Campanha</th>
                        <th className="py-3 pr-4">Mensagens</th>
                        <th className="py-3 pr-4">Pedidos convertidos</th>
                        <th className="py-3 pr-4">Clientes</th>
                        <th className="py-3 pr-4">Receita</th>
                        <th className="py-3 pr-4">Conversão</th>
                      </tr>
                    </thead>

                    <tbody>
                      {mensagensPorCampanhaEmpresa.map((item, index) => (
                        <tr key={`${item.storeid}-${item.campanha}-${index}`} className="border-b last:border-b-0">
                          <td className="py-3 pr-4 font-medium">
                            {item.empresa}
                          </td>

                          <td className="py-3 pr-4">
                            {item.campanha}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarNumero(item.mensagens)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarNumero(item.pedidosConvertidos)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarNumero(item.clientes)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarMoeda(item.receita)}
                          </td>

                          <td className="py-3 pr-4 font-semibold text-orange">
                            {formatarPercentual(item.taxaConversao)}
                          </td>
                        </tr>
                      ))}

                      {mensagensPorCampanhaEmpresa.length === 0 && (
                        <tr>
                          <td colSpan="7" className="py-6 text-center text-gray-500">
                            Nenhuma mensagem por campanha/empresa encontrada para a visão atual.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm mb-6">
                <h2 className="text-lg sm:text-xl font-bold mb-4">
                  Melhores campanhas por receita
                </h2>

                <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                  <table className="w-full min-w-[850px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-3 pr-4">Campanha</th>
                        <th className="py-3 pr-4">Receita</th>
                        <th className="py-3 pr-4">Pedidos</th>
                        <th className="py-3 pr-4">Mensagens</th>
                        <th className="py-3 pr-4">Clientes</th>
                        <th className="py-3 pr-4">Conversão</th>
                      </tr>
                    </thead>

                    <tbody>
                      {melhoresCampanhas.map((campanha, index) => (
                        <tr key={`${campanha.campanha}-${index}`} className="border-b last:border-b-0">
                          <td className="py-3 pr-4 font-medium">{campanha.campanha}</td>
                          <td className="py-3 pr-4">{formatarMoeda(campanha.receita)}</td>
                          <td className="py-3 pr-4">{formatarNumero(campanha.pedidos)}</td>
                          <td className="py-3 pr-4">{formatarNumero(campanha.mensagens)}</td>
                          <td className="py-3 pr-4">{formatarNumero(campanha.clientes)}</td>
                          <td className="py-3 pr-4">{formatarPercentual(campanha.conversao)}</td>
                        </tr>
                      ))}

                      {melhoresCampanhas.length === 0 && (
                        <tr>
                          <td colSpan="6" className="py-6 text-center text-gray-500">
                            Nenhuma campanha encontrada para a visão atual.
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
                    Campanhas com baixa conversão
                  </h2>

                  <div className="space-y-3">
                    {baixaConversao.map((campanha, index) => (
                      <div key={`${campanha.campanha}-${index}`} className="rounded-xl bg-red-50 border border-red-100 p-4">
                        <p className="font-bold break-words">{campanha.campanha}</p>

                        <p className="text-sm text-red-700 mt-1">
                          Conversão: {formatarPercentual(campanha.conversao)}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          Mensagens: {formatarNumero(campanha.mensagens)} · Pedidos: {formatarNumero(campanha.pedidos)}
                        </p>
                      </div>
                    ))}

                    {baixaConversao.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nenhuma campanha com baixa conversão identificada.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-lg sm:text-xl font-bold mb-4">
                    Templates mais usados
                  </h2>

                  <div className="space-y-3">
                    {templates.map((template, index) => (
                      <div
                        key={`${template.template}-${index}`}
                        className="rounded-xl bg-orange/5 border border-orange/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <p className="font-bold break-words">{template.template}</p>

                        <span className="text-sm text-orange font-bold whitespace-nowrap">
                          {formatarNumero(template.usos)} usos
                        </span>
                      </div>
                    ))}

                    {templates.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nenhum template identificado.
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

export default Campanhas;