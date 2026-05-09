import React, { useMemo } from 'react';
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

import CardGrafico from '../CardGrafico';
import StatusBadge from '../StatusBadge';
import TooltipSerieTemporal from '../TooltipSerieTemporal';

import { CORES_GRAFICOS } from '../constants/dashboardConstants';
import {
  formatarMoeda,
  formatarNumero,
  formatarPercentual
} from '../utils/formatters';
import { prepararSerieComparativa } from '../utils/dashboardHelpers';

const cores = CORES_GRAFICOS || [
  '#f26322',
  '#ff8a4c',
  '#ffb088',
  '#ffd2bd',
  '#f7a072',
  '#d9480f'
];

const DashboardConteudoSection = ({
  dashboard,
  graficos,
  segmentacao,
  empresasRisco,
  isPainelCannoli,
  abrirDetalhe
}) => {
  const serieReceitaComparativa = useMemo(() => {
    return prepararSerieComparativa(graficos.receitaPorMes || [], 'receita');
  }, [graficos.receitaPorMes]);

  return (
    <>
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

              <ReferenceLine
                yAxisId="percentual"
                y={0}
                stroke="#999"
                strokeDasharray="3 3"
              />

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
          titulo="Ticket médio por mês"
          descricao="Evolução mensal do ticket médio dentro da visão atual."
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graficos.ticketMedioPorMes || []}>
              <defs>
                <linearGradient id="ticketMedioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f26322" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f26322" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />

              <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />

              <YAxis
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => formatarMoeda(value)}
              />

              <Tooltip formatter={(value) => formatarMoeda(value)} />
              <Legend />

              <Area
                type="monotone"
                dataKey="ticketMedio"
                name="Ticket médio"
                stroke="#f26322"
                strokeWidth={3}
                fill="url(#ticketMedioGradient)"
                dot={{ r: 4 }}
              />
            </AreaChart>
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
            <button
              type="button"
              onClick={() => abrirDetalhe('clientesAtivos')}
              className="rounded-2xl bg-orange/5 p-5 text-left"
            >
              <p className="text-sm text-gray-500">Ativos</p>
              <h3 className="text-2xl font-bold mt-1">
                {formatarNumero(segmentacao.ativos)}
              </h3>
            </button>

            <button
              type="button"
              onClick={() => abrirDetalhe('clientesInativos')}
              className="rounded-2xl bg-orange/5 p-5 text-left"
            >
              <p className="text-sm text-gray-500">Inativos</p>
              <h3 className="text-2xl font-bold mt-1">
                {formatarNumero(segmentacao.inativos)}
              </h3>
            </button>

            <button
              type="button"
              onClick={() => abrirDetalhe('recorrencia')}
              className="rounded-2xl bg-orange/5 p-5 text-left"
            >
              <p className="text-sm text-gray-500">Recorrentes</p>
              <h3 className="text-2xl font-bold mt-1">
                {formatarNumero(segmentacao.recorrentes)}
              </h3>
            </button>

            <button
              type="button"
              onClick={() => abrirDetalhe('clientes')}
              className="rounded-2xl bg-orange/5 p-5 text-left"
            >
              <p className="text-sm text-gray-500">Ocasionais</p>
              <h3 className="text-2xl font-bold mt-1">
                {formatarNumero(segmentacao.ocasionais)}
              </h3>
            </button>

            <button
              type="button"
              onClick={() => abrirDetalhe('clientes')}
              className="rounded-2xl bg-orange/5 p-5 text-left"
            >
              <p className="text-sm text-gray-500">Sem pedido</p>
              <h3 className="text-2xl font-bold mt-1">
                {formatarNumero(segmentacao.semPedido)}
              </h3>
            </button>

            <button
              type="button"
              onClick={() => abrirDetalhe('clientes')}
              className="rounded-2xl bg-orange/5 p-5 text-left"
            >
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
                    <Cell
                      key={entry.canal}
                      fill={cores[index % cores.length]}
                    />
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

                  <span className="text-gray-600">
                    {canal.canal}
                  </span>
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
              {isPainelCannoli ? 'Top empresas por receita' : 'Receita da empresa'}
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

                <Bar
                  dataKey="receita"
                  radius={[0, 10, 10, 0]}
                  fill="#f26322"
                />
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

                {(!dashboard.rankingEmpresas || dashboard.rankingEmpresas.length === 0) && (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-gray-500">
                      Nenhuma empresa encontrada.
                    </td>
                  </tr>
                )}
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
  );
};

export default DashboardConteudoSection;