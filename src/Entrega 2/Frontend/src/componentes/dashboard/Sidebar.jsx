import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const isAdmin = usuario.role === 'admin';
  const isColaborador = usuario.role === 'colaborador';
  const isCannoli = isAdmin || isColaborador;

  const nomeUsuario = usuario.name || (isCannoli ? 'Cannoli CRM' : 'Chef');
  const descricaoPerfil = isCannoli
    ? isAdmin
      ? 'Administrador da Plataforma'
      : 'Colaborador Cannoli'
    : 'Restaurante Parceiro';

  const seloPerfil = isCannoli ? 'Global' : 'Premium';

  const handleNavigate = (path) => {
    navigate(path);

    if (isOpen && toggleSidebar) {
      toggleSidebar();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuAdmin = [
    {
      label: 'Dashboard Global',
      path: '/dashboard',
      icon: (
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      )
    },
    {
      label: 'Empresas',
      path: '/empresas',
      icon: (
        <path d="M4 21V5c0-1.1.9-2 2-2h9c1.1 0 2 .9 2 2v16h-2v-4h-3v4H4zm2-2h4v-4h5V5H6v14zm2-10h2V7H8v2zm4 0h2V7h-2v2zm-4 4h2v-2H8v2zm4 0h2v-2h-2v2zm7 8v-9h-2v-2h3c1.1 0 2 .9 2 2v9h-3z" />
      )
    },
    {
      label: 'Campanhas',
      path: '/campanhas',
      icon: (
        <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
      )
    },
    {
      label: 'Recomendações',
      path: '/recomendacoes',
      icon: (
        <path d="M12 2 3 6v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4zm0 2.2 7 3.1V12c0 4.3-2.8 8.3-7 9.7-4.2-1.4-7-5.4-7-9.7V7.3l7-3.1zm-1 4.8h2v6h-2V9zm0 8h2v2h-2v-2z" />
      )
    },
    {
      label: 'Clientes',
      path: '/clientes',
      icon: (
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      )
    },
    {
      label: 'Financeiro',
      path: '/financeiro',
      icon: (
        <path d="M4 6h16v2H4V6zm2-4h12v2H6V2zm16 8H2v12h20V10zm-4 6h-4v-2h4v2z" />
      )
    },
    {
      label: 'Importação de Dados',
      path: '/importacao-dados',
      icon: (
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zM8 13h8v2H8v-2zm0 4h8v2H8v-2zm0-8h3v2H8V9z" />
      )
    },
    {
      label: 'Colaboradores',
      path: '/staff',
      icon: (
        <path d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zM8 11c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13zm8 0c-.3 0-.7 0-1 .1 1.2.9 2 2 2 3.4V19h6v-2.5c0-2.3-4.7-3.5-7-3.5z" />
      ),
      onlyAdmin: true
    }
  ];

  const menuEmpresa = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: (
        <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
      )
    },
    {
      label: 'Campanhas',
      path: '/campanhas',
      icon: (
        <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
      )
    },
    {
      label: 'Recomendações',
      path: '/recomendacoes',
      icon: (
        <path d="M12 2 3 6v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V6l-9-4zm0 2.2 7 3.1V12c0 4.3-2.8 8.3-7 9.7-4.2-1.4-7-5.4-7-9.7V7.3l7-3.1zm-1 4.8h2v6h-2V9zm0 8h2v2h-2v-2z" />
      )
    },
    {
      label: 'Clientes',
      path: '/clientes',
      icon: (
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      )
    },
    {
      label: 'Financeiro',
      path: '/financeiro',
      icon: (
        <path d="M4 6h16v2H4V6zm2-4h12v2H6V2zm16 8H2v12h20V10zm-4 6h-4v-2h4v2z" />
      )
    }
  ];

  const menuItems = isCannoli ? menuAdmin : menuEmpresa;
  const menuFiltrado = menuItems.filter((item) => !item.onlyAdmin || isAdmin);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-72 bg-orange overflow-y-auto transition-transform duration-300 z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
      >
        <div className="p-7 pb-6 border-b border-white/15 mb-6">
          <button
            type="button"
            onClick={() => handleNavigate('/dashboard')}
            className="font-playfair text-4xl font-black text-white tracking-tight flex items-center gap-2"
          >
            li
          </button>

          <div className="mt-5 pt-4 border-t border-white/15">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>

              <div>
                <div className="text-white font-semibold text-sm">
                  Olá, {nomeUsuario}
                </div>
                <div className="text-white/70 text-xs">
                  {descricaoPerfil}
                </div>
              </div>
            </div>

            <span className="bg-white/20 text-white text-xs font-medium px-2.5 py-1 rounded-full">
              {seloPerfil}
            </span>
          </div>
        </div>

        <nav className="px-4">
          {menuFiltrado.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => handleNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 my-1 rounded-xl transition text-left ${
                isActive(item.path)
                  ? 'bg-white text-orange shadow-sm'
                  : 'text-white/85 hover:bg-white/15 hover:text-white'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                {item.icon}
              </svg>

              <span className="font-medium">
                {item.label}
              </span>
            </button>
          ))}

          <div className="h-px bg-white/15 my-4"></div>

          <button
            type="button"
            onClick={() => handleNavigate('/configuracoes')}
            className={`w-full flex items-center gap-3 px-4 py-3 my-1 rounded-xl transition text-left ${
              isActive('/configuracoes')
                ? 'bg-white text-orange shadow-sm'
                : 'text-white/85 hover:bg-white/15 hover:text-white'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
              <path d="M20 4h-4.2c-.4-1.2-1.5-2-2.8-2h-2c-1.3 0-2.4.8-2.8 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h4v2h8V6h4v12z" />
            </svg>

            <span className="font-medium">
              Configurações
            </span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 my-1 rounded-xl text-white/85 hover:bg-white/15 hover:text-white transition text-left"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>

            <span className="font-medium">
              Sair
            </span>
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;