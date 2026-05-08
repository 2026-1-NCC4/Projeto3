import React, { useEffect, useRef, useState } from 'react';
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

  const financeiro = dashboard?.financeiro || {};

  const receitaPorMes = financeiro.receitaPorMes || [];
  const ticketMedioPorMes = financeiro.ticketMedioPorMes || [];
  const pedidosPorTipo = financeiro.pedidosPorTipo || [];
  const canais = financeiro.performanceCanais || [];

  const resultadoPorMes = financeiro.resultadoPorMes || [];
  const resultadoPorCanal = financeiro.resultadoPorCanal || [];
  const resultadoPorTipoPedido = financeiro.resultadoPorTipoPedido || [];
  const alertasFinanceiros = financeiro.alertasFinanceiros || [];

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
                Financeiro
              </h1>

              <p className="text-sm text-gray-500 mt-2 max-w-3xl">
                Painel financeiro com receita bruta, receita líquida simulada,
                custos variáveis, margem, caixa estimado, canais e alertas financeiros.
              </p>
            </div>

            <button
              type="button"
              onClick={() => carregarDados({ filtrosAplicados: filtrosRef.current })}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-50"
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
                titulo="Filtros da aba"
                descricao="Use estes filtros para recalcular os dados exibidos em financeiro."
              />

              <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <CardResumo
                  titulo="Receita bruta"
                  valor={formatarMoeda(financeiro.receitaBruta ?? financeiro.receitaTotal)}
                  descricao="Receita total antes dos descontos"
                />

                <CardResumo
                  titulo="Receita líquida"
                  valor={formatarMoeda(financeiro.receitaLiquida)}
                  descricao="Receita após descontos simulados"
                />

                <CardResumo
                  titulo="Custos variáveis"
                  valor={formatarMoeda(financeiro.custosVariaveis)}
                  descricao={`Simulação: ${formatarPercentual(financeiro.percentualCustoVariavel)} da receita líquida`}
                />

                <CardResumo
                  titulo="Margem bruta"
                  valor={formatarMoeda(financeiro.margemBruta)}
                  descricao={`Margem: ${formatarPercentual(financeiro.margemPercentual)}`}
                />
              </section>

              <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <CardResumo
                  titulo="Caixa estimado"
                  valor={formatarMoeda(financeiro.caixaEstimado)}
                  descricao={`Reserva simulada: ${formatarPercentual(financeiro.percentualReservaCaixa)}`}
                />

                <CardResumo
                  titulo="Ticket médio"
                  valor={formatarMoeda(financeiro.ticketMedio)}
                  descricao="Média por pedido"
                />

                <CardResumo
                  titulo="Descontos totais"
                  valor={formatarMoeda(financeiro.descontosTotal)}
                  descricao="Total de descontos aplicados"
                />

                <CardResumo
                  titulo="Taxa média de desconto"
                  valor={formatarPercentual(financeiro.taxaDescontoMedia)}
                  descricao="Descontos sobre subtotal"
                />
              </section>

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