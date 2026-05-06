import React, { useState } from 'react';

const CampoInput = ({
  tipo,
  placeholder,
  icone,
  autoComplete,
  value,
  onChange,
  maxLength,
  disabled = false,
}) => {
  const [estaFocado, setEstaFocado] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  const renderizarIcone = () => {
    if (icone === 'email') {
      return (
        <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <polyline points="2,4 12,13 22,4" />
        </svg>
      );
    }

    if (icone === 'cadeado' || icone === 'lock') {
      return (
        <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      );
    }

    if (icone === 'user') {
      return (
        <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="7" r="4" />
          <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
        </svg>
      );
    }

    if (icone === 'building') {
      return (
        <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M9 22v-8h6v8" />
          <path d="M9 6h.01" />
          <path d="M15 6h.01" />
          <path d="M9 10h.01" />
          <path d="M15 10h.01" />
        </svg>
      );
    }

    if (icone === 'file') {
      return (
        <svg className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    }

    if (icone === 'id') {
      return (
        <svg 
          className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-orange" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8" cy="12" r="2" />
          <path d="M12 10h6" />
          <path d="M12 14h4" />
        </svg>
      );
    }

    return null;
  };

  return (
    <div className="relative mb-6">
      {renderizarIcone()}

      <input
        type={tipo === 'password' ? (mostrarSenha ? 'text' : 'password') : tipo}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setEstaFocado(true)}
        onBlur={() => setEstaFocado(false)}
        autoComplete={autoComplete}
        maxLength={maxLength}
        disabled={disabled}
        className={`w-full bg-transparent border-0 border-b border-solid ${
          estaFocado || value ? 'border-orange' : 'border-[#E0D8CC]'
        } py-3 text-sm font-dm-sans text-text-dark outline-none transition-colors
          ${icone ? 'pl-6' : 'pl-0'} 
          ${tipo === 'password' ? 'pr-8' : 'pr-0'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      />

      {tipo === 'password' && (
        <button
          type="button"
          onClick={() => setMostrarSenha(prev => !prev)}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-orange hover:text-orange-dark transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          disabled={disabled}
        >
          {mostrarSenha ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.77 21.77 0 0 1 5.06-6.94" />
              <path d="M1 1l22 22" />
            </svg>
          )}
        </button>
      )}

      <span
        className={`absolute bottom-0 left-0 h-[2px] bg-orange transition-all duration-300 ${
          estaFocado || value ? 'w-full' : 'w-0'
        }`}
      ></span>
    </div>
  );
};

export default CampoInput;