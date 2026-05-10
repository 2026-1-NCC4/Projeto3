import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const fontePoppins = {
  fontFamily: "'Poppins', sans-serif"
};

function getInviteStatus(convite) {
  if (!convite) return 'inactive';

  if (convite.used_at || convite.status === 'used') {
    return 'used';
  }

  if (convite.status === 'active') {
    return 'active';
  }

  return 'inactive';
}

function getInviteStatusLabel(status) {
  const labels = {
    active: 'Ativo',
    used: 'Usado',
    inactive: 'Inativo'
  };

  return labels[status] || 'inactive';
}

function getInviteStatusClass(status) {
  const classes = {
    active: 'bg-green-100 text-green-700 border-green-200',
    used: 'bg-blue-100 text-blue-700 border-blue-200',
    inactive: 'bg-gray-100 text-gray-600 border-gray-200'
  };

  return classes[status] || classes.inactive;
}

function StatusConviteBadge({ convite }) {
  const status = getInviteStatus(convite);

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getInviteStatusClass(status)}`}
    >
      {getInviteStatusLabel(status)}
    </span>
  );
}

const ConvidarEmpresas = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [empresas, setEmpresas] = useState([]);
  const [companyId, setCompanyId] = useState('');
  const [email, setEmail] = useState('');
  const [convites, setConvites] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const empresaSelecionada = useMemo(() => {
    return empresas.find((empresa) => String(empresa.id) === String(companyId));
  }, [empresas, companyId]);

  const ultimoConviteDaEmpresaSelecionada = useMemo(() => {
    if (!companyId) return null;

    return convites.find((convite) => String(convite.company_id) === String(companyId)) || null;
  }, [convites, companyId]);

  const buscarEmpresas = async () => {
    const response = await fetch(`${API_URL}/companies/invite-options`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar empresas.');
    }

    setEmpresas(data.data || []);
  };

  const buscarConvites = async () => {
    const response = await fetch(`${API_URL}/company-invites`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar convites.');
    }

    setConvites(data.data || []);
  };

  useEffect(() => {
    const carregarDados = async () => {
      try {
        if (!token) {
          navigate('/login');
          return;
        }

        if (!['admin', 'colaborador'].includes(usuario.role)) {
          navigate('/dashboard');
          return;
        }

        setErro('');
        await buscarEmpresas();
        await buscarConvites();
      } catch (error) {
        setErro(error.message);
      }
    };

    carregarDados();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyId) {
      setErro('Selecione a empresa que será convidada.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErro('Digite um e-mail válido.');
      return;
    }

    try {
      setLoading(true);
      setErro('');
      setMensagem('');

      const response = await fetch(`${API_URL}/company-invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          companyId,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao enviar convite.');
      }

      setMensagem('Convite de empresa enviado com sucesso.');
      setCompanyId('');
      setEmail('');

      await buscarEmpresas();
      await buscarConvites();
    } catch (error) {
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="flex-1 lg:ml-72">
        <button
          onClick={toggleSidebar}
          className="lg:hidden fixed top-4 left-4 z-50 bg-orange p-2 rounded-lg shadow-lg"
        >
          <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>

        <main className="p-5 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1
                className="text-3xl font-bold text-text-dark"
                style={fontePoppins}
              >
                Convidar empresa
              </h1>

              <p
                className="text-sm text-gray-500 mt-2"
                style={fontePoppins}
              >
                Selecione uma empresa já importada do STORE.csv e envie um código de ativação para o responsável.
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="bg-orange text-white px-5 py-3 rounded-xl font-medium hover:bg-orange-dark transition-colors"
              style={fontePoppins}
            >
              Voltar
            </button>
          </div>

          {mensagem && (
            <div className="mb-4 rounded-lg border border-green-300 bg-green-100 px-4 py-3 text-green-700">
              {mensagem}
            </div>
          )}

          {erro && (
            <div className="mb-4 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-red-700">
              {erro}
            </div>
          )}

          <section className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-orange/10">
            <h2 className="text-xl font-bold mb-5">
              Novo convite de empresa
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange bg-white"
                disabled={loading}
              >
                <option value="">Selecione a empresa</option>

                {empresas.map((empresa) => (
                  <option key={empresa.id} value={empresa.id}>
                    {empresa.name}
                    {empresa.activated_at ? ' — ativada' : ''}
                  </option>
                ))}
              </select>

              <input
                type="email"
                placeholder="E-mail do responsável"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange"
                disabled={loading}
              />

              <button
                type="submit"
                disabled={loading}
                className="bg-orange text-white rounded-xl px-4 py-3 font-medium hover:bg-orange-dark transition-colors disabled:opacity-70"
              >
                {loading ? 'Enviando...' : 'Enviar convite'}
              </button>
            </form>

            {empresaSelecionada && (
              <div className="mt-4 rounded-xl bg-orange/5 border border-orange/10 p-4 text-sm text-gray-600">
                <p>
                  <strong>Empresa selecionada:</strong> {empresaSelecionada.name}
                </p>

                <p>
                  <strong>ID externo:</strong> {empresaSelecionada.external_store_id || '-'}
                </p>

                <p className="flex flex-wrap items-center gap-2 mt-1">
                  <strong>Status:</strong>

                  {empresaSelecionada.activated_at ? (
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold border bg-blue-100 text-blue-700 border-blue-200">
                      Usado
                    </span>
                  ) : ultimoConviteDaEmpresaSelecionada ? (
                    <StatusConviteBadge convite={ultimoConviteDaEmpresaSelecionada} />
                  ) : (
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-600 border-gray-200">
                      Inativo
                    </span>
                  )}
                </p>
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-sm p-6 border border-orange/10">
            <h2 className="text-xl font-bold mb-5">
              Convites de empresas enviados
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[850px]">
                <thead>
                  <tr className="border-b border-gray-200 text-sm text-gray-600">
                    <th className="py-3 pr-4">Empresa</th>
                    <th className="py-3 pr-4">E-mail</th>
                    <th className="py-3 pr-4">Código</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Expira em</th>
                    <th className="py-3 pr-4">Usado em</th>
                  </tr>
                </thead>

                <tbody>
                  {convites.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-6 text-gray-500">
                        Nenhum convite de empresa enviado ainda.
                      </td>
                    </tr>
                  ) : (
                    convites.map((convite) => (
                      <tr key={convite.id} className="border-b border-gray-100">
                        <td className="py-4 pr-4">{convite.company_name}</td>
                        <td className="py-4 pr-4">{convite.email}</td>
                        <td className="py-4 pr-4">{convite.invite_code}</td>
                        <td className="py-4 pr-4">
                          <StatusConviteBadge convite={convite} />
                        </td>
                        <td className="py-4 pr-4">
                          {convite.expires_at
                            ? new Date(convite.expires_at).toLocaleString('pt-BR')
                            : '-'}
                        </td>
                        <td className="py-4 pr-4">
                          {convite.used_at
                            ? new Date(convite.used_at).toLocaleString('pt-BR')
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-sm text-gray-500 mt-5">
              O código enviado será usado pela empresa na tela de cadastro para ativar o acesso.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ConvidarEmpresas;

