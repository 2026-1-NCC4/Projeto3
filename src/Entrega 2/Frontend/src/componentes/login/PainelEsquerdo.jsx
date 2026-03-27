import React from 'react';

const PainelEsquerdo = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-orange items-center justify-center relative overflow-hidden">
      {/* Círculos decorativos */}
      <div className="absolute w-80 h-80 rounded-full bg-white/5 -top-20 -left-20"></div>
      <div className="absolute w-56 h-56 rounded-full bg-white/5 -bottom-14 -right-14"></div>
      
      {/* Logo animada */}
      <div className="flex items-end gap-2 z-10 animate-fade-up">
        <div className="w-4 h-16 rounded-xl bg-white"></div>
        <div className="w-4 h-28 rounded-xl bg-white"></div>
      </div>
    </div>
  );
};

export default PainelEsquerdo;