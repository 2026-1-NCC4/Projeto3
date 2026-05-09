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
  ComposedChart,
  Legend,
  Line,
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

const renderizarValorTabela = (key, valor) => {
  const chave = String(key || '').toLowerCase();

  if (chave.includes('receita')) return formatarMoeda(valor);
  if (chave.includes('faturamento')) return formatarMoeda(valor);
  if (chave.includes('ticket')) return formatarMoeda(valor);
  if (chave.includes('valor')) return formatarMoeda(valor);
  if (chave.includes('margembruta')) return formatarMoeda(valor);
  if (chave.includes('margem') && !chave.includes('percentual')) return formatarMoeda(valor);
  if (chave.includes('custo')) return formatarMoeda(valor);
  if (chave.includes('caixa')) return formatarMoeda(valor);
  if (chave.includes('desconto') && !chave.includes('taxa')) return formatarMoeda(valor);

  if (chave.includes('percentual')) return formatarPercentual(valor);
  if (chave.includes('taxa')) return formatarPercentual(valor);
  if (chave.includes('margempercentual')) return formatarPercentual(valor);

  if (chave.includes('pedido')) return formatarNumero(valor);

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
  link.download = nomeArquivo || 'detalhamento_financeiro.csv';
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
  documento.text(titulo || 'Detalhamento financeiro', 40, 40);

  documento.setFontSize(9);
  documento.text(descricao || 'Tabela de apoio exportada da aba Financeiro.', 40, 58);

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

  documento.save((nomeArquivo || 'detalhamento_financeiro.csv').replace('.csv', '.pdf'));
};

const CardResumo = ({ titulo, valor, descricao, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm text-left w-full hover:shadow-md hover:-translate-y-[1px] transition-all"
    >
      <p className="text-sm text-gray-500">{titulo}</p>

      <h2 className="text-3xl font-bold mt-2 text-text-dark">
        {valor}
      </h2>

      {descricao && (
        <p className="text-xs text-gray-400 mt-2">
          {descricao}
        </p>
      )}

      <p className="text-xs text-orange font-semibold mt-3">
        Clique para detalhar
      </p>
    </button>
  );
};

const AlertaBadge = ({ prioridade }) => {
  const classe =
    prioridade === 'alta'
      ? 'bg-red-100 text-red-700 border-red-200'
      : prioridade === 'media'
        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
        : 'bg-green-100 text-green-700 border-green-200';

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${classe}`}>
      {prioridade || 'baixa'}
    </span>
  );
};

const Financeiro = () => {
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

  const financeiro = dashboard?.financeiro || {};

  const receitaPorMes = financeiro.receitaPorMes || [];
  const ticketMedioPorMes = financeiro.ticketMedioPorMes || [];

  const resultadoPorMes = financeiro.resultadoPorMes || [];
  const resultadoPorCanal = financeiro.resultadoPorCanal || [];
  const resultadoPorTipoPedido = financeiro.resultadoPorTipoPedido || [];
  const alertasFinanceiros = financeiro.alertasFinanceiros || [];

  const detalhes = useMemo(() => {
    return {
      receitaBruta: {
        titulo: 'Detalhamento da receita bruta',
        descricao: 'Receita bruta, descontos, pedidos e ticket médio por período.',
        nomeArquivo: 'detalhamento_receita_bruta.csv',
        colunas: [
          { key: 'periodo', label: 'Período' },
          { key: 'receitaBruta', label: 'Receita bruta' },
          { key: 'descontos', label: 'Descontos' },
          { key: 'receitaLiquida', label: 'Receita líquida' },
          { key: 'pedidos', label: 'Pedidos' },
          { key: 'ticketMedio', label: 'Ticket médio' }
        ],
        dados: resultadoPorMes
      },
      receitaLiquida: {
        titulo: 'Detalhamento da receita líquida',
        descricao: 'Receita líquida após descontos simulados, custos e margem por período.',
        nomeArquivo: 'detalhamento_receita_liquida.csv',
        colunas: [
          { key: 'periodo', label: 'Período' },
          { key: 'receitaLiquida', label: 'Receita líquida' },
          { key: 'descontos', label: 'Descontos' },
          { key: 'custosVariaveis', label: 'Custos variáveis' },
          { key: 'margemBruta', label: 'Margem bruta' },
          { key: 'margemPercentual', label: 'Margem %' }
        ],
        dados: resultadoPorMes
      },
      custosVariaveis: {
        titulo: 'Detalhamento dos custos variáveis',
        descricao: 'Custos variáveis simulados e impacto na margem por período.',
        nomeArquivo: 'detalhamento_custos_variaveis.csv',
        colunas: [
          { key: 'periodo', label: 'Período' },
          { key: 'custosVariaveis', label: 'Custos variáveis' },
          { key: 'receitaLiquida', label: 'Receita líquida' },
          { key: 'margemBruta', label: 'Margem bruta' },
          { key: 'margemPercentual', label: 'Margem %' }
        ],
        dados: resultadoPorMes
      },
      margemBruta: {
        titulo: 'Detalhamento da margem bruta',
        descricao: 'Margem bruta, margem percentual, receita líquida e custos por período.',
        nomeArquivo: 'detalhamento_margem_bruta.csv',
        colunas: [
          { key: 'periodo', label: 'Período' },
          { key: 'margemBruta', label: 'Margem bruta' },
          { key: 'margemPercentual', label: 'Margem %' },
          { key: 'receitaLiquida', label: 'Receita líquida' },
          { key: 'custosVariaveis', label: 'Custos variáveis' }
        ],
        dados: resultadoPorMes
      },
      caixaEstimado: {
        titulo: 'Detalhamento do caixa estimado',
        descricao: 'Base mensal usada para leitura do caixa estimado e reserva simulada.',
        nomeArquivo: 'detalhamento_caixa_estimado.csv',
        colunas: [
          { key: 'periodo', label: 'Período' },
          { key: 'receitaLiquida', label: 'Receita líquida' },
          { key: 'margemBruta', label: 'Margem bruta' },
          { key: 'margemPercentual', label: 'Margem %' },
          { key: 'pedidos', label: 'Pedidos' }
        ],
        dados: resultadoPorMes
      },
      ticketMedio: {
        titulo: 'Detalhamento do ticket médio',
        descricao: 'Ticket médio, receita e pedidos por período.',
        nomeArquivo: 'detalhamento_ticket_medio_financeiro.csv',
        colunas: [
          { key: 'periodo', label: 'Período' },
          { key: 'ticketMedio', label: 'Ticket médio' },
          { key: 'receitaBruta', label: 'Receita bruta' },
          { key: 'pedidos', label: 'Pedidos' }
        ],
        dados: resultadoPorMes
      },
      descontos: {
        titulo: 'Detalhamento dos descontos',
        descricao: 'Descontos aplicados e relação com receita bruta e líquida.',
        nomeArquivo: 'detalhamento_descontos.csv',
        colunas: [
          { key: 'periodo', label: 'Período' },
          { key: 'descontos', label: 'Descontos' },
          { key: 'receitaBruta', label: 'Receita bruta' },
          { key: 'receitaLiquida', label: 'Receita líquida' }
        ],
        dados: resultadoPorMes
      },
      taxaDesconto: {
        titulo: 'Detalhamento da taxa média de desconto',
        descricao: 'Descontos por período para análise da taxa média de desconto.',
        nomeArquivo: 'detalhamento_taxa_desconto.csv',
        colunas: [
          { key: 'periodo', label: 'Período' },
          { key: 'descontos', label: 'Descontos' },
          { key: 'receitaBruta', label: 'Receita bruta' },
          { key: 'receitaLiquida', label: 'Receita líquida' }
        ],
        dados: resultadoPorMes
      },
      canais: {
        titulo: 'Detalhamento financeiro por canal',
        descricao: 'Resultado financeiro consolidado por canal.',
        nomeArquivo: 'detalhamento_financeiro_canais.csv',
        colunas: [
          { key: 'canal', label: 'Canal' },
          { key: 'receitaLiquida', label: 'Receita líquida' },
          { key: 'margemBruta', label: 'Margem bruta' },
          { key: 'margemPercentual', label: 'Margem %' },
          { key: 'pedidos', label: 'Pedidos' }
        ],
        dados: resultadoPorCanal
      },
      tiposPedido: {
        titulo: 'Detalhamento financeiro por tipo de pedido',
        descricao: 'Resultado financeiro consolidado por tipo de pedido.',
        nomeArquivo: 'detalhamento_financeiro_tipos_pedido.csv',
        colunas: [
          { key: 'tipo', label: 'Tipo' },
          { key: 'receitaLiquida', label: 'Receita líquida' },
          { key: 'custosVariaveis', label: 'Custos variáveis' },
          { key: 'margemBruta', label: 'Margem bruta' },
          { key: 'margemPercentual', label: 'Margem %' },
          { key: 'pedidos', label: 'Pedidos' }
        ],
        dados: resultadoPorTipoPedido
      },
      alertas: {
        titulo: 'Detalhamento dos alertas financeiros',
        descricao: 'Alertas financeiros críticos ou de atenção da visão atual.',
        nomeArquivo: 'detalhamento_alertas_financeiros.csv',
        colunas: [
          { key: 'tipo', label: 'Tipo' },
          { key: 'prioridade', label: 'Prioridade' },
          { key: 'mensagem', label: 'Mensagem' },
          { key: 'acaoSugerida', label: 'Ação sugerida' }
        ],
        dados: alertasFinanceiros
      }
    };
  }, [resultadoPorMes, resultadoPorCanal, resultadoPorTipoPedido, alertasFinanceiros]);

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

      <div className="flex-1 lg:ml-72">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 bg-orange p-2 rounded-lg shadow-lg"
        >
          <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>

        <main className="p-5 lg:p-8">
          <header
            className="mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4"
            style={fontePoppins}
          >
            <div>
              <h1
                className="text-3xl font-bold text-text-dark"
                style={fontePoppins}
              >
                Financeiro
              </h1>

              <p
                className="text-sm text-gray-500 mt-2 max-w-3xl"
                style={fontePoppins}
              >
                {isEmpresa
                  ? 'Painel financeiro da sua empresa com receita bruta, receita líquida simulada, custos variáveis, margem, caixa estimado, canais e alertas financeiros.'
                  : 'Painel financeiro com receita bruta, receita líquida simulada, custos variáveis, margem, caixa estimado, canais e alertas financeiros.'}
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
              className="px-5 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-50"
              style={fontePoppins}
            >
              {loading ? 'Atualizando...' : 'Atualizar financeiro'}
            </button>
          </header>

          {loading && (
            <section className="bg-white rounded-2xl p-8 border border-orange/10">
              Carregando financeiro...
            </section>
          )}

          {erro && (
            <section className="bg-red-100 rounded-2xl p-6 border border-red-300 text-red-700">
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
                    ? 'Use estes filtros para recalcular apenas os dados financeiros da sua empresa.'
                    : 'Use estes filtros para recalcular os dados exibidos em financeiro.'
                }
              />

              <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <CardResumo
                  titulo="Receita bruta"
                  onClick={() => abrirDetalhe('receitaBruta')}
                  valor={formatarMoeda(financeiro.receitaBruta ?? financeiro.receitaTotal)}
                  descricao="Receita total antes dos descontos"
                />

                <CardResumo
                  titulo="Receita líquida"
                  onClick={() => abrirDetalhe('receitaLiquida')}
                  valor={formatarMoeda(financeiro.receitaLiquida)}
                  descricao="Receita após descontos simulados"
                />

                <CardResumo
                  titulo="Custos variáveis"
                  onClick={() => abrirDetalhe('custosVariaveis')}
                  valor={formatarMoeda(financeiro.custosVariaveis)}
                  descricao={`Simulação: ${formatarPercentual(financeiro.percentualCustoVariavel)} da receita líquida`}
                />

                <CardResumo
                  titulo="Margem bruta"
                  onClick={() => abrirDetalhe('margemBruta')}
                  valor={formatarMoeda(financeiro.margemBruta)}
                  descricao={`Margem: ${formatarPercentual(financeiro.margemPercentual)}`}
                />
              </section>

              <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <CardResumo
                  titulo="Caixa estimado"
                  onClick={() => abrirDetalhe('caixaEstimado')}
                  valor={formatarMoeda(financeiro.caixaEstimado)}
                  descricao={`Reserva simulada: ${formatarPercentual(financeiro.percentualReservaCaixa)}`}
                />

                <CardResumo
                  titulo="Ticket médio"
                  onClick={() => abrirDetalhe('ticketMedio')}
                  valor={formatarMoeda(financeiro.ticketMedio)}
                  descricao="Média por pedido"
                />

                <CardResumo
                  titulo="Descontos totais"
                  onClick={() => abrirDetalhe('descontos')}
                  valor={formatarMoeda(financeiro.descontosTotal)}
                  descricao="Total de descontos aplicados"
                />

                <CardResumo
                  titulo="Taxa média de desconto"
                  onClick={() => abrirDetalhe('taxaDesconto')}
                  valor={formatarPercentual(financeiro.taxaDescontoMedia)}
                  descricao="Descontos sobre subtotal"
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

                  <div className="overflow-x-auto">
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

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">
                    Resultado financeiro por mês
                  </h2>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={resultadoPorMes}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatarMoeda(value)} />
                        <Legend />
                        <Bar dataKey="receitaLiquida" name="Receita líquida" fill="#f26322" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="custosVariaveis" name="Custos variáveis" fill="#f9b08f" radius={[8, 8, 0, 0]} />
                        <Line type="monotone" dataKey="margemBruta" name="Margem bruta" stroke="#7c2d12" strokeWidth={3} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">
                    Margem percentual por mês
                  </h2>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={resultadoPorMes}>
                        <defs>
                          <linearGradient id="financeiroMargem" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f26322" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#f26322" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatarPercentual(value)} />
                        <Area
                          type="monotone"
                          dataKey="margemPercentual"
                          name="Margem %"
                          stroke="#f26322"
                          strokeWidth={3}
                          fill="url(#financeiroMargem)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">
                    Receita bruta por mês
                  </h2>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={receitaPorMes}>
                        <defs>
                          <linearGradient id="financeiroReceita" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f26322" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="#f26322" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatarMoeda(value)} />
                        <Area
                          type="monotone"
                          dataKey="receita"
                          stroke="#f26322"
                          strokeWidth={3}
                          fill="url(#financeiroReceita)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">
                    Ticket médio por mês
                  </h2>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ticketMedioPorMes}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatarMoeda(value)} />
                        <Bar dataKey="ticketMedio" fill="#f26322" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">
                    Resultado por canal
                  </h2>

                  <div className="h-80 mb-5">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={resultadoPorCanal}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="canal" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatarMoeda(value)} />
                        <Legend />
                        <Bar dataKey="receitaLiquida" name="Receita líquida" fill="#f26322" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="margemBruta" name="Margem bruta" fill="#7c2d12" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {resultadoPorCanal.map((canal, index) => (
                      <div key={`${canal.canal}-${index}`} className="rounded-xl bg-orange/5 border border-orange/10 p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-bold">{canal.canal}</p>
                          <p className="font-bold text-orange">{formatarMoeda(canal.receitaLiquida)}</p>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          Pedidos: {formatarNumero(canal.pedidos)} · Margem: {formatarMoeda(canal.margemBruta)} · Margem %: {formatarPercentual(canal.margemPercentual)}
                        </p>
                      </div>
                    ))}

                    {resultadoPorCanal.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nenhum dado financeiro por canal identificado.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">
                    Resultado por tipo de pedido
                  </h2>

                  <div className="h-80 mb-5">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={resultadoPorTipoPedido}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="tipo" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatarMoeda(value)} />
                        <Legend />
                        <Bar dataKey="receitaLiquida" name="Receita líquida" fill="#f26322" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="margemBruta" name="Margem bruta" fill="#7c2d12" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    {resultadoPorTipoPedido.map((tipo, index) => (
                      <div key={`${tipo.tipo}-${index}`} className="rounded-xl bg-orange/5 border border-orange/10 p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-bold">{tipo.tipo}</p>
                          <p className="font-bold text-orange">
                            {formatarMoeda(tipo.receitaLiquida)}
                          </p>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                          Pedidos: {formatarNumero(tipo.pedidos)} · Custos: {formatarMoeda(tipo.custosVariaveis)} · Margem: {formatarPercentual(tipo.margemPercentual)}
                        </p>
                      </div>
                    ))}

                    {resultadoPorTipoPedido.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nenhum resultado por tipo de pedido identificado.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm mb-6">
                <h2 className="text-xl font-bold mb-4">
                  Alertas financeiros
                </h2>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  {alertasFinanceiros.map((alerta, index) => (
                    <div
                      key={`${alerta.tipo}-${index}`}
                      className="rounded-2xl bg-red-50 border border-red-100 p-5"
                    >
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="font-bold text-red-800">
                          {alerta.tipo}
                        </p>

                        <AlertaBadge prioridade={alerta.prioridade} />
                      </div>

                      <p className="text-sm text-red-700">
                        {alerta.mensagem}
                      </p>

                      <p className="text-xs text-red-600 font-semibold mt-3">
                        {alerta.acaoSugerida}
                      </p>
                    </div>
                  ))}

                  {alertasFinanceiros.length === 0 && (
                    <div className="rounded-2xl bg-green-50 border border-green-100 p-5 xl:col-span-3">
                      <p className="font-bold text-green-700">
                        Nenhum alerta financeiro crítico identificado.
                      </p>

                      <p className="text-sm text-green-700 mt-1">
                        A visão atual não apresenta queda relevante de receita, desconto excessivo ou margem simulada abaixo do limite.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                <h2 className="text-xl font-bold mb-4">
                  Detalhamento financeiro mensal
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-3 pr-4">Período</th>
                        <th className="py-3 pr-4">Receita bruta</th>
                        <th className="py-3 pr-4">Descontos</th>
                        <th className="py-3 pr-4">Receita líquida</th>
                        <th className="py-3 pr-4">Custos variáveis</th>
                        <th className="py-3 pr-4">Margem bruta</th>
                        <th className="py-3 pr-4">Margem %</th>
                        <th className="py-3 pr-4">Pedidos</th>
                        <th className="py-3 pr-4">Ticket médio</th>
                      </tr>
                    </thead>

                    <tbody>
                      {resultadoPorMes.map((item, index) => (
                        <tr key={`${item.periodo}-${index}`} className="border-b last:border-b-0">
                          <td className="py-3 pr-4 font-medium">
                            {item.periodo}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarMoeda(item.receitaBruta)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarMoeda(item.descontos)}
                          </td>

                          <td className="py-3 pr-4 font-semibold text-orange">
                            {formatarMoeda(item.receitaLiquida)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarMoeda(item.custosVariaveis)}
                          </td>

                          <td className="py-3 pr-4 font-semibold">
                            {formatarMoeda(item.margemBruta)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarPercentual(item.margemPercentual)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarNumero(item.pedidos)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarMoeda(item.ticketMedio)}
                          </td>
                        </tr>
                      ))}

                      {resultadoPorMes.length === 0 && (
                        <tr>
                          <td colSpan="9" className="py-6 text-center text-gray-500">
                            Nenhum resultado financeiro mensal encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Financeiro;