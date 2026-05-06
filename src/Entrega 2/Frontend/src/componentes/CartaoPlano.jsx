import React from 'react';

const CartaoPlano = ({ 
  nome, 
  descricao, 
  recursos, 
  preco,
  periodo = 'mês',
  isDestacado = false, 
  textoBadge = null,
  corPrimaria = '#F26322',
  onButtonClick = null,
  buttonText = 'Escolher plano',
  showPrice = true,
  className = ''
}) => {
  
  // Função para formatar preço
  const formatarPreco = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Handler do botão
  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick({ nome, preco, periodo });
    } else {
      console.log(`Plano selecionado: ${nome}`);
    }
  };

  return (
    <div className={`
      bg-white border rounded-2xl p-8 pt-8 pb-7 relative 
      transition-all duration-300 hover:scale-105 hover:shadow-xl
      hover:border-2 hover:border-orange
      ${isDestacado 
        ? 'border-orange border-2 shadow-[0_8px_32px_rgba(242,99,34,0.18)]' 
        : 'border-border border'}
      ${className}
    `}>
      {/* Badge dinâmico */}
      {textoBadge && (
        <div 
          className="absolute top-[-14px] left-1/2 transform -translate-x-1/2 text-white text-[11px] font-bold py-1 px-4 rounded-full whitespace-nowrap tracking-wide uppercase"
          style={{ backgroundColor: corPrimaria }}
        >
          {textoBadge}
        </div>
      )}
      
      {/* Nome do plano */}
      <div className="text-base font-bold text-text-dark">{nome}</div>
      
      {/* Preço dinâmico */}
      {showPrice && preco && (
        <div className="mt-4 mb-3">
          <span className="text-3xl font-bold" style={{ color: corPrimaria }}>
            {formatarPreco(preco)}
          </span>
          <span className="text-xs text-text-soft ml-1">/{periodo}</span>
        </div>
      )}
      
      {/* Descrição */}
      <div className="text-xs text-text-soft mt-1 mb-6">{descricao}</div>
      
      {/* Lista de recursos dinâmica */}
      <ul className="flex flex-col gap-2.5 list-none">
        {recursos.map((recurso, idx) => (
          <li key={idx} className="text-xs text-text-mid flex items-start gap-2">
            <span 
              className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
                recurso.incluido 
                  ? 'bg-orange/10' 
                  : 'bg-black/5'
              }`}
            >
              {recurso.incluido ? (
                // Ícone de check (✓)
                <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
                  <polyline 
                    points="2,5 4,7.5 8,2.5" 
                    fill="none" 
                    stroke={corPrimaria} 
                    strokeWidth="1.8" 
                    strokeLinecap="round" 
                  />
                </svg>
              ) : (
                // Ícone de X
                <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
                  <line 
                    x1="2.5" y1="2.5" 
                    x2="7.5" y2="7.5" 
                    stroke="#aaa" 
                    strokeWidth="1.8" 
                    strokeLinecap="round" 
                  />
                  <line 
                    x1="7.5" y1="2.5" 
                    x2="2.5" y2="7.5" 
                    stroke="#aaa" 
                    strokeWidth="1.8" 
                    strokeLinecap="round" 
                  />
                </svg>
              )}
            </span>
            <span className={!recurso.incluido ? 'opacity-60' : ''}>
              {recurso.texto}
              {recurso.destaque && (
                <span 
                  className="ml-1 text-[10px] font-bold" 
                  style={{ color: corPrimaria }}
                >
                  ★
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      
      {/* Informações extras condicionais */}
      {recursos.some(r => r.aviso) && (
        <div className="mt-4 p-2 bg-yellow-50 rounded-lg text-[10px] text-yellow-800">
          {recursos.find(r => r.aviso)?.aviso}
        </div>
      )}
      
      {/* Botão de ação dinâmico */}
      <button 
        onClick={handleButtonClick}
        className="w-full mt-7 py-3 text-white text-sm font-semibold rounded-lg transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0"
        style={{ backgroundColor: corPrimaria }}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default CartaoPlano;