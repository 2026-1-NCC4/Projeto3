import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    <div className="bg-white rounded-xl shadow-lg border border-orange/10 p-3">
      {label && (
        <p className="text-sm font-bold text-text-dark mb-2">
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
          <p key={index} className="text-xs text-gray-600">
            <strong>{item.name || item.dataKey}:</strong> {valorFormatado}
          </p>
        );
      })}
    </div>
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

const CardGrafico = ({ titulo, descricao, children }) => {
  return (
    <section className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
      <div className="mb-5">
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

  const totalClientesImpactados = mensagensPorCampanhaEmpresa.reduce(
    (acc, item) => acc + Number(item.clientes || 0),
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
                Campanhas
              </h1>

              <p className="text-sm text-gray-500 mt-2">
                Performance global das campanhas, pedidos gerados, conversão e templates utilizados.
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="px-3 py-1 rounded-full bg-orange/10 text-orange text-xs font-semibold">
                  Atualização automática a cada 1 hora
                </span>

                {ultimaAtualizacao && (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    Última atualização: {ultimaAtualizacao.toLocaleString('pt-BR')}
                  </span>
                )}

                {atualizando && (
                  <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
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
              className="px-5 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-60"
            >
              Atualizar agora
            </button>
          </header>

          {loading && (
            <section className="bg-white rounded-2xl p-8 border border-orange/10">
              Carregando campanhas...
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
                loading={loading || atualizando}
                titulo="Filtros da aba"
                descricao="Use estes filtros para recalcular os dados exibidos em campanhas."
              />

              <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <CardResumo
                  titulo="Total de campanhas"
                  valor={formatarNumero(campanhas.totalCampanhas)}
                  descricao="Campanhas cadastradas/processadas"
                />

                <CardResumo
                  titulo="Receita por campanhas"
                  valor={formatarMoeda(campanhas.receitaCampanhas)}
                  descricao="Receita vinculada às campanhas"
                />

                <CardResumo
                  titulo="Pedidos gerados"
                  valor={formatarNumero(campanhas.pedidosGerados)}
                  descricao="Pedidos associados às campanhas"
                />

                <CardResumo
                  titulo="Conversão média"
                  valor={formatarPercentual(campanhas.conversaoMedia)}
                  descricao="Pedidos / mensagens"
                />
              </section>

              <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
                <CardResumo
                  titulo="Mensagens por campanha/empresa"
                  valor={formatarNumero(totalMensagensPorCampanhaEmpresa)}
                  descricao="Total do indicador obrigatório"
                />

                <CardResumo
                  titulo="Pedidos convertidos"
                  valor={formatarNumero(totalPedidosConvertidosPorCampanhaEmpresa)}
                  descricao="Pedidos convertidos por campanha/empresa"
                />

                <CardResumo
                  titulo="Receita convertida"
                  valor={formatarMoeda(totalReceitaCampanhaEmpresa)}
                  descricao="Receita das campanhas por empresa"
                />

                <CardResumo
                  titulo="Conversão obrigatória"
                  valor={formatarPercentual(conversaoObrigatoria)}
                  descricao="Pedidos convertidos / mensagens"
                />
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <CardGrafico
                  titulo="Melhores campanhas por receita"
                  descricao="Ranking das campanhas com maior receita gerada."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCampanhasReceita}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="campanha"
                        width={160}
                        tick={{ fontSize: 11 }}
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
                      margin={{ top: 5, right: 20, left: 0, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis
                        dataKey="campanha"
                        tick={{ fontSize: 10 }}
                        angle={-25}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
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

              <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <div className="xl:col-span-2">
                  <CardGrafico
                    titulo="Receita por campanha e empresa"
                    descricao="Top combinações de campanha e empresa por receita convertida."
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={topCampanhaEmpresaReceita}
                        margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis
                          dataKey="campanha"
                          tick={{ fontSize: 10 }}
                          angle={-25}
                          textAnchor="end"
                          height={90}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
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
                          innerRadius={60}
                          outerRadius={105}
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
                    <div className="h-full flex items-center justify-center text-sm text-gray-500">
                      Nenhum template identificado.
                    </div>
                  )}
                </CardGrafico>
              </section>

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <CardGrafico
                  titulo="Mensagens x pedidos convertidos"
                  descricao="Comparação por campanha/empresa para avaliar eficiência da comunicação."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCampanhaEmpresaConversao}
                      margin={{ top: 5, right: 20, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis
                        dataKey="campanha"
                        tick={{ fontSize: 10 }}
                        angle={-25}
                        textAnchor="end"
                        height={90}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
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
                      margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="campanha"
                        width={160}
                        tick={{ fontSize: 11 }}
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

              <section className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-xl font-bold">
                      Mensagens por campanha e empresa
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Indicador obrigatório: mensagens, pedidos convertidos, clientes, receita e taxa de conversão por campanha/empresa.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
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

              <section className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm mb-6">
                <h2 className="text-xl font-bold mb-4">
                  Melhores campanhas por receita
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
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

              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">
                    Campanhas com baixa conversão
                  </h2>

                  <div className="space-y-3">
                    {baixaConversao.map((campanha, index) => (
                      <div key={`${campanha.campanha}-${index}`} className="rounded-xl bg-red-50 border border-red-100 p-4">
                        <p className="font-bold">{campanha.campanha}</p>

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

                <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                  <h2 className="text-xl font-bold mb-4">
                    Templates mais usados
                  </h2>

                  <div className="space-y-3">
                    {templates.map((template, index) => (
                      <div key={`${template.template}-${index}`} className="rounded-xl bg-orange/5 border border-orange/10 p-4 flex items-center justify-between">
                        <p className="font-bold">{template.template}</p>

                        <span className="text-sm text-orange font-bold">
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