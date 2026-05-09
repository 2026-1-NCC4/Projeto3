import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Sidebar from './Sidebar';

import ApiMockTempoReal from '../ApiMockTempoReal';
import DetalhamentoKpi from '../DetalhamentoKpi';
import KpisSection from '../sections/KpisSection';
import DashboardConteudoSection from '../sections/DashboardConteudoSection';

import { FILTROS_PADRAO } from '../constants/dashboardConstants';
import { buscarDashboard } from '../services/dashboardService';
import { atualizarDadosMockTempoReal } from '../services/mockTempoRealService';

import {
  montarDetalhesDashboard,
  sortearVariacaoMock
} from '../utils/dashboardHelpers';

const Dashboard = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [filtrosSelecionados, setFiltrosSelecionados] = useState(FILTROS_PADRAO);

  const [detalheAtivo, setDetalheAtivo] = useState(null);

  const [tempoRealAtivo] = useState(true);
  const [resultadoTempoReal, setResultadoTempoReal] = useState(null);
  const [erroTempoReal, setErroTempoReal] = useState('');
  const [ultimaAtualizacaoTempoReal, setUltimaAtualizacaoTempoReal] = useState(null);

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const token = localStorage.getItem('token');

  const podeConvidarStaff = usuario.role === 'admin';
  const isPainelCannoli = usuario.role === 'admin' || usuario.role === 'colaborador';
  const isEmpresa = usuario.role === 'empresa';

  const toggleSidebar = () => {
    setSidebarOpen((valorAtual) => !valorAtual);
  };

  const carregarDashboard = async (novosFiltros = filtrosSelecionados, opcoes = {}) => {
    try {
      if (!opcoes.silencioso) {
        setLoading(true);
      }

      setErro('');

      const data = await buscarDashboard({
        token,
        isPainelCannoli,
        filtros: novosFiltros
      });

      setDashboard(data);
    } catch (error) {
      setErro(error.message);
    } finally {
      if (!opcoes.silencioso) {
        setLoading(false);
      }
    }
  };

  const gerarAtualizacaoMock = async ({ silencioso = false } = {}) => {
    try {
      setErroTempoReal('');

      const variacaoMock = sortearVariacaoMock();

      const resultado = await atualizarDadosMockTempoReal({
        token,
        variacaoMock
      });

      setResultadoTempoReal(resultado);
      setUltimaAtualizacaoTempoReal(new Date());

      await carregarDashboard(filtrosSelecionados, { silencioso: true });
    } catch (error) {
      setErroTempoReal(error.message);
    }
  };

  const aplicarFiltros = () => {
    setDetalheAtivo(null);
    carregarDashboard(filtrosSelecionados);
  };

  const limparFiltros = () => {
    setFiltrosSelecionados(FILTROS_PADRAO);
    setDetalheAtivo(null);
    carregarDashboard(FILTROS_PADRAO);
  };

  const atualizarFiltro = (campo, valor) => {
    setFiltrosSelecionados((filtrosAtuais) => ({
      ...filtrosAtuais,
      [campo]: valor
    }));
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    carregarDashboard(FILTROS_PADRAO);
  }, []);

  useEffect(() => {
    if (!tempoRealAtivo || !isPainelCannoli || !token) {
      return undefined;
    }

    gerarAtualizacaoMock({ silencioso: true });

    const intervalo = setInterval(() => {
      gerarAtualizacaoMock({ silencioso: true });
    }, 60 * 60 * 1000);

    return () => clearInterval(intervalo);
  }, [
    tempoRealAtivo,
    isPainelCannoli,
    token,
    filtrosSelecionados.periodo,
    filtrosSelecionados.empresa,
    filtrosSelecionados.canal,
    filtrosSelecionados.tipoPedido
  ]);

  const kpis = dashboard?.kpis || {};
  const graficos = dashboard?.graficos || {};
  const filtros = dashboard?.filtros || {};
  const crescimento = dashboard?.crescimento || {};
  const indicadoresObrigatorios = dashboard?.indicadoresObrigatorios || {};
  const campanhas = dashboard?.campanhas || {};
  const clientes = dashboard?.clientes || {};
  const segmentacao = dashboard?.segmentacaoClientes || {};
  const empresasRisco = dashboard?.empresasRisco || {};

  const detalhes = useMemo(() => {
    return montarDetalhesDashboard({
      dashboard,
      graficos,
      campanhas,
      clientes,
      indicadoresObrigatorios
    });
  }, [dashboard, graficos, campanhas, clientes, indicadoresObrigatorios]);

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

  const empresaSelecionadaNome = useMemo(() => {
    if (isEmpresa) {
      return dashboard?.contextoEmpresa?.companyName || 'Minha empresa';
    }

    if (filtrosSelecionados.empresa === 'todas') {
      return 'Todas as empresas';
    }

    const empresa = filtros.empresas?.find(
      (item) => item.id === filtrosSelecionados.empresa
    );

    return empresa?.nome || 'Empresa selecionada';
  }, [isEmpresa, dashboard, filtrosSelecionados.empresa, filtros.empresas]);

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 lg:ml-72">
        <button
          type="button"
          onClick={toggleSidebar}
          className="lg:hidden fixed top-4 left-4 z-50 bg-orange p-2 rounded-lg shadow-lg"
        >
          <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>

        <main className="p-5 lg:p-8">
          <header className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1
                className="text-3xl font-bold text-text-dark"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {isPainelCannoli ? 'Painel Global Cannoli' : 'Painel da Empresa'}
              </h1>

              <p className="text-sm text-gray-500 mt-2">
                {isPainelCannoli
                  ? 'Visão consolidada de empresas, clientes, pedidos, campanhas e performance comercial.'
                  : 'Visão estratégica e operacional do seu negócio.'}
              </p>
            </div>

            {podeConvidarStaff && (
              <button
                type="button"
                onClick={() => navigate('/staff')}
                className="px-5 py-3 rounded-xl bg-orange text-white font-medium hover:bg-orange-dark transition-colors shadow-sm"
              >
                Convidar colaborador Cannoli
              </button>
            )}
          </header>

          <section className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-orange/10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Acesso atual</p>

                <h2 className="text-2xl font-bold mt-1">
                  Olá, {usuario.name || 'usuário'}
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                  Perfil: <strong>{usuario.role || '-'}</strong>
                </p>
              </div>

              {dashboard?.atualizadoEm && (
                <div className="text-sm text-gray-500">
                  Atualizado em:{' '}
                  <strong>
                    {new Date(dashboard.atualizadoEm).toLocaleString('pt-BR')}
                  </strong>
                </div>
              )}
            </div>
          </section>

          {isPainelCannoli && (
            <ApiMockTempoReal
              tempoRealAtivo={tempoRealAtivo}
              ultimaAtualizacaoTempoReal={ultimaAtualizacaoTempoReal}
              resultadoTempoReal={resultadoTempoReal}
              erroTempoReal={erroTempoReal}
            />
          )}

          {loading && (
            <section className="bg-white rounded-2xl shadow-sm p-8 border border-orange/10">
              <p className="text-gray-500">Carregando dados do painel...</p>
            </section>
          )}

          {erro && (
            <section className="bg-red-100 rounded-2xl p-6 border border-red-300 text-red-700">
              {erro}
            </section>
          )}

          {!loading && !erro && dashboard && (
            <>
              <section className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-orange/10">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Período
                    </label>

                    <select
                      value={filtrosSelecionados.periodo}
                      onChange={(e) => atualizarFiltro('periodo', e.target.value)}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 bg-white text-sm outline-none focus:border-orange"
                    >
                      <option value="todos">Todos os períodos</option>

                      {filtros.periodos?.map((periodo) => (
                        <option key={periodo} value={periodo}>
                          {periodo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isPainelCannoli && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500">
                        Empresa
                      </label>

                      <select
                        value={filtrosSelecionados.empresa}
                        onChange={(e) => atualizarFiltro('empresa', e.target.value)}
                        className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 bg-white text-sm outline-none focus:border-orange"
                      >
                        <option value="todas">Todas as empresas</option>

                        {filtros.empresas?.map((empresa) => (
                          <option key={empresa.id} value={empresa.id}>
                            {empresa.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Canal
                    </label>

                    <select
                      value={filtrosSelecionados.canal}
                      onChange={(e) => atualizarFiltro('canal', e.target.value)}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 bg-white text-sm outline-none focus:border-orange"
                    >
                      <option value="todos">Todos os canais</option>

                      {filtros.canais?.map((canal) => (
                        <option key={canal} value={canal}>
                          {canal}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Tipo de pedido
                    </label>

                    <select
                      value={filtrosSelecionados.tipoPedido}
                      onChange={(e) => atualizarFiltro('tipoPedido', e.target.value)}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 bg-white text-sm outline-none focus:border-orange"
                    >
                      <option value="todos">Todos os tipos</option>

                      {filtros.tiposPedido?.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-5 text-xs text-gray-500">
                  Visão atual:{' '}
                  <strong>{empresaSelecionadaNome}</strong>
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={aplicarFiltros}
                    disabled={loading}
                    className="px-5 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-60"
                  >
                    Aplicar filtros
                  </button>

                  <button
                    type="button"
                    onClick={limparFiltros}
                    disabled={loading}
                    className="px-5 py-3 rounded-xl bg-orange/10 text-orange font-semibold hover:bg-orange/15 transition disabled:opacity-60"
                  >
                    Limpar filtros
                  </button>
                </div>
              </section>

              <KpisSection
                kpis={kpis}
                crescimento={crescimento}
                abrirDetalhe={abrirDetalhe}
              />

              <DetalhamentoKpi
                detalheSelecionado={detalheSelecionado}
                onFechar={() => setDetalheAtivo(null)}
              />

              <DashboardConteudoSection
                dashboard={dashboard}
                graficos={graficos}
                segmentacao={segmentacao}
                empresasRisco={empresasRisco}
                isPainelCannoli={isPainelCannoli}
                abrirDetalhe={abrirDetalhe}
              />
            </>
          )}

          {!loading && !erro && !dashboard && !isPainelCannoli && (
            <section className="bg-white rounded-2xl shadow-sm p-8 border border-orange/10">
              <h2 className="text-xl font-bold text-text-dark">
                Dashboard da empresa
              </h2>

              <p className="text-sm text-gray-500 mt-3 max-w-2xl">
                Nenhum dado encontrado para a empresa logada.
              </p>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;