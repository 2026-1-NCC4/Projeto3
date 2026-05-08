import React, { useEffect, useRef, useState } from 'react';
import Sidebar from '../dashboard/Sidebar';
import { buscarAdminDashboard } from './services/adminDashboardService';
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
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${classe}`}>
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
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange/10 text-orange border border-orange/20">
      {labels[tipo] || tipo || 'Recomendação'}
    </span>
  );
};

const CardResumo = ({ titulo, valor, descricao }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
      <p className="text-sm text-gray-500">{titulo}</p>

      <h2 className="text-3xl font-bold mt-2 text-text-dark">
        {valor}
      </h2>

      {descricao && (
        <p className="text-xs text-gray-400 mt-2">
          {descricao}
        </p>
      )}
    </div>
  );
};

const Recomendacoes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [filtros, setFiltros] = useState(FILTROS_PADRAO);

  const filtrosRef = useRef(FILTROS_PADRAO);

  useEffect(() => {
    filtrosRef.current = filtros;
  }, [filtros]);

  const carregarDados = async ({ filtrosAplicados = filtrosRef.current } = {}) => {
    try {
      setLoading(true);
      setErro('');

      const data = await buscarAdminDashboard(filtrosAplicados);
      setDashboard(data);
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    filtrosRef.current = filtros;
    carregarDados({ filtrosAplicados: filtros });
  };

  const limparFiltros = () => {
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
          <header className="mb-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-dark">
                Recomendações
              </h1>

              <p className="text-sm text-gray-500 mt-2 max-w-3xl">
                Sugestões estratégicas de campanha com justificativa baseada em dados,
                ROI simulado, intervalo de confiança e teste A/B simulado.
              </p>
            </div>

            <button
              type="button"
              onClick={() => carregarDados({ filtrosAplicados: filtrosRef.current })}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-50"
            >
              {loading ? 'Atualizando...' : 'Atualizar recomendações'}
            </button>
          </header>

          {loading && (
            <section className="bg-white rounded-2xl p-8 border border-orange/10">
              Carregando recomendações...
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
                titulo="Filtros da aba"
                descricao="Use estes filtros para recalcular as recomendações exibidas nesta visão."
              />

              <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <CardResumo
                  titulo="Total de recomendações"
                  valor={formatarNumero(resumo.totalRecomendacoes)}
                  descricao="Sugestões geradas por regras analíticas"
                />

                <CardResumo
                  titulo="Alta prioridade"
                  valor={formatarNumero(resumo.altaPrioridade)}
                  descricao="Ações críticas para atenção imediata"
                />

                <CardResumo
                  titulo="ROI médio simulado"
                  valor={formatarPercentual(resumo.roiMedioSimulado)}
                  descricao="Retorno estimado das recomendações"
                />

                <CardResumo
                  titulo="Melhor conversão"
                  valor={formatarPercentual(resumo.melhorConversao)}
                  descricao="Maior conversão identificada nas campanhas"
                />
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm xl:col-span-2">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
                    <div>
                      <h2 className="text-xl font-bold">
                        Sugestões de campanha
                      </h2>

                      <p className="text-sm text-gray-500 mt-1">
                        Recomendações priorizadas com base em recorrência, ticket médio,
                        conversão, receita e performance histórica.
                      </p>
                    </div>

                    <span className="text-xs bg-orange/10 text-orange font-semibold px-3 py-2 rounded-full">
                      {formatarNumero(sugestoes.length)} sugestões
                    </span>
                  </div>

                  <div className="space-y-4">
                    {sugestoes.map((item, index) => (
                      <div
                        key={`${item.empresa}-${item.tipo}-${index}`}
                        className="rounded-2xl border border-orange/10 bg-orange/5 p-5"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <PrioridadeBadge prioridade={item.prioridade} />
                              <TipoBadge tipo={item.tipo} />
                            </div>

                            <h3 className="text-lg font-bold text-text-dark">
                              {item.campanhaRecomendada}
                            </h3>

                            <p className="text-sm text-gray-500 mt-1">
                              Empresa: <strong>{item.empresa}</strong>
                            </p>

                            {item.campanhaReferencia && (
                              <p className="text-xs text-gray-400 mt-1">
                                Campanha referência: {item.campanhaReferencia}
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3 min-w-[240px]">
                            <div className="rounded-xl bg-white border border-orange/10 p-3">
                              <p className="text-xs text-gray-500">ROI simulado</p>
                              <p className="font-bold text-orange mt-1">
                                {formatarPercentual(item.roiSimulado)}
                              </p>
                            </div>

                            <div className="rounded-xl bg-white border border-orange/10 p-3">
                              <p className="text-xs text-gray-500">Receita potencial</p>
                              <p className="font-bold text-orange mt-1">
                                {formatarMoeda(item.receitaPotencial)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                              Justificativa
                            </p>

                            <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                              {item.justificativa}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                              Ação sugerida
                            </p>

                            <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                              {item.acaoSugerida}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                          <div className="rounded-xl bg-white border border-orange/10 p-3">
                            <p className="text-xs text-gray-500">Métrica base</p>
                            <p className="font-semibold mt-1">
                              {item.metricaBase || '-'}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white border border-orange/10 p-3">
                            <p className="text-xs text-gray-500">Valor da métrica</p>
                            <p className="font-semibold mt-1">
                              {typeof item.valorMetrica === 'number'
                                ? formatarPercentual(item.valorMetrica)
                                : item.valorMetrica || '-'}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white border border-orange/10 p-3">
                            <p className="text-xs text-gray-500">IC 95%</p>
                            <p className="font-semibold mt-1">
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

                <aside className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">
                      Prioridades críticas
                    </h2>

                    <div className="space-y-3">
                      {sugestoesAltaPrioridade.slice(0, 6).map((item, index) => (
                        <div
                          key={`${item.empresa}-${index}`}
                          className="rounded-xl bg-red-50 border border-red-100 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-bold text-sm">
                              {item.empresa}
                            </p>

                            <PrioridadeBadge prioridade={item.prioridade} />
                          </div>

                          <p className="text-xs text-red-700 mt-2">
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

                  <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                    <h2 className="text-xl font-bold mb-4">
                      Insights estratégicos
                    </h2>

                    <div className="space-y-3">
                      {insights.map((insight, index) => (
                        <div
                          key={`${insight.tipo}-${index}`}
                          className="rounded-xl bg-gray-50 border border-gray-100 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-bold text-sm">
                              {insight.titulo}
                            </p>

                            <PrioridadeBadge prioridade={insight.prioridade} />
                          </div>

                          <p className="text-sm text-gray-600 mt-2">
                            {insight.mensagem}
                          </p>

                          <p className="text-xs text-orange font-semibold mt-2">
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

              <section className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5">
                  <div>
                    <h2 className="text-xl font-bold">
                      Teste A/B simulado
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Comparativo inferencial simples entre campanhas com base em mensagens,
                      pedidos convertidos, conversão e intervalo de confiança.
                    </p>
                  </div>

                  <span className="text-xs bg-orange/10 text-orange font-semibold px-3 py-2 rounded-full">
                    {formatarNumero(resumo.totalTestesAB)} teste(s)
                  </span>
                </div>

                <div className="space-y-4">
                  {testesAB.map((teste, index) => (
                    <div
                      key={`${teste.campanhaA}-${teste.campanhaB}-${index}`}
                      className="rounded-2xl border border-orange/10 p-5"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                        <div>
                          <h3 className="text-lg font-bold text-text-dark">
                            {teste.campanhaA} vs {teste.campanhaB}
                          </h3>

                          <p className="text-sm text-gray-500 mt-1">
                            Empresa: {teste.empresa}
                          </p>
                        </div>

                        <div className="rounded-xl bg-green-100 border border-green-200 px-4 py-3">
                          <p className="text-xs text-green-700">Vencedora simulada</p>
                          <p className="font-bold text-green-800 mt-1">
                            {teste.vencedora}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                          <h4 className="font-bold mb-3">
                            Campanha A
                          </h4>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Mensagens</p>
                              <p className="font-semibold">{formatarNumero(teste.mensagensA)}</p>
                            </div>

                            <div>
                              <p className="text-gray-500">Pedidos</p>
                              <p className="font-semibold">{formatarNumero(teste.pedidosA)}</p>
                            </div>

                            <div>
                              <p className="text-gray-500">Conversão</p>
                              <p className="font-semibold">{formatarPercentual(teste.conversaoA)}</p>
                            </div>

                            <div>
                              <p className="text-gray-500">IC 95%</p>
                              <p className="font-semibold">
                                {formatarPercentual(teste.intervaloConfiancaA95?.inferior)} a{' '}
                                {formatarPercentual(teste.intervaloConfiancaA95?.superior)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-5">
                          <h4 className="font-bold mb-3">
                            Campanha B
                          </h4>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-gray-500">Mensagens</p>
                              <p className="font-semibold">{formatarNumero(teste.mensagensB)}</p>
                            </div>

                            <div>
                              <p className="text-gray-500">Pedidos</p>
                              <p className="font-semibold">{formatarNumero(teste.pedidosB)}</p>
                            </div>

                            <div>
                              <p className="text-gray-500">Conversão</p>
                              <p className="font-semibold">{formatarPercentual(teste.conversaoB)}</p>
                            </div>

                            <div>
                              <p className="text-gray-500">IC 95%</p>
                              <p className="font-semibold">
                                {formatarPercentual(teste.intervaloConfiancaB95?.inferior)} a{' '}
                                {formatarPercentual(teste.intervaloConfiancaB95?.superior)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mt-4">
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

              <section className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                <h2 className="text-xl font-bold mb-4">
                  Detalhamento das recomendações
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
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