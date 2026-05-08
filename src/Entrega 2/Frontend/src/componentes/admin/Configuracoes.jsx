import React, { useEffect, useState } from 'react';
import Sidebar from '../dashboard/Sidebar';

const API_URL = 'http://localhost:3001/api';

const configuracaoPadrao = {
  nomePlataforma: 'Cannoli CRM',
  emailSuporte: 'suporte@cannolicrm.com',
  limiteRecorrencia: 25,
  limiteTicketMedio: 40,
  limiteQuedaReceita: 15,
  alertasCriticos: true,
  recalculoAutomatico: true,
  permitirConvites: true
};

const perfilPadrao = {
  name: '',
  email: '',
  role: '',
  companyId: null,
  password: ''
};

const Configuracoes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [config, setConfig] = useState(configuracaoPadrao);
  const [perfil, setPerfil] = useState(perfilPadrao);

  const [loading, setLoading] = useState(true);
  const [salvandoConfig, setSalvandoConfig] = useState(false);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [feedbackTimer, setFeedbackTimer] = useState(null);

  const usuarioLocal = JSON.parse(localStorage.getItem('usuario') || '{}');
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');

  const isAdmin = perfil.role === 'admin' || usuarioLocal.role === 'admin';

  const limparFeedbackDepois = (tempo = 3000) => {
    if (feedbackTimer) {
      clearTimeout(feedbackTimer);
    }

    const timer = setTimeout(() => {
      setMensagem('');
      setErro('');
    }, tempo);

    setFeedbackTimer(timer);
  };

  const mostrarMensagem = (texto) => {
    setErro('');
    setMensagem(texto);
    limparFeedbackDepois(3000);
  };

  const mostrarErro = (texto) => {
    setMensagem('');
    setErro(texto);
    limparFeedbackDepois(5000);
  };

  const limparFeedback = () => {
    setErro('');
    setMensagem('');

    if (feedbackTimer) {
      clearTimeout(feedbackTimer);
      setFeedbackTimer(null);
    }
  };

  const buscarPerfil = async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao carregar perfil.');
    }

    const user = data.user;

    setPerfil({
      name: user.name || '',
      email: user.email || '',
      role: user.role || '',
      companyId: user.companyId || null,
      password: ''
    });

    localStorage.setItem(
      'usuario',
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId || null
      })
    );
  };

  const buscarConfiguracoes = async () => {
    const response = await fetch(`${API_URL}/admin-config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao carregar configurações.');
    }

    setConfig({
      ...configuracaoPadrao,
      ...data.data
    });
  };

  const carregarTudo = async () => {
    try {
      setLoading(true);
      limparFeedback();

      await Promise.all([
        buscarPerfil(),
        buscarConfiguracoes()
      ]);
    } catch (error) {
      mostrarErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  const salvarPerfil = async () => {
    try {
      setSalvandoPerfil(true);
      limparFeedback();

      const body = {
        name: perfil.name,
        email: perfil.email
      };

      if (perfil.password) {
        body.password = perfil.password;
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao salvar perfil.');
      }

      const user = data.user;

      setPerfil({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        companyId: user.companyId || null,
        password: ''
      });

      localStorage.setItem(
        'usuario',
        JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId || null
        })
      );

      mostrarMensagem(data.message || 'Perfil atualizado com sucesso.');
    } catch (error) {
      mostrarErro(error.message);
    } finally {
      setSalvandoPerfil(false);
    }
  };

  const salvarConfiguracoes = async () => {
    try {
      setSalvandoConfig(true);
      limparFeedback();

      const response = await fetch(`${API_URL}/admin-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao salvar configurações.');
      }

      setConfig({
        ...configuracaoPadrao,
        ...data.data
      });

      mostrarMensagem(data.message || 'Configurações salvas com sucesso.');
    } catch (error) {
      mostrarErro(error.message);
    } finally {
      setSalvandoConfig(false);
    }
  };

  const restaurarPadrao = async () => {
    try {
      setSalvandoConfig(true);
      limparFeedback();

      const response = await fetch(`${API_URL}/admin-config/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao restaurar configurações.');
      }

      setConfig({
        ...configuracaoPadrao,
        ...data.data
      });

      mostrarMensagem(data.message || 'Configurações restauradas com sucesso.');
    } catch (error) {
      mostrarErro(error.message);
    } finally {
      setSalvandoConfig(false);
    }
  };

  const atualizarConfig = (campo, valor) => {
    setConfig((configAtual) => ({
      ...configAtual,
      [campo]: valor
    }));

    limparFeedback();
  };

  const atualizarPerfil = (campo, valor) => {
    setPerfil((perfilAtual) => ({
      ...perfilAtual,
      [campo]: valor
    }));

    limparFeedback();
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimer) {
        clearTimeout(feedbackTimer);
      }
    };
  }, [feedbackTimer]);

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
          <header className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-text-dark">
                Configurações
              </h1>

              <p className="text-sm text-gray-500 mt-2">
                Gestão de perfil, parâmetros administrativos e regras da plataforma.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={restaurarPadrao}
                disabled={!isAdmin || salvandoConfig || loading}
                className="px-5 py-3 rounded-xl bg-orange/10 text-orange font-semibold hover:bg-orange/15 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Restaurar padrão
              </button>

              <button
                type="button"
                onClick={salvarConfiguracoes}
                disabled={!isAdmin || salvandoConfig || loading}
                className="px-5 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvandoConfig ? 'Salvando...' : 'Salvar parâmetros da plataforma'}
              </button>
            </div>
          </header>

          {loading && (
            <section className="mb-6 rounded-2xl bg-white border border-orange/10 p-6 text-sm text-gray-500">
              Carregando configurações...
            </section>
          )}

          {erro && (
            <section className="mb-6 rounded-2xl bg-red-100 border border-red-300 text-red-700 p-4 text-sm font-medium">
              {erro}
            </section>
          )}

          {mensagem && (
            <section className="mb-6 rounded-2xl bg-green-100 border border-green-200 text-green-700 p-4 text-sm font-medium">
              {mensagem}
            </section>
          )}

          {!isAdmin && (
            <section className="mb-6 rounded-2xl bg-yellow-100 border border-yellow-200 text-yellow-800 p-4 text-sm font-medium">
              Seu perfil pode visualizar as configurações, mas apenas administradores podem alterar parâmetros da plataforma.
            </section>
          )}

          {!loading && (
            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold">
                      Perfil atual
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Altera os dados reais do usuário na tabela users.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={salvarPerfil}
                    disabled={salvandoPerfil}
                    className="px-4 py-2 rounded-xl bg-orange text-white text-sm font-semibold hover:bg-orange-dark transition disabled:opacity-50"
                  >
                    {salvandoPerfil ? 'Salvando perfil...' : 'Salvar perfil do usuário'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Nome do usuário
                    </label>
                    <input
                      type="text"
                      value={perfil.name}
                      onChange={(e) => atualizarPerfil('name', e.target.value)}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      E-mail do usuário
                    </label>
                    <input
                      type="email"
                      value={perfil.email}
                      onChange={(e) => atualizarPerfil('email', e.target.value)}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Nova senha
                    </label>
                    <input
                      type="password"
                      value={perfil.password}
                      onChange={(e) => atualizarPerfil('password', e.target.value)}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange"
                      placeholder="Preencha somente se quiser alterar a senha"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      A senha deve ter no mínimo 8 caracteres, maiúscula, minúscula, número e caractere especial.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <p className="text-sm text-gray-500">Perfil</p>
                      <h3 className="font-bold mt-1">{perfil.role || '-'}</h3>
                    </div>

                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                      <p className="text-sm text-gray-500">Tipo de acesso</p>
                      <h3 className="font-bold mt-1">
                        {isAdmin ? 'Acesso global' : 'Acesso operacional'}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                <h2 className="text-xl font-bold mb-4">
                  Identidade da plataforma
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Nome da plataforma
                    </label>
                    <input
                      type="text"
                      value={config.nomePlataforma}
                      onChange={(e) => atualizarConfig('nomePlataforma', e.target.value)}
                      disabled={!isAdmin}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      E-mail de suporte
                    </label>
                    <input
                      type="email"
                      value={config.emailSuporte}
                      onChange={(e) => atualizarConfig('emailSuporte', e.target.value)}
                      disabled={!isAdmin}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange disabled:bg-gray-50 disabled:text-gray-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                <h2 className="text-xl font-bold mb-4">
                  Parâmetros de alerta
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Limite mínimo de recorrência (%)
                    </label>
                    <input
                      type="number"
                      value={config.limiteRecorrencia}
                      onChange={(e) => atualizarConfig('limiteRecorrencia', Number(e.target.value))}
                      disabled={!isAdmin}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange disabled:bg-gray-50 disabled:text-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Empresas abaixo desse percentual entram como risco de recorrência.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Limite mínimo de ticket médio (R$)
                    </label>
                    <input
                      type="number"
                      value={config.limiteTicketMedio}
                      onChange={(e) => atualizarConfig('limiteTicketMedio', Number(e.target.value))}
                      disabled={!isAdmin}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange disabled:bg-gray-50 disabled:text-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Empresas abaixo desse valor podem gerar alerta de ticket baixo.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Limite de queda de receita (%)
                    </label>
                    <input
                      type="number"
                      value={config.limiteQuedaReceita}
                      onChange={(e) => atualizarConfig('limiteQuedaReceita', Number(e.target.value))}
                      disabled={!isAdmin}
                      className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange disabled:bg-gray-50 disabled:text-gray-500"
                    />
                    <p className="text-xs text-gray-400 mt-2">
                      Quedas acima desse percentual serão tratadas como críticas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
                <h2 className="text-xl font-bold mb-4">
                  Regras operacionais
                </h2>

                <div className="space-y-4">
                  <label className="flex items-center justify-between rounded-xl bg-orange/5 border border-orange/10 p-4 cursor-pointer">
                    <div>
                      <p className="font-bold">Alertas críticos</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Exibir alertas de queda, baixa recorrência e ticket baixo.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={config.alertasCriticos}
                      onChange={(e) => atualizarConfig('alertasCriticos', e.target.checked)}
                      disabled={!isAdmin}
                      className="w-5 h-5 accent-orange disabled:opacity-50"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-xl bg-orange/5 border border-orange/10 p-4 cursor-pointer">
                    <div>
                      <p className="font-bold">Recálculo automático</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Permitir que o painel recalcule os dados ao aplicar filtros.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={config.recalculoAutomatico}
                      onChange={(e) => atualizarConfig('recalculoAutomatico', e.target.checked)}
                      disabled={!isAdmin}
                      className="w-5 h-5 accent-orange disabled:opacity-50"
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-xl bg-orange/5 border border-orange/10 p-4 cursor-pointer">
                    <div>
                      <p className="font-bold">Convite de colaboradores</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Liberar envio de convites para colaboradores Cannoli.
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={config.permitirConvites}
                      onChange={(e) => atualizarConfig('permitirConvites', e.target.checked)}
                      disabled={!isAdmin}
                      className="w-5 h-5 accent-orange disabled:opacity-50"
                    />
                  </label>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm xl:col-span-2">
                <h2 className="text-xl font-bold mb-4">
                  Resumo das configurações atuais
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Plataforma</p>
                    <h3 className="font-bold mt-1">{config.nomePlataforma}</h3>
                  </div>

                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Recorrência mínima</p>
                    <h3 className="font-bold mt-1">{config.limiteRecorrencia}%</h3>
                  </div>

                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Ticket mínimo</p>
                    <h3 className="font-bold mt-1">
                      R$ {Number(config.limiteTicketMedio || 0).toLocaleString('pt-BR')}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-gray-400 mt-4">
                  Perfil do usuário é salvo na tabela users. Configurações da plataforma são salvas na tabela admin_settings.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Configuracoes;