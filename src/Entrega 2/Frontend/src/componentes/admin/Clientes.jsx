import React, { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, X } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

import Sidebar from '../dashboard/Sidebar';
import {
  buscarAdminDashboard,
  buscarCompanyDashboard
} from './services/adminDashboardService';
import FiltrosDashboard from './shared/FiltrosDashboard';

const FILTROS_PADRAO = {
  periodo: 'todos',
  empresa: 'todas',
  canal: 'todos',
  tipoPedido: 'todos'
};

const coresGraficos = ['#f26322', '#ff8a4c', '#ffb088', '#ffd2bd', '#f7a072', '#d9480f', '#7c2d12'];

const formatarNumero = (valor) => {
  return Number(valor || 0).toLocaleString('pt-BR');
};

const formatarMoeda = (valor) => {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

const formatarPercentual = (valor) => {
  return `${Number(valor || 0).toFixed(2)}%`;
};


const obterNomeCliente = (cliente, index) => {
  const nomeEncontrado =
    cliente?.nome ||
    cliente?.name ||
    cliente?.customerName ||
    cliente?.customer_name ||
    cliente?.cliente ||
    cliente?.nomeCliente ||
    cliente?.nome_cliente;

  if (nomeEncontrado && String(nomeEncontrado).trim()) {
    return String(nomeEncontrado).trim();
  }

  return `Cliente ${index + 1}`;
};

const prepararClientesParaGrafico = (clientes = []) => {
  return clientes.map((cliente, index) => ({
    ...cliente,
    clienteLabel: obterNomeCliente(cliente, index),
    clienteCodigo: cliente?.customerid || cliente?.customerId || cliente?.id || '-'
  }));
};

const TooltipGrafico = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-orange/10 p-3 max-w-[280px]">
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
          key.includes('ticket')
            ? formatarMoeda(valor)
            : key.includes('taxa') ||
                key.includes('participacao') ||
                key.includes('retencao')
              ? formatarPercentual(valor)
              : formatarNumero(valor);

        return (
          <p key={`${item.dataKey}-${index}`} className="text-xs text-gray-600 break-words">
            <strong>{item.name || item.dataKey}:</strong> {valorFormatado}
          </p>
        );
      })}
    </div>
  );
};

const CardResumo = ({ titulo, valor, descricao, onClick }) => {
  const conteudo = (
    <>
      <p className="text-sm text-gray-500 break-words">{titulo}</p>

      <h2 className="text-2xl sm:text-3xl font-bold mt-2 text-text-dark break-words">
        {valor}
      </h2>

      {descricao && (
        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
          {descricao}
        </p>
      )}

      {onClick && (
        <p className="text-xs text-orange font-semibold mt-3">
          Clique para detalhar
        </p>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm min-w-0 text-left w-full hover:shadow-md hover:-translate-y-[1px] transition-all"
      >
        {conteudo}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm min-w-0">
      {conteudo}
    </div>
  );
};

const CardGrafico = ({ titulo, descricao, children, altura = 'h-[320px] sm:h-80' }) => {
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

      <div className={`${altura} w-full min-w-0`}>
        {children}
      </div>
    </section>
  );
};


const renderizarValorTabela = (key, valor) => {
  const chave = String(key || '').toLowerCase();

  if (chave.includes('receita')) return formatarMoeda(valor);
  if (chave.includes('ticket')) return formatarMoeda(valor);
  if (chave.includes('valor')) return formatarMoeda(valor);

  if (chave.includes('taxa')) return formatarPercentual(valor);
  if (chave.includes('participacao')) return formatarPercentual(valor);
  if (chave.includes('retencao')) return formatarPercentual(valor);
  if (chave.includes('recorrencia')) return formatarPercentual(valor);
  if (chave.includes('roi')) return formatarPercentual(valor);

  if (chave.includes('clientes')) return formatarNumero(valor);
  if (chave.includes('pedidos')) return formatarNumero(valor);
  if (chave.includes('score')) return formatarNumero(valor);
  if (chave.includes('base')) return formatarNumero(valor);

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
  link.download = nomeArquivo || 'detalhamento_clientes.csv';
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
  documento.text(titulo || 'Detalhamento de clientes', 40, 40);

  documento.setFontSize(9);
  documento.text(descricao || 'Tabela de apoio exportada do painel de clientes.', 40, 58);

  documento.setFontSize(8);
  documento.text(`Exportado em: ${dataAtual}`, 40, 74);

  autoTable(documento, {
    head: [colunas.map((coluna) => coluna.label)],
    body: dados.map((item) => colunas.map((coluna) => renderizarValorTabela(coluna.key, item[coluna.key]))),
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

  documento.save((nomeArquivo || 'detalhamento_clientes.csv').replace('.csv', '.pdf'));
};

const DetalhamentoKpi = ({ detalheSelecionado, onFechar }) => {
  if (!detalheSelecionado) return null;

  const dados = detalheSelecionado.dados || [];
  const colunas = detalheSelecionado.colunas || [];

  return (
    <section
      id="detalhamento-kpi"
      className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm mb-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-text-dark">
            {detalheSelecionado.titulo}
          </h2>

          {detalheSelecionado.descricao && (
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              {detalheSelecionado.descricao}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => exportarCsv({ nomeArquivo: detalheSelecionado.nomeArquivo, colunas, dados })}
            disabled={dados.length === 0}
            className="px-4 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() => exportarPdf({ titulo: detalheSelecionado.titulo, descricao: detalheSelecionado.descricao, nomeArquivo: detalheSelecionado.nomeArquivo, colunas, dados })}
            disabled={dados.length === 0}
            className="px-4 py-3 rounded-xl bg-white border border-orange/20 text-orange font-semibold hover:bg-orange/5 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileText size={18} />
            Exportar PDF
          </button>

          <button
            type="button"
            onClick={onFechar}
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
              {colunas.map((coluna) => (
                <th key={coluna.key} className="py-3 pr-4">
                  {coluna.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {dados.slice(0, 30).map((item, index) => (
              <tr key={index} className="border-b last:border-b-0">
                {colunas.map((coluna) => (
                  <td key={coluna.key} className="py-3 pr-4">
                    {coluna.key === 'segmento' ? (
                      <SegmentoBadge segmento={item[coluna.key]} />
                    ) : (
                      renderizarValorTabela(coluna.key, item[coluna.key])
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {dados.length === 0 && (
              <tr>
                <td colSpan={colunas.length || 1} className="py-6 text-center text-gray-500">
                  Nenhum dado encontrado para este detalhamento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {dados.length > 30 && (
        <p className="text-xs text-gray-500 mt-4">
          Mostrando os primeiros 30 registros. A exportação CSV/PDF inclui todos os registros disponíveis.
        </p>
      )}
    </section>
  );
};

const SegmentoBadge = ({ segmento }) => {
  const classe =
    segmento === 'Campeões'
      ? 'bg-green-100 text-green-700 border-green-200'
      : segmento === 'Fiéis'
        ? 'bg-blue-100 text-blue-700 border-blue-200'
        : segmento === 'Potenciais'
          ? 'bg-orange/10 text-orange border-orange/20'
          : segmento === 'Em risco'
            ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
            : 'bg-red-100 text-red-700 border-red-200';

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${classe}`}>
      {segmento || 'Sem segmento'}
    </span>
  );
};

const Clientes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
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

  const carregarDados = async ({ filtrosAplicados = filtrosRef.current } = {}) => {
    try {
      setLoading(true);
      setErro('');

      const data = isEmpresa
        ? await buscarCompanyDashboard(filtrosAplicados)
        : await buscarAdminDashboard(filtrosAplicados);

      setDashboard(data);
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
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
  }, []);

  const clientes = dashboard?.clientes || {};
  const segmentacao = clientes.segmentacao || {};
  const clientesPorEstado = clientes.clientesPorEstado || [];
  const clientesNovosPorMes = clientes.clientesNovosPorMes || [];

  const rfm = clientes.rfm || {};
  const resumoRfm = rfm.resumo || {};
  const segmentosRfm = rfm.segmentos || [];
  const topClientes = rfm.topClientes || [];
  const coortes = clientes.coortes || [];

  const dadosSegmentacao = useMemo(() => {
    return [
      { nome: 'Com pedido', valor: Number(segmentacao.comPedido || 0) },
      { nome: 'Sem pedido', valor: Number(segmentacao.semPedido || 0) },
      { nome: 'Ativos', valor: Number(segmentacao.ativos || 0) },
      { nome: 'Inativos', valor: Number(segmentacao.inativos || 0) }
    ].filter((item) => item.valor > 0);
  }, [segmentacao]);

  const dadosRecorrencia = useMemo(() => {
    return [
      { nome: 'Recorrentes', valor: Number(segmentacao.recorrentes || 0) },
      { nome: 'Ocasionais', valor: Number(segmentacao.ocasionais || 0) },
      { nome: 'Sem pedido', valor: Number(segmentacao.semPedido || 0) }
    ].filter((item) => item.valor > 0);
  }, [segmentacao]);

  const topEstados = useMemo(() => {
    return [...clientesPorEstado]
      .sort((a, b) => Number(b.clientes || 0) - Number(a.clientes || 0))
      .slice(0, 10);
  }, [clientesPorEstado]);

  const topClientesReceita = useMemo(() => {
    const ordenados = [...topClientes]
      .sort((a, b) => Number(b.receita || 0) - Number(a.receita || 0))
      .slice(0, 10);

    return prepararClientesParaGrafico(ordenados);
  }, [topClientes]);

  const topClientesPedidos = useMemo(() => {
    const ordenados = [...topClientes]
      .sort((a, b) => Number(b.pedidos || 0) - Number(a.pedidos || 0))
      .slice(0, 10);

    return prepararClientesParaGrafico(ordenados);
  }, [topClientes]);

  const topClientesTicket = useMemo(() => {
    const ordenados = [...topClientes]
      .sort((a, b) => Number(b.ticketMedio || 0) - Number(a.ticketMedio || 0))
      .slice(0, 8);

    return prepararClientesParaGrafico(ordenados);
  }, [topClientes]);

  const topClientesScore = useMemo(() => {
    const ordenados = [...topClientes]
      .sort((a, b) => Number(b.scoreRFM || 0) - Number(a.scoreRFM || 0))
      .slice(0, 10);

    return prepararClientesParaGrafico(ordenados);
  }, [topClientes]);

  const segmentosPorReceita = useMemo(() => {
    return [...segmentosRfm]
      .sort((a, b) => Number(b.receita || 0) - Number(a.receita || 0));
  }, [segmentosRfm]);

  const coortesGrafico = useMemo(() => {
    return coortes.map((coorte) => ({
      coorte: coorte.coorte,
      mes0: Number(coorte.retencaoMes0 || 0),
      mes1: Number(coorte.retencaoMes1 || 0),
      mes2: Number(coorte.retencaoMes2 || 0),
      mes3: Number(coorte.retencaoMes3 || 0),
      mes4: Number(coorte.retencaoMes4 || 0),
      mes5: Number(coorte.retencaoMes5 || 0)
    }));
  }, [coortes]);

  const detalhes = useMemo(() => {
    const colunasCliente = [
      { key: 'customerid', label: 'Cliente' },
      { key: 'segmento', label: 'Segmento' },
      { key: 'ultimoPedido', label: 'Último pedido' },
      { key: 'pedidos', label: 'Pedidos' },
      { key: 'receita', label: 'Receita' },
      { key: 'ticketMedio', label: 'Ticket médio' },
      { key: 'scoreRFM', label: 'Score RFM' }
    ];

    return {
      comPedido: {
        titulo: 'Detalhamento de clientes com pedido',
        descricao: 'Clientes que já realizaram pelo menos uma compra, com dados de RFM quando disponíveis.',
        nomeArquivo: 'detalhamento_clientes_com_pedido.csv',
        colunas: colunasCliente,
        dados: topClientes
      },
      ativos: {
        titulo: 'Detalhamento de clientes ativos',
        descricao: 'Clientes ativos na leitura RFM. Quando a recência em dias está disponível, considera clientes com compra recente.',
        nomeArquivo: 'detalhamento_clientes_ativos.csv',
        colunas: colunasCliente,
        dados: topClientes.filter((cliente) => Number(cliente.recenciaDias || 0) <= 90 || !cliente.recenciaDias)
      },
      inativos: {
        titulo: 'Detalhamento de clientes inativos',
        descricao: 'Clientes com maior recência ou classificados como oportunidade de reativação.',
        nomeArquivo: 'detalhamento_clientes_inativos.csv',
        colunas: colunasCliente,
        dados: [...topClientes].sort((a, b) => Number(b.recenciaDias || 0) - Number(a.recenciaDias || 0))
      },
      recorrencia: {
        titulo: 'Detalhamento da recorrência de clientes',
        descricao: 'Clientes com duas ou mais compras e dados de frequência/valor para análise de recompra.',
        nomeArquivo: 'detalhamento_recorrencia_clientes.csv',
        colunas: colunasCliente,
        dados: topClientes.filter((cliente) => Number(cliente.pedidos || 0) >= 2)
      },
      recorrentes: {
        titulo: 'Detalhamento de clientes recorrentes',
        descricao: 'Clientes com duas ou mais compras.',
        nomeArquivo: 'detalhamento_clientes_recorrentes.csv',
        colunas: colunasCliente,
        dados: topClientes.filter((cliente) => Number(cliente.pedidos || 0) >= 2)
      },
      ocasionais: {
        titulo: 'Detalhamento de clientes ocasionais',
        descricao: 'Clientes com apenas uma compra registrada.',
        nomeArquivo: 'detalhamento_clientes_ocasionais.csv',
        colunas: colunasCliente,
        dados: topClientes.filter((cliente) => Number(cliente.pedidos || 0) === 1)
      },
      rfm: {
        titulo: 'Detalhamento de clientes analisados no RFM',
        descricao: 'Base de clientes classificada por recência, frequência e valor monetário.',
        nomeArquivo: 'detalhamento_clientes_rfm.csv',
        colunas: colunasCliente,
        dados: topClientes
      },
      campeoes: {
        titulo: 'Detalhamento de clientes campeões',
        descricao: 'Clientes classificados como campeões na segmentação RFM.',
        nomeArquivo: 'detalhamento_clientes_campeoes.csv',
        colunas: colunasCliente,
        dados: topClientes.filter((cliente) => cliente.segmento === 'Campeões')
      },
      emRisco: {
        titulo: 'Detalhamento de clientes em risco',
        descricao: 'Clientes classificados como em risco ou com sinais de queda de atividade.',
        nomeArquivo: 'detalhamento_clientes_em_risco.csv',
        colunas: colunasCliente,
        dados: topClientes.filter((cliente) => cliente.segmento === 'Em risco')
      },
      novosClientes: {
        titulo: 'Detalhamento de novos clientes por mês',
        descricao: 'Evolução de entrada de novos clientes por período.',
        nomeArquivo: 'detalhamento_clientes_novos_por_mes.csv',
        colunas: [
          { key: 'periodo', label: 'Período' },
          { key: 'clientes', label: 'Clientes' }
        ],
        dados: clientesNovosPorMes
      },
      segmentosRfm: {
        titulo: 'Detalhamento dos segmentos RFM',
        descricao: 'Distribuição dos clientes por segmento RFM, com receita, pedidos e participação.',
        nomeArquivo: 'detalhamento_segmentos_rfm.csv',
        colunas: [
          { key: 'segmento', label: 'Segmento' },
          { key: 'clientes', label: 'Clientes' },
          { key: 'participacao', label: 'Participação' },
          { key: 'receita', label: 'Receita' },
          { key: 'pedidos', label: 'Pedidos' }
        ],
        dados: segmentosRfm
      },
      estados: {
        titulo: 'Detalhamento de clientes por estado',
        descricao: 'Distribuição geográfica da base de clientes.',
        nomeArquivo: 'detalhamento_clientes_por_estado.csv',
        colunas: [
          { key: 'estado', label: 'Estado' },
          { key: 'clientes', label: 'Clientes' }
        ],
        dados: clientesPorEstado
      },
      coortes: {
        titulo: 'Detalhamento das coortes de retenção',
        descricao: 'Retenção mensal por coorte de primeira compra.',
        nomeArquivo: 'detalhamento_coortes_clientes.csv',
        colunas: [
          { key: 'coorte', label: 'Coorte' },
          { key: 'clientesBase', label: 'Clientes base' },
          { key: 'retencaoMes0', label: 'Mês 0' },
          { key: 'retencaoMes1', label: 'Mês 1' },
          { key: 'retencaoMes2', label: 'Mês 2' },
          { key: 'retencaoMes3', label: 'Mês 3' },
          { key: 'retencaoMes4', label: 'Mês 4' },
          { key: 'retencaoMes5', label: 'Mês 5' }
        ],
        dados: coortes
      }
    };
  }, [topClientes, clientesNovosPorMes, segmentosRfm, clientesPorEstado, coortes]);

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
                Clientes
              </h1>

              <p
                className="text-sm text-gray-500 mt-2 max-w-3xl leading-relaxed"
                style={fontePoppins}
              >
                {isEmpresa
                  ? 'Segmentação dos clientes da sua empresa, recorrência, RFM simplificado, coortes de retenção e distribuição geográfica.'
                  : 'Segmentação global de clientes, recorrência, RFM simplificado, coortes de retenção e distribuição geográfica.'}
              </p>

              {isEmpresa && (
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span
                    className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold"
                    style={fontePoppins}
                  >
                    Visão filtrada pela empresa logada
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => carregarDados({ filtrosAplicados: filtrosRef.current })}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-50"
              style={fontePoppins}
            >
              {loading ? 'Atualizando...' : 'Atualizar clientes'}
            </button>
          </header>

          {loading && (
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-orange/10">
              Carregando clientes...
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
                loading={loading}
                esconderEmpresa={isEmpresa}
                titulo={isEmpresa ? 'Filtros da empresa' : 'Filtros da aba'}
                descricao={
                  isEmpresa
                    ? 'Use estes filtros para recalcular apenas os dados de clientes da sua empresa.'
                    : 'Use estes filtros para recalcular os dados exibidos em clientes.'
                }
              />

              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
                <CardResumo
                  titulo="Clientes com pedido"
                  valor={formatarNumero(segmentacao.comPedido)}
                  descricao="Clientes que já compraram"
                  onClick={() => abrirDetalhe('comPedido')}
                />

                <CardResumo
                  titulo="Clientes ativos"
                  valor={formatarNumero(segmentacao.ativos)}
                  descricao="Compraram recentemente"
                  onClick={() => abrirDetalhe('ativos')}
                />

                <CardResumo
                  titulo="Clientes inativos"
                  valor={formatarNumero(segmentacao.inativos)}
                  descricao="Sem compra recente"
                  onClick={() => abrirDetalhe('inativos')}
                />

                <CardResumo
                  titulo="Taxa de recorrência"
                  valor={formatarPercentual(segmentacao.taxaRecorrencia)}
                  descricao="Clientes com mais de uma compra"
                  onClick={() => abrirDetalhe('recorrencia')}
                />
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 mb-6">
                <CardResumo
                  titulo="Recorrentes"
                  valor={formatarNumero(segmentacao.recorrentes)}
                  descricao="Clientes com 2 ou mais pedidos"
                  onClick={() => abrirDetalhe('recorrentes')}
                />

                <CardResumo
                  titulo="Ocasionais"
                  valor={formatarNumero(segmentacao.ocasionais)}
                  descricao="Clientes com apenas 1 pedido"
                  onClick={() => abrirDetalhe('ocasionais')}
                />

                <CardResumo
                  titulo="Sem pedido"
                  valor={formatarNumero(segmentacao.semPedido)}
                  descricao="Clientes cadastrados sem compra"
                />
              </section>

              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
                <CardResumo
                  titulo="Clientes analisados no RFM"
                  valor={formatarNumero(resumoRfm.totalClientesAnalisados)}
                  descricao="Base com histórico de pedidos"
                  onClick={() => abrirDetalhe('rfm')}
                />

                <CardResumo
                  titulo="Campeões"
                  valor={formatarNumero(resumoRfm.campeoes)}
                  descricao="Alta frequência, valor e recência"
                  onClick={() => abrirDetalhe('campeoes')}
                />

                <CardResumo
                  titulo="Clientes em risco"
                  valor={formatarNumero(resumoRfm.emRisco)}
                  descricao="Clientes com queda de atividade"
                  onClick={() => abrirDetalhe('emRisco')}
                />

                <CardResumo
                  titulo="Novos clientes"
                  valor={formatarNumero(resumoRfm.novosClientes)}
                  descricao="Clientes recentes na análise RFM"
                  onClick={() => abrirDetalhe('novosClientes')}
                />
              </section>

              <DetalhamentoKpi
                detalheSelecionado={detalheSelecionado}
                onFechar={() => setDetalheAtivo(null)}
              />

              <section className="grid grid-cols-1 2xl:grid-cols-2 gap-5 sm:gap-6 mb-6">
                <CardGrafico
                  titulo="Clientes novos por mês"
                  descricao="Evolução de entrada de novos clientes na base."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={clientesNovosPorMes} margin={{ top: 5, right: 20, left: 0, bottom: 45 }}>
                      <defs>
                        <linearGradient id="clientesNovosGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f26322" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#f26322" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis
                        dataKey="periodo"
                        tick={{ fontSize: 10 }}
                        angle={-25}
                        textAnchor="end"
                        height={65}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<TooltipGrafico />} />
                      <Area
                        type="monotone"
                        dataKey="clientes"
                        name="Clientes"
                        stroke="#f26322"
                        strokeWidth={3}
                        fill="url(#clientesNovosGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardGrafico>

                <CardGrafico
                  titulo="Distribuição da base de clientes"
                  descricao="Comparação entre clientes com pedido, sem pedido, ativos e inativos."
                >
                  {dadosSegmentacao.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosSegmentacao}
                          dataKey="valor"
                          nameKey="nome"
                          innerRadius={58}
                          outerRadius={105}
                          paddingAngle={3}
                        >
                          {dadosSegmentacao.map((item, index) => (
                            <Cell key={item.nome} fill={coresGraficos[index % coresGraficos.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<TooltipGrafico />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500 text-center px-4">
                      Nenhuma segmentação identificada.
                    </div>
                  )}
                </CardGrafico>
              </section>

              <section className="grid grid-cols-1 2xl:grid-cols-2 gap-5 sm:gap-6 mb-6">
                <CardGrafico
                  titulo="Recorrência da base"
                  descricao="Distribuição entre recorrentes, ocasionais e clientes sem pedido."
                >
                  {dadosRecorrencia.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosRecorrencia} margin={{ top: 5, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip content={<TooltipGrafico />} />
                        <Bar dataKey="valor" name="Clientes" fill="#f26322" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500 text-center px-4">
                      Nenhum dado de recorrência identificado.
                    </div>
                  )}
                </CardGrafico>

                <CardGrafico
                  titulo="Clientes por estado"
                  descricao="Top estados com maior concentração de clientes."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topEstados}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="estado"
                        width={90}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<TooltipGrafico />} />
                      <Bar dataKey="clientes" name="Clientes" fill="#f26322" radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardGrafico>
              </section>

              <section className="grid grid-cols-1 2xl:grid-cols-2 gap-5 sm:gap-6 mb-6">
                <CardGrafico
                  titulo="Segmentos RFM por quantidade de clientes"
                  descricao="Distribuição de clientes entre os segmentos RFM."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={segmentosRfm} margin={{ top: 5, right: 20, left: 0, bottom: 45 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis
                        dataKey="segmento"
                        tick={{ fontSize: 10 }}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<TooltipGrafico />} />
                      <Bar dataKey="clientes" name="Clientes" fill="#f26322" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardGrafico>

                <CardGrafico
                  titulo="Receita por segmento RFM"
                  descricao="Segmentos que mais contribuem para a receita."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={segmentosPorReceita}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(value) => formatarMoeda(value)} />
                      <YAxis type="category" dataKey="segmento" width={105} tick={{ fontSize: 10 }} />
                      <Tooltip content={<TooltipGrafico />} />
                      <Bar dataKey="receita" name="Receita" fill="#f26322" radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardGrafico>
              </section>

              <section className="grid grid-cols-1 2xl:grid-cols-2 gap-5 sm:gap-6 mb-6">
                <CardGrafico
                  titulo="Top clientes por receita"
                  descricao="Ranking dos clientes com maior contribuição monetária. Os nomes foram anonimizados para leitura do gráfico."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topClientesReceita}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 35, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(value) => formatarMoeda(value)} />
                      <YAxis type="category" dataKey="clienteLabel" width={95} tick={{ fontSize: 11 }} />
                      <Tooltip content={<TooltipGrafico />} />
                      <Bar dataKey="receita" name="Receita" fill="#f26322" radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardGrafico>

                <CardGrafico
                  titulo="Pedidos dos principais clientes"
                  descricao="Evolução comparativa dos clientes com maior frequência de compra."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={topClientesPedidos}
                      margin={{ top: 15, right: 25, left: 0, bottom: 55 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis
                        dataKey="clienteLabel"
                        tick={{ fontSize: 10 }}
                        angle={-25}
                        textAnchor="end"
                        height={70}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<TooltipGrafico />} />
                      <Line
                        type="monotone"
                        dataKey="pedidos"
                        name="Pedidos"
                        stroke="#f26322"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardGrafico>
              </section>

              <section className="grid grid-cols-1 2xl:grid-cols-2 gap-5 sm:gap-6 mb-6">
                <CardGrafico
                  titulo="Participação por ticket médio"
                  descricao="Distribuição dos clientes com maior valor médio por pedido."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topClientesTicket}
                        dataKey="ticketMedio"
                        nameKey="clienteLabel"
                        innerRadius={55}
                        outerRadius={105}
                        paddingAngle={3}
                      >
                        {topClientesTicket.map((item, index) => (
                          <Cell key={`${item.clienteLabel}-${index}`} fill={coresGraficos[index % coresGraficos.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<TooltipGrafico />} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardGrafico>

                <CardGrafico
                  titulo="Score RFM dos principais clientes"
                  descricao="Área comparativa do ranking combinado de recência, frequência e valor."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={topClientesScore}
                      margin={{ top: 15, right: 25, left: 0, bottom: 55 }}
                    >
                      <defs>
                        <linearGradient id="scoreRfmGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f26322" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#f26322" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis
                        dataKey="clienteLabel"
                        tick={{ fontSize: 10 }}
                        angle={-25}
                        textAnchor="end"
                        height={70}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<TooltipGrafico />} />
                      <Area
                        type="monotone"
                        dataKey="scoreRFM"
                        name="Score RFM"
                        stroke="#f26322"
                        strokeWidth={3}
                        fill="url(#scoreRfmGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardGrafico>
              </section>

              <section className="grid grid-cols-1 2xl:grid-cols-2 gap-5 sm:gap-6 mb-6">
                <CardGrafico
                  titulo="Retenção por coorte"
                  descricao="Comparação visual da retenção entre mês 0 e mês 5."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={coortesGrafico} margin={{ top: 5, right: 20, left: 0, bottom: 55 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis
                        dataKey="coorte"
                        tick={{ fontSize: 10 }}
                        angle={-25}
                        textAnchor="end"
                        height={75}
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `${Number(value || 0).toFixed(0)}%`} />
                      <Tooltip content={<TooltipGrafico />} />
                      <Line type="monotone" dataKey="mes0" name="Mês 0" stroke="#f26322" strokeWidth={3} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="mes1" name="Mês 1" stroke="#ff8a4c" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="mes2" name="Mês 2" stroke="#ffb088" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="mes3" name="Mês 3" stroke="#d9480f" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="mes4" name="Mês 4" stroke="#7c2d12" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="mes5" name="Mês 5" stroke="#f7a072" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardGrafico>

                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold mb-4">
                    Segmentos RFM
                  </h2>

                  <div className="space-y-3">
                    {segmentosRfm.map((item, index) => (
                      <div
                        key={`${item.segmento}-${index}`}
                        className="rounded-xl bg-orange/5 border border-orange/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 min-w-0"
                      >
                        <div className="min-w-0">
                          <SegmentoBadge segmento={item.segmento} />

                          <p className="text-xs text-gray-500 mt-2 leading-relaxed break-words">
                            Receita: {formatarMoeda(item.receita)} · Pedidos: {formatarNumero(item.pedidos)}
                          </p>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-lg font-bold text-orange">
                            {formatarNumero(item.clientes)}
                          </p>

                          <p className="text-xs text-gray-500">
                            {formatarPercentual(item.participacao)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {segmentosRfm.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nenhum segmento RFM encontrado.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold">
                      Top clientes por score RFM
                    </h2>

                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Clientes classificados por recência, frequência e valor monetário.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                  <table className="w-full min-w-[950px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-3 pr-4">Cliente</th>
                        <th className="py-3 pr-4">Segmento</th>
                        <th className="py-3 pr-4">Último pedido</th>
                        <th className="py-3 pr-4">Pedidos</th>
                        <th className="py-3 pr-4">Receita</th>
                        <th className="py-3 pr-4">Ticket médio</th>
                        <th className="py-3 pr-4">Score RFM</th>
                      </tr>
                    </thead>

                    <tbody>
                      {topClientes.map((cliente, index) => (
                        <tr key={`${cliente.customerid}-${index}`} className="border-b last:border-b-0">
                          <td className="py-3 pr-4 font-medium">
                            {cliente.customerid}
                          </td>

                          <td className="py-3 pr-4">
                            <SegmentoBadge segmento={cliente.segmento} />
                          </td>

                          <td className="py-3 pr-4">
                            {cliente.ultimoPedido || '-'}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarNumero(cliente.pedidos)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarMoeda(cliente.receita)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarMoeda(cliente.ticketMedio)}
                          </td>

                          <td className="py-3 pr-4 font-bold text-orange">
                            {formatarNumero(cliente.scoreRFM)}
                          </td>
                        </tr>
                      ))}

                      {topClientes.length === 0 && (
                        <tr>
                          <td colSpan="7" className="py-6 text-center text-gray-500">
                            Nenhum cliente encontrado para análise RFM.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold">
                      Coortes de retenção mensal
                    </h2>

                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Retenção de clientes agrupados pelo mês da primeira compra.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-3 pr-4">Coorte</th>
                        <th className="py-3 pr-4">Clientes base</th>
                        <th className="py-3 pr-4">Mês 0</th>
                        <th className="py-3 pr-4">Mês 1</th>
                        <th className="py-3 pr-4">Mês 2</th>
                        <th className="py-3 pr-4">Mês 3</th>
                        <th className="py-3 pr-4">Mês 4</th>
                        <th className="py-3 pr-4">Mês 5</th>
                      </tr>
                    </thead>

                    <tbody>
                      {coortes.map((coorte, index) => (
                        <tr key={`${coorte.coorte}-${index}`} className="border-b last:border-b-0">
                          <td className="py-3 pr-4 font-medium">
                            {coorte.coorte}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarNumero(coorte.clientesBase)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarPercentual(coorte.retencaoMes0)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarPercentual(coorte.retencaoMes1)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarPercentual(coorte.retencaoMes2)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarPercentual(coorte.retencaoMes3)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarPercentual(coorte.retencaoMes4)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarPercentual(coorte.retencaoMes5)}
                          </td>
                        </tr>
                      ))}

                      {coortes.length === 0 && (
                        <tr>
                          <td colSpan="8" className="py-6 text-center text-gray-500">
                            Nenhuma coorte encontrada para a visão atual.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold mb-4">
                    Clientes por estado
                  </h2>

                  <div className="space-y-3">
                    {clientesPorEstado.map((item, index) => (
                      <div
                        key={`${item.estado}-${index}`}
                        className="rounded-xl bg-orange/5 border border-orange/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                      >
                        <p className="font-bold break-words">
                          {item.estado}
                        </p>

                        <span className="text-sm text-orange font-bold whitespace-nowrap">
                          {formatarNumero(item.clientes)} clientes
                        </span>
                      </div>
                    ))}

                    {clientesPorEstado.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nenhum dado geográfico identificado.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold mb-4">
                    Leitura estratégica
                  </h2>

                  <div className="space-y-3">
                    <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                      <p className="font-bold text-green-700">
                        Clientes campeões
                      </p>

                      <p className="text-sm text-green-700 mt-1 leading-relaxed">
                        Representam clientes de alto valor, alta frequência e compra recente.
                      </p>
                    </div>

                    <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-4">
                      <p className="font-bold text-yellow-700">
                        Clientes em risco
                      </p>

                      <p className="text-sm text-yellow-700 mt-1 leading-relaxed">
                        Devem ser priorizados em campanhas de reativação e cupons de retorno.
                      </p>
                    </div>

                    <div className="rounded-xl bg-orange/5 border border-orange/10 p-4">
                      <p className="font-bold text-orange">
                        Potenciais
                      </p>

                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        Clientes com bom comportamento inicial e potencial para aumento de recorrência.
                      </p>
                    </div>
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

export default Clientes;
