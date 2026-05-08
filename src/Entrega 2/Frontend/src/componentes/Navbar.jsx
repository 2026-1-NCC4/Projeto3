import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-orange/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-end gap-1.5"
          aria-label="Voltar para a página inicial"
        >
          <div className="w-3 h-8 rounded-xl bg-white"></div>
          <div className="w-3 h-5 rounded-xl bg-white"></div>
        </button>

        <div className="hidden md:flex items-center gap-10 text-white font-semibold text-sm">
          <a href="#sobre" className="hover:text-white/80 transition">
            Sobre nós
          </a>

          <a href="#planos" className="hover:text-white/80 transition">
            Planos
          </a>

          <a href="#integracoes" className="hover:text-white/80 transition">
            Integrações
          </a>
        </div>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center justify-center text-white"
          aria-label="Acessar login"
          title="Acessar login"
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.314 0-8 1.657-8 5v1c0 .552.448 1 1 1h14c.552 0 1-.448 1-1v-1c0-3.343-4.686-5-8-5z" />
          </svg>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;