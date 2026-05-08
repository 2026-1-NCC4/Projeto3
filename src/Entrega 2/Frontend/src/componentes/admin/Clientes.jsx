import React, { useEffect, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
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
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${classe}`}>
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

  const clientes = dashboard?.clientes || {};
  const segmentacao = clientes.segmentacao || {};
  const clientesPorEstado = clientes.clientesPorEstado || [];
  const clientesNovosPorMes = clientes.clientesNovosPorMes || [];

  const rfm = clientes.rfm || {};
  const resumoRfm = rfm.resumo || {};
  const segmentosRfm = rfm.segmentos || [];
  const topClientes = rfm.topClientes || [];
  const coortes = clientes.coortes || [];

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
                Clientes
              </h1>

              <p className="text-sm text-gray-500 mt-2 max-w-3xl">
                Segmentação global de clientes, recorrência, RFM simplificado,
                coortes de retenção e distribuição geográfica.
              </p>
            </div>

            <button
              type="button"
              onClick={() => carregarDados({ filtrosAplicados: filtrosRef.current })}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-50"
            >
              {loading ? 'Atualizando...' : 'Atualizar clientes'}
            </button>
          </header>

          {loading && (
            <section className="bg-white rounded-2xl p-8 border border-orange/10">
              Carregando clientes...
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
                descricao="Use estes filtros para recalcular os dados exibidos em clientes."
              />

              <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <CardResumo
                  titulo="Clientes com pedido"
                  valor={formatarNumero(segmentacao.comPedido)}
                  descricao="Clientes que já compraram"
                />

                <CardResumo
                  titulo="Clientes ativos"
                  valor={formatarNumero(segmentacao.ativos)}
                  descricao="Compraram recentemente"
                />

                <CardResumo
                  titulo="Clientes inativos"
                  valor={formatarNumero(segmentacao.inativos)}
                  descricao="Sem compra recente"
                />

                <CardResumo
                  titulo="Taxa de recorrência"
                  valor={formatarPercentual(segmentacao.taxaRecorrencia)}
                  descricao="Clientes com mais de uma compra"
                />
              </section>

              <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <CardResumo
                  titulo="Recorrentes"
                  valor={formatarNumero(segmentacao.recorrentes)}
                  descricao="Clientes com 2 ou mais pedidos"
                />

                <CardResumo
                  titulo="Ocasionais"
                  valor={formatarNumero(segmentacao.ocasionais)}
                  descricao="Clientes com apenas 1 pedido"
                />

                <CardResumo
                  titulo="Sem pedido"
                  valor={formatarNumero(segmentacao.semPedido)}
                  descricao="Clientes cadastrados sem compra"
                />
              </section>

              <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <CardResumo
                  titulo="Clientes analisados no RFM"
                  valor={formatarNumero(resumoRfm.totalClientesAnalisados)}
                  descricao="Base com histórico de pedidos"
                />

                <CardResumo
                  titulo="Campeões"
                  valor={formatarNumero(resumoRfm.campeoes)}
                  descricao="Alta frequência, valor e recência"
                />

                <CardResumo
                  titulo="Clientes em risco"
                  valor={formatarNumero(resumoRfm.emRisco)}
                  descricao="Clientes com queda de atividade"
                />

                <CardResumo
                  titulo="Ticket médio RFM"
                  valor={formatarMoeda(resumoRfm.ticketMedioRfm)}
                  descricao="Média dos clientes analisados"
                />
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">
                    Clientes novos por mês
                  </h2>

                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={clientesNovosPorMes}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => formatarNumero(value)} />
                        <Bar dataKey="clientes" fill="#f26322" radius={[10, 10, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">
                    Segmentos RFM
                  </h2>

                  <div className="space-y-3">
                    {segmentosRfm.map((item, index) => (
                      <div
                        key={`${item.segmento}-${index}`}
                        className="rounded-xl bg-orange/5 border border-orange/10 p-4 flex items-center justify-between gap-4"
                      >
                        <div>
                          <SegmentoBadge segmento={item.segmento} />
                          <p className="text-xs text-gray-500 mt-2">
                            {item.descricao}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-orange">
                            {formatarNumero(item.clientes)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatarPercentual(item.percentual)}
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

              <section className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      Top clientes por score RFM
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Clientes classificados por recência, frequência e valor monetário.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-3 pr-4">Cliente</th>
                        <th className="py-3 pr-4">Segmento</th>
                        <th className="py-3 pr-4">Última compra</th>
                        <th className="py-3 pr-4">Pedidos</th>
                        <th className="py-3 pr-4">Valor total</th>
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
                            {cliente.diasDesdeUltimaCompra} dias
                          </td>

                          <td className="py-3 pr-4">
                            {formatarNumero(cliente.frequencia)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarMoeda(cliente.valorTotal)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarMoeda(cliente.ticketMedio)}
                          </td>

                          <td className="py-3 pr-4 font-bold text-orange">
                            {formatarNumero(cliente.scoreRfm)}
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

              <section className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      Coortes de retenção mensal
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Retenção de clientes agrupados pelo mês da primeira compra.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-500">
                        <th className="py-3 pr-4">Coorte</th>
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
                        <tr key={`${coorte.cohort}-${index}`} className="border-b last:border-b-0">
                          <td className="py-3 pr-4 font-medium">
                            {coorte.cohort}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarPercentual(coorte.mes0)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarPercentual(coorte.mes1)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarPercentual(coorte.mes2)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarPercentual(coorte.mes3)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarPercentual(coorte.mes4)}
                          </td>

                          <td className="py-3 pr-4">
                            {formatarPercentual(coorte.mes5)}
                          </td>
                        </tr>
                      ))}

                      {coortes.length === 0 && (
                        <tr>
                          <td colSpan="7" className="py-6 text-center text-gray-500">
                            Nenhuma coorte encontrada para a visão atual.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">
                    Clientes por estado
                  </h2>

                  <div className="space-y-3">
                    {clientesPorEstado.map((item, index) => (
                      <div
                        key={`${item.estado}-${index}`}
                        className="rounded-xl bg-orange/5 border border-orange/10 p-4 flex items-center justify-between"
                      >
                        <p className="font-bold">{item.estado}</p>

                        <span className="text-sm text-orange font-bold">
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

                <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">
                    Leitura estratégica
                  </h2>

                  <div className="space-y-3">
                    <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                      <p className="font-bold text-green-700">
                        Clientes campeões
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        Representam clientes de alto valor, alta frequência e compra recente.
                      </p>
                    </div>

                    <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-4">
                      <p className="font-bold text-yellow-700">
                        Clientes em risco
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Devem ser priorizados em campanhas de reativação e cupons de retorno.
                      </p>
                    </div>

                    <div className="rounded-xl bg-orange/5 border border-orange/10 p-4">
                      <p className="font-bold text-orange">
                        Potenciais
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
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