import React, { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, FileText, X } from 'lucide-react';
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

const PrioridadeBadge = ({ prioridade }) => {
  const classe =
    prioridade === 'alta'
      ? 'bg-red-100 text-red-700 border-red-200'
      : prioridade === 'media'
        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
        : 'bg-green-100 text-green-700 border-green-200';

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${classe}`}>
      {prioridade || 'baixa'}
    </span>
  );
};

const TipoBadge = ({ tipo }) => {
  const labels = {
    reativacao: 'Reativação',
    upsell: 'Upsell / Ticket',
    baixa_conversao: 'Baixa conversão',
    replicar_campanha: 'Replicar campanha',
    queda_receita: 'Queda de receita'
  };

  return (
    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-orange/10 text-orange border border-orange/20 whitespace-nowrap">
      {labels[tipo] || tipo || 'Recomendação'}
    </span>
  );
};

const CardResumo = ({ titulo, valor, descricao, onClick }) => {
  const conteudo = (
    <>
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


const renderizarValorTabela = (key, valor) => {
  const chave = String(key || '').toLowerCase();

  if (valor === null || valor === undefined || valor === '') {
    return '-';
  }

  if (
    chave.includes('receita') ||
    chave.includes('ticket') ||
    chave.includes('faturamento')
  ) {
    return formatarMoeda(valor);
  }

  if (
    chave.includes('roi') ||
    chave.includes('conversao') ||
    chave.includes('taxa') ||
    chave.includes('percentual') ||
    chave.includes('valorMetrica'.toLowerCase()) ||
    chave.includes('retencao')
  ) {
    return formatarPercentual(valor);
  }

  if (
    chave.includes('pedidos') ||
    chave.includes('clientes') ||
    chave.includes('mensagens') ||
    chave.includes('recomendacoes') ||
    chave.includes('testes')
  ) {
    return formatarNumero(valor);
  }

  return valor;
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
  documento.text(titulo || 'Detalhamento de Recomendações', 40, 40);

  documento.setFontSize(9);
  documento.text(descricao || 'Tabela de apoio exportada do painel.', 40, 58);

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

  documento.save(nomeArquivo.replace('.csv', '.pdf'));
};

const Recomendacoes = () => {
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

  const recomendacoes = dashboard?.recomendacoes || {};
  const resumo = recomendacoes.resumo || {};
  const sugestoes = recomendacoes.sugestoesCampanha || [];
  const testesAB = recomendacoes.testeAB || [];
  const insights = recomendacoes.insights || [];

  const sugestoesAltaPrioridade = sugestoes.filter(
    (item) => item.prioridade === 'alta'
  );

  const sugestoesPorRoi = useMemo(() => {
    return [...sugestoes].sort((a, b) => Number(b.roiSimulado || 0) - Number(a.roiSimulado || 0));
  }, [sugestoes]);

  const testesPorConversao = useMemo(() => {
    return [...testesAB].sort((a, b) => {
      const melhorA = Math.max(Number(a.conversaoA || 0), Number(a.conversaoB || 0));
      const melhorB = Math.max(Number(b.conversaoA || 0), Number(b.conversaoB || 0));
      return melhorB - melhorA;
    });
  }, [testesAB]);

  const detalhes = useMemo(() => {
    return {
      totalRecomendacoes: {
        titulo: 'Detalhamento do total de recomendações',
        descricao: 'Lista completa das recomendações geradas por regras analíticas.',
        nomeArquivo: 'detalhamento_total_recomendacoes.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'tipo', label: 'Tipo' },
          { key: 'prioridade', label: 'Prioridade' },
          { key: 'campanhaRecomendada', label: 'Campanha recomendada' },
          { key: 'metricaBase', label: 'Métrica base' },
          { key: 'valorMetrica', label: 'Valor da métrica' },
          { key: 'roiSimulado', label: 'ROI simulado' },
          { key: 'receitaPotencial', label: 'Receita potencial' }
        ],
        dados: sugestoes
      },

      altaPrioridade: {
        titulo: 'Detalhamento das recomendações de alta prioridade',
        descricao: 'Ações críticas para atenção imediata.',
        nomeArquivo: 'detalhamento_recomendacoes_alta_prioridade.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'tipo', label: 'Tipo' },
          { key: 'prioridade', label: 'Prioridade' },
          { key: 'campanhaRecomendada', label: 'Campanha recomendada' },
          { key: 'justificativa', label: 'Justificativa' },
          { key: 'acaoSugerida', label: 'Ação sugerida' },
          { key: 'roiSimulado', label: 'ROI simulado' },
          { key: 'receitaPotencial', label: 'Receita potencial' }
        ],
        dados: sugestoesAltaPrioridade
      },

      roiMedio: {
        titulo: 'Detalhamento do ROI médio simulado',
        descricao: 'Recomendações ordenadas pelo ROI simulado.',
        nomeArquivo: 'detalhamento_roi_simulado.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'tipo', label: 'Tipo' },
          { key: 'campanhaRecomendada', label: 'Campanha recomendada' },
          { key: 'roiSimulado', label: 'ROI simulado' },
          { key: 'receitaPotencial', label: 'Receita potencial' },
          { key: 'metricaBase', label: 'Métrica base' },
          { key: 'valorMetrica', label: 'Valor da métrica' }
        ],
        dados: sugestoesPorRoi
      },

      melhorConversao: {
        titulo: 'Detalhamento da melhor conversão',
        descricao: 'Testes A/B simulados ordenados pela melhor taxa de conversão identificada.',
        nomeArquivo: 'detalhamento_melhor_conversao.csv',
        colunas: [
          { key: 'empresa', label: 'Empresa' },
          { key: 'campanhaA', label: 'Campanha A' },
          { key: 'conversaoA', label: 'Conversão A' },
          { key: 'campanhaB', label: 'Campanha B' },
          { key: 'conversaoB', label: 'Conversão B' },
          { key: 'vencedora', label: 'Vencedora' },
          { key: 'conclusao', label: 'Conclusão' }
        ],
        dados: testesPorConversao
      },

      insights: {
        titulo: 'Detalhamento dos insights estratégicos',
        descricao: 'Insights gerados para orientar ações comerciais e de campanha.',
        nomeArquivo: 'detalhamento_insights_estrategicos.csv',
        colunas: [
          { key: 'tipo', label: 'Tipo' },
          { key: 'titulo', label: 'Título' },
          { key: 'prioridade', label: 'Prioridade' },
          { key: 'mensagem', label: 'Mensagem' },
          { key: 'acaoSugerida', label: 'Ação sugerida' }
        ],
        dados: insights
      }
    };
  }, [sugestoes, sugestoesAltaPrioridade, sugestoesPorRoi, testesPorConversao, insights]);

  const detalheSelecionado = detalheAtivo ? detalhes[detalheAtivo] : null;

  const abrirDetalhe = (tipo) => {
    setDetalheAtivo(tipo);

    setTimeout(() => {
      const elemento = document.getElementById('detalhamento-kpi');

      if (elemento) {
        elemento.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
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
                Recomendações
              </h1>

              <p
                className="text-sm text-gray-500 mt-2 max-w-3xl leading-relaxed"
                style={fontePoppins}
              >
                {isEmpresa
                  ? 'Sugestões estratégicas de campanha baseadas nos dados da sua empresa.'
                  : 'Sugestões estratégicas de campanha com justificativa baseada em dados, ROI simulado, intervalo de confiança e teste A/B simulado.'}
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
              {loading ? 'Atualizando...' : 'Atualizar recomendações'}
            </button>
          </header>

          {loading && (
            <section className="bg-white rounded-2xl p-6 sm:p-8 border border-orange/10">
              Carregando recomendações...
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
                    ? 'Use estes filtros para recalcular apenas as recomendações da sua empresa.'
                    : 'Use estes filtros para recalcular as recomendações exibidas nesta visão.'
                }
              />

              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6">
                <CardResumo
                  titulo="Total de recomendações"
                  valor={formatarNumero(resumo.totalRecomendacoes)}
                  descricao="Sugestões geradas por regras analíticas"
                  onClick={() => abrirDetalhe('totalRecomendacoes')}
                />

                <CardResumo
                  titulo="Alta prioridade"
                  valor={formatarNumero(resumo.altaPrioridade)}
                  descricao="Ações críticas para atenção imediata"
                  onClick={() => abrirDetalhe('altaPrioridade')}
                />

                <CardResumo
                  titulo="ROI médio simulado"
                  valor={formatarPercentual(resumo.roiMedioSimulado)}
                  descricao="Retorno estimado das recomendações"
                  onClick={() => abrirDetalhe('roiMedio')}
                />

                <CardResumo
                  titulo="Melhor conversão"
                  valor={formatarPercentual(resumo.melhorConversao)}
                  descricao="Maior conversão identificada nas campanhas"
                  onClick={() => abrirDetalhe('melhorConversao')}
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
                    <table className="w-full min-w-[1050px] text-sm">
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

              <section className="grid grid-cols-1 2xl:grid-cols-3 gap-5 sm:gap-6 mb-6">
                <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm 2xl:col-span-2 min-w-0">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold">
                        Sugestões de campanha
                      </h2>

                      <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        Recomendações priorizadas com base em recorrência, ticket médio,
                        conversão, receita e performance histórica.
                      </p>
                    </div>

                    <span className="w-fit text-xs bg-orange/10 text-orange font-semibold px-3 py-2 rounded-full whitespace-nowrap">
                      {formatarNumero(sugestoes.length)} sugestões
                    </span>
                  </div>

                  <div className="space-y-4">
                    {sugestoes.map((item, index) => (
                      <div
                        key={`${item.empresa}-${item.tipo}-${index}`}
                        className="rounded-2xl border border-orange/10 bg-orange/5 p-4 sm:p-5 min-w-0"
                      >
                        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-4">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <PrioridadeBadge prioridade={item.prioridade} />
                              <TipoBadge tipo={item.tipo} />
                            </div>

                            <h3 className="text-base sm:text-lg font-bold text-text-dark leading-snug break-words">
                              {item.campanhaRecomendada}
                            </h3>

                            <p className="text-sm text-gray-500 mt-1 break-words">
                              Empresa: <strong>{item.empresa}</strong>
                            </p>

                            {item.campanhaReferencia && (
                              <p className="text-xs text-gray-400 mt-1 break-words">
                                Campanha referência: {item.campanhaReferencia}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full xl:w-[280px] shrink-0">
                            <div className="rounded-xl bg-white border border-orange/10 p-3 min-w-0">
                              <p className="text-xs text-gray-500">ROI simulado</p>
                              <p className="font-bold text-orange mt-1 break-words">
                                {formatarPercentual(item.roiSimulado)}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white border border-orange/10 p-3 min-w-0">
                              <p className="text-xs text-gray-500">Receita potencial</p>
                              <p className="font-bold text-orange mt-1 break-words">
                                {formatarMoeda(item.receitaPotencial)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                              Justificativa
                            </p>

                            <p className="text-sm text-gray-700 mt-2 leading-relaxed break-words">
                              {item.justificativa}
                            </p>
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                              Ação sugerida
                            </p>

                            <p className="text-sm text-gray-700 mt-2 leading-relaxed break-words">
                              {item.acaoSugerida}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">
                          <div className="rounded-xl bg-white border border-orange/10 p-3 min-w-0">
                            <p className="text-xs text-gray-500">Métrica base</p>
                            <p className="font-semibold mt-1 break-words">
                              {item.metricaBase || '-'}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white border border-orange/10 p-3 min-w-0">
                            <p className="text-xs text-gray-500">Valor da métrica</p>
                            <p className="font-semibold mt-1 break-words">
                              {typeof item.valorMetrica === 'number'
                                ? formatarPercentual(item.valorMetrica)
                                : item.valorMetrica || '-'}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white border border-orange/10 p-3 min-w-0 sm:col-span-2 xl:col-span-1">
                            <p className="text-xs text-gray-500">IC 95%</p>
                            <p className="font-semibold mt-1 break-words">
                              {formatarPercentual(item.intervaloConfianca95?.inferior)} a{' '}
                              {formatarPercentual(item.intervaloConfianca95?.superior)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {sugestoes.length === 0 && (
                      <p className="text-sm text-gray-500">
                        Nenhuma recomendação encontrada para a visão atual.
                      </p>
                    )}
                  </div>
                </div>

                <aside className="space-y-5 sm:space-y-6 min-w-0">
                  <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold mb-4">
                      Prioridades críticas
                    </h2>

                    <div className="space-y-3">
                      {sugestoesAltaPrioridade.slice(0, 6).map((item, index) => (
                        <div
                          key={`${item.empresa}-${index}`}
                          className="rounded-xl bg-red-50 border border-red-100 p-4 min-w-0"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <p className="font-bold text-sm break-words">
                              {item.empresa}
                            </p>

                            <PrioridadeBadge prioridade={item.prioridade} />
                          </div>

                          <p className="text-xs text-red-700 mt-2 break-words">
                            {item.campanhaRecomendada}
                          </p>
                        </div>
                      ))}

                      {sugestoesAltaPrioridade.length === 0 && (
                        <p className="text-sm text-gray-500">
                          Nenhuma recomendação de alta prioridade.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm">
                    <h2 className="text-lg sm:text-xl font-bold mb-4">
                      Insights estratégicos
                    </h2>

                    <div className="space-y-3">
                      {insights.map((insight, index) => (
                        <div
                          key={`${insight.tipo}-${index}`}
                          className="rounded-xl bg-gray-50 border border-gray-100 p-4 min-w-0"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <p className="font-bold text-sm break-words">
                              {insight.titulo}
                            </p>

                            <PrioridadeBadge prioridade={insight.prioridade} />
                          </div>

                          <p className="text-sm text-gray-600 mt-2 leading-relaxed break-words">
                            {insight.mensagem}
                          </p>

                          <p className="text-xs text-orange font-semibold mt-2 break-words">
                            {insight.acaoSugerida}
                          </p>
                        </div>
                      ))}

                      {insights.length === 0 && (
                        <p className="text-sm text-gray-500">
                          Nenhum insight estratégico gerado.
                        </p>
                      )}
                    </div>
                  </div>
                </aside>
              </section>

              <section className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
                  <div className="min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold">
                      Teste A/B simulado
                    </h2>

                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      Comparativo inferencial simples entre campanhas com base em mensagens,
                      pedidos convertidos, conversão e intervalo de confiança.
                    </p>
                  </div>

                  <span className="w-fit text-xs bg-orange/10 text-orange font-semibold px-3 py-2 rounded-full whitespace-nowrap">
                    {formatarNumero(resumo.totalTestesAB)} teste(s)
                  </span>
                </div>

                <div className="space-y-4">
                  {testesAB.map((teste, index) => (
                    <div
                      key={`${teste.campanhaA}-${teste.campanhaB}-${index}`}
                      className="rounded-2xl border border-orange/10 p-4 sm:p-5 min-w-0"
                    >
                      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
                        <div className="min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-text-dark leading-snug break-words">
                            {teste.campanhaA} vs {teste.campanhaB}
                          </h3>

                          <p className="text-sm text-gray-500 mt-1 break-words">
                            Empresa: {teste.empresa}
                          </p>
                        </div>

                        <div className="rounded-xl bg-green-100 border border-green-200 px-4 py-3 w-full sm:w-fit shrink-0">
                          <p className="text-xs text-green-700">Vencedora simulada</p>
                          <p className="font-bold text-green-800 mt-1 break-words">
                            {teste.vencedora}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 sm:p-5 min-w-0">
                          <h4 className="font-bold mb-3">
                            Campanha A
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Mensagens</p>
                              <p className="font-semibold break-words">{formatarNumero(teste.mensagensA)}</p>
                            </div>

                            <div>
                              <p className="text-gray-500">Pedidos</p>
                              <p className="font-semibold break-words">{formatarNumero(teste.pedidosA)}</p>
                            </div>

                            <div>
                              <p className="text-gray-500">Conversão</p>
                              <p className="font-semibold break-words">{formatarPercentual(teste.conversaoA)}</p>
                            </div>

                            <div>
                              <p className="text-gray-500">IC 95%</p>
                              <p className="font-semibold break-words">
                                {formatarPercentual(teste.intervaloConfiancaA95?.inferior)} a{' '}
                                {formatarPercentual(teste.intervaloConfiancaA95?.superior)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 sm:p-5 min-w-0">
                          <h4 className="font-bold mb-3">
                            Campanha B
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Mensagens</p>
                              <p className="font-semibold break-words">{formatarNumero(teste.mensagensB)}</p>
                            </div>

                            <div>
                              <p className="text-gray-500">Pedidos</p>
                              <p className="font-semibold break-words">{formatarNumero(teste.pedidosB)}</p>
                            </div>

                            <div>
                              <p className="text-gray-500">Conversão</p>
                              <p className="font-semibold break-words">{formatarPercentual(teste.conversaoB)}</p>
                            </div>

                            <div>
                              <p className="text-gray-500">IC 95%</p>
                              <p className="font-semibold break-words">
                                {formatarPercentual(teste.intervaloConfiancaB95?.inferior)} a{' '}
                                {formatarPercentual(teste.intervaloConfiancaB95?.superior)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mt-4 leading-relaxed break-words">
                        {teste.conclusao}
                      </p>
                    </div>
                  ))}

                  {testesAB.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Não há volume suficiente para gerar teste A/B simulado na visão atual.
                    </p>
                  )}
                </div>
              </section>

              <section className="bg-white rounded-2xl p-5 sm:p-6 border border-orange/10 shadow-sm">
                <h2 className="text-lg sm:text-xl font-bold mb-4">
                  Detalhamento das recomendações
                </h2>

                <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
                  <table className="w-full min-w-[1050px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-3 pr-4">Empresa</th>
                        <th className="py-3 pr-4">Tipo</th>
                        <th className="py-3 pr-4">Prioridade</th>
                        <th className="py-3 pr-4">Campanha recomendada</th>
                        <th className="py-3 pr-4">Métrica</th>
                        <th className="py-3 pr-4">Valor</th>
                        <th className="py-3 pr-4">ROI simulado</th>
                        <th className="py-3 pr-4">Receita potencial</th>
                      </tr>
                    </thead>

                    <tbody>
                      {sugestoes.map((item, index) => (
                        <tr key={`${item.empresa}-${item.tipo}-${index}`} className="border-b last:border-b-0">
                          <td className="py-3 pr-4 font-medium">
                            {item.empresa}
                          </td>

                          <td className="py-3 pr-4">
                            <TipoBadge tipo={item.tipo} />
                          </td>

                          <td className="py-3 pr-4">
                            <PrioridadeBadge prioridade={item.prioridade} />
                          </td>

                          <td className="py-3 pr-4">
                            {item.campanhaRecomendada}
                          </td>

                          <td className="py-3 pr-4">
                            {item.metricaBase || '-'}
                          </td>

                          <td className="py-3 pr-4">
                            {typeof item.valorMetrica === 'number'
                              ? formatarPercentual(item.valorMetrica)
                              : item.valorMetrica || '-'}
                          </td>

                          <td className="py-3 pr-4 font-semibold text-orange">
                            {formatarPercentual(item.roiSimulado)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarMoeda(item.receitaPotencial)}
                          </td>
                        </tr>
                      ))}

                      {sugestoes.length === 0 && (
                        <tr>
                          <td colSpan="8" className="py-6 text-center text-gray-500">
                            Nenhuma recomendação encontrada.
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

export default Recomendacoes;