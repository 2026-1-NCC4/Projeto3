import React, { useState } from 'react';

const CampoInput = ({ tipo, placeholder, icone, autoComplete }) => {
  const [estaFocado, setEstaFocado] = useState(false);
  const [valor, setValor] = useState('');

  const renderizarIcone = () => {
    if (icone === 'email') {
      return (
        <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <polyline points="2,4 12,13 22,4" />
        </svg>
      );
    }
    if (icone === 'cadeado') {
      return (
        <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-text-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="relative mb-6">
      {renderizarIcone()}
      <input
        type={tipo}
        placeholder={placeholder}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onFocus={() => setEstaFocado(true)}
        onBlur={() => setEstaFocado(false)}
        autoComplete={autoComplete}
        className="w-full bg-transparent border-0 border-b border-solid border-[#E0D8CC] py-3 pl-6 pr-2 text-sm font-dm-sans text-text-dark outline-none focus:border-orange transition-colors"
      />
      {/* Linha laranja que aparece quando focado */}
      <span
        className={`absolute bottom-0 left-0 h-[2px] bg-orange transition-all duration-300 ${
          estaFocado || valor ? 'w-full' : 'w-0'
        }`}
      ></span>
    </div>
  );
};

export default CampoInput;