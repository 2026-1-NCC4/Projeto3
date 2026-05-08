import React from 'react';

const PainelEsquerdo = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-orange items-center justify-center relative overflow-hidden px-12">
      
      {/* Círculos decorativos */}
      <div className="absolute w-80 h-80 rounded-full bg-white/5 -top-20 -left-20"></div>
      <div className="absolute w-56 h-56 rounded-full bg-white/5 -bottom-14 -right-14"></div>

      {/* Conteúdo */}
      <div className="z-10 max-w-md text-white animate-fade-up">
        
        {/* Logo */}
        <div className="flex items-end gap-2 mb-8">
          <div className="w-4 h-28 rounded-xl bg-white"></div>
          <div className="w-4 h-16 rounded-xl bg-white"></div>
          <span className="ml-3 text-2xl font-bold tracking-wide">
            Cannoli
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-bold leading-snug mb-4">
          Transforme seus dados em insights para sua empresa
        </h1>

        {/* Subtexto */}
        <p className="text-white/80 text-sm leading-relaxed">
          Tome decisões mais inteligentes com uma plataforma simples, moderna e feita para o seu negócio crescer.
        </p>

        {/* Linha decorativa */}
        <div className="mt-8 w-16 h-1 bg-white/40 rounded-full"></div>

      </div>
    </div>
  );
};

export default PainelEsquerdo;