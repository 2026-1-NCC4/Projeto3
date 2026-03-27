import React from 'react';
import { useNavigate } from 'react-router-dom';
import CampoInput from './CampoInput';

const CardLogin = () => {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('✅ Login realizado com sucesso! Redirecionando para o dashboard...');
    navigate('/dashboard');
  };

  return (
    <div className="w-full max-w-[340px] animate-fade-up">
      <h1 className="font-playfair text-3xl text-text-dark font-bold tracking-tight">
        Área do Colaborador
      </h1>
      <p className="text-sm text-text-soft mt-3 mb-10">
        Digite suas credenciais
      </p>

      <form onSubmit={handleSubmit}>
        <CampoInput
          tipo="email"
          placeholder="E-mail"
          icone="email"
          autoComplete="email"
        />
        <CampoInput
          tipo="password"
          placeholder="Senha"
          icone="cadeado"
          autoComplete="current-password"
        />
        <button
          type="submit"
          className="w-full mt-7 py-3 bg-orange text-white border-none rounded-md font-dm-sans text-sm font-medium cursor-pointer transition-all hover:bg-orange-lt active:scale-98"
        >
          Entrar
        </button>
      </form>

      <p className="text-center mt-5 text-xs text-text-soft">
        Novo por aqui?{' '}
        <a href="#" className="text-orange no-underline font-medium hover:underline">
          Cadastre-se!
        </a>
      </p>
    </div>
  );
};

export default CardLogin;