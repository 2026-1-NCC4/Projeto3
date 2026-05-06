import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PainelEsquerdo from './PainelEsquerdo';
import CardLogin from './CardLogin';
import CardCadastro from './CardCadastro';
import CardRecuperarSenha from './CardRecuperarSenha';

const Login = () => {
  const [tela, setTela] = useState('login');
  const navigate = useNavigate();

  const renderizarTela = () => {
    switch (tela) {
      case 'login':
        return <CardLogin mudarTela={setTela} />;

      case 'cadastro':
        return <CardCadastro mudarTela={setTela} />;

      case 'recuperar-senha':
        return <CardRecuperarSenha mudarTela={setTela} />;

      default:
        return <CardLogin mudarTela={setTela} />;
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="fixed top-5 left-5 z-50 flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-orange shadow-md border border-orange/10 hover:bg-white hover:scale-105 transition"
        title="Voltar para a página inicial"
      >
        <svg
          viewBox="0 0 24 24"
          className="w-5 h-5 fill-current"
          aria-hidden="true"
        >
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
        </svg>

        <span className="hidden sm:inline">
          Página inicial
        </span>
      </button>

      <PainelEsquerdo />

      <div className="flex-1 bg-cream flex items-center justify-center p-8 md:p-12">
        {renderizarTela()}
      </div>
    </div>
  );
};

export default Login;