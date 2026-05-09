import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';

const API_URL = 'http://localhost:3001/api';

const normalizarStatusConvite = (convite) => {
  if (convite?.used_at || convite?.status === 'used') {
    return 'used';
  }

  if (convite?.status === 'active') {
    return 'active';
  }

  return 'inactive';
};

const statusConfig = {
  active: {
    label: 'Ativo',
    classe: 'bg-green-100 text-green-700 border-green-200'
  },
  used: {
    label: 'Usado',
    classe: 'bg-blue-100 text-blue-700 border-blue-200'
  },
  inactive: {
    label: 'Inativo',
    classe: 'bg-gray-100 text-gray-600 border-gray-200'
  }
};

const StatusBadge = ({ convite }) => {
  const status = normalizarStatusConvite(convite);
  const config = statusConfig[status] || statusConfig.inactive;

  return (
    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${config.classe}`}>
      {config.label}
    </span>
  );
};

const ConvidarStaff = () => {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [convites, setConvites] = useState([]);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const token = localStorage.getItem('token');

  const fontePoppins = {
    fontFamily: "'Poppins', sans-serif"
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const buscarConvites = async () => {
    try {
      setErro('');

      const response = await fetch(`${API_URL}/staff-invites`, {
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
    } catch (error) {
      setErro(error.message);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (usuario.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    buscarConvites();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      setErro('Digite o nome do colaborador.');
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

      const response = await fetch(`${API_URL}/staff-invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: nome,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao enviar convite.');
      }

      setMensagem('Convite enviado com sucesso.');
      setNome('');
      setEmail('');
      buscarConvites();
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
          <div
            className="flex items-center justify-between mb-6"
            style={fontePoppins}
          >
            <div>
              <h1
                className="text-3xl font-bold text-text-dark"
                style={fontePoppins}
              >
                Convidar colaborador Cannoli
              </h1>

              <p
                className="text-sm text-gray-500 mt-2"
                style={fontePoppins}
              >
                Envie um código de convite para um funcionário interno acessar o painel global da Cannoli.
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
              Novo convite
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
              <input
                type="text"
                placeholder="Nome do colaborador"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-orange"
                disabled={loading}
              />

              <input
                type="email"
                placeholder="E-mail do colaborador"
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
          </section>

          <section className="bg-white rounded-2xl shadow-sm p-6 border border-orange/10">
            <h2 className="text-xl font-bold mb-5">
              Convites enviados
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-sm text-gray-600">
                    <th className="py-3 pr-4">Nome</th>
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
                        Nenhum convite enviado ainda.
                      </td>
                    </tr>
                  ) : (
                    convites.map((convite) => (
                      <tr key={convite.id} className="border-b border-gray-100">
                        <td className="py-4 pr-4">{convite.name}</td>
                        <td className="py-4 pr-4">{convite.email}</td>
                        <td className="py-4 pr-4">{convite.invite_code}</td>
                        <td className="py-4 pr-4">
                          <StatusBadge convite={convite} />
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
              Apenas usuários com perfil admin podem enviar novos convites.
            </p>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ConvidarStaff;
