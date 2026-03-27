import React from 'react';

const CartaoPlano = ({ nome, descricao, recursos, isDestacado = false, textoBadge = null }) => {
  return (
    <div className={`bg-white border rounded-2xl p-8 pt-8 pb-7 relative ${isDestacado ? 'border-orange border-2 shadow-[0_8px_32px_rgba(242,99,34,0.18)]' : 'border-border'}`}>
      {/* Badge "Recomendado" */}
      {textoBadge && (
        <div className="absolute top-[-14px] left-1/2 transform -translate-x-1/2 bg-orange text-white text-[11px] font-bold py-1 px-4 rounded-full whitespace-nowrap tracking-wide uppercase">
          {textoBadge}
        </div>
      )}
      
      {/* Nome do plano */}
      <div className="text-base font-bold text-text-dark">{nome}</div>
      
      {/* Descrição */}
      <div className="text-xs text-text-soft mt-1 mb-6">{descricao}</div>
      
      {/* Lista de recursos */}
      <ul className="flex flex-col gap-2.5 list-none">
        {recursos.map((recurso, idx) => (
          <li key={idx} className="text-xs text-text-mid flex items-start gap-2">
            <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${recurso.incluido ? 'bg-orange/10' : 'bg-black/5'}`}>
              {recurso.incluido ? (
                // Ícone de check (✓)
                <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
                  <polyline points="2,5 4,7.5 8,2.5" fill="none" stroke="#F26322" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                // Ícone de X
                <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
                  <line x1="2.5" y1="2.5" x2="7.5" y2="7.5" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" />
                  <line x1="7.5" y1="2.5" x2="2.5" y2="7.5" stroke="#aaa" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </span>
            {recurso.texto}
          </li>
        ))}
      </ul>
      
      {/* Botão de ação */}
      <button className="w-full mt-7 py-3 bg-orange text-white text-sm font-semibold rounded-lg hover:bg-[#d6541a] transition transform hover:-translate-y-0.5">
        Escolher plano
      </button>
    </div>
  );
};

export default CartaoPlano;