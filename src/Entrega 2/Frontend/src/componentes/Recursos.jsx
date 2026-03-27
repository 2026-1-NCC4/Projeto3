import React from 'react';

const recursosData = [
  {
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F26322" strokeWidth="2" strokeLinecap="round" className="w-[26px] h-[26px]">
        <rect x="3" y="4" width="18" height="4" rx="1" />
        <rect x="3" y="10" width="18" height="4" rx="1" />
        <rect x="3" y="16" width="18" height="4" rx="1" />
      </svg>
    ),
    titulo: 'Centralize seus dados',
    descricao: 'Conecte pedidos, clientes e campanhas em um só lugar para ter visão completa do seu negócio.'
  },
  {
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F26322" strokeWidth="2" strokeLinecap="round" className="w-[26px] h-[26px]">
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="22" y2="22" />
      </svg>
    ),
    titulo: 'Identifique oportunidades',
    descricao: 'Descubra padrões de compra e segmente clientes com inteligência baseada em dados reais.'
  },
  {
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#F26322" strokeWidth="2" strokeLinecap="round" className="w-[26px] h-[26px]">
        <polyline points="3 17 9 11 13 15 21 7" />
        <rect x="3" y="3" width="18" height="18" rx="2" strokeOpacity="0.3" />
      </svg>
    ),
    titulo: 'Acompanhe a performance',
    descricao: 'Monitore vendas, conversões e engajamento em tempo real.'
  }
];

const CardRecurso = ({ icone, titulo, descricao }) => {
  return (
    <div className="bg-white border border-border rounded-2xl p-9 pt-9 pb-8 transition hover:shadow-[0_12px_36px_rgba(242,99,34,0.12)] hover:-translate-y-1">
      <div className="w-[52px] h-[52px] bg-orange/10 rounded-xl flex items-center justify-center mb-5">
        {icone}
      </div>
      <h3 className="text-sm font-bold text-text-dark mb-2.5 font-dm-sans">{titulo}</h3>
      <p className="text-xs text-text-soft leading-relaxed font-dm-sans">{descricao}</p>
    </div>
  );
};

const Recursos = () => {
  return (
    <section id="sobre" className="py-20 px-6 bg-cream">
      <div className="max-w-[900px] mx-auto">
        <h2 className="text-center text-[20px] md:text-[28px] font-bold text-text-dark tracking-[-0.4px] leading-tight font-dm-sans">
          Análise de dados = previsibilidade.
        </h2>
        <p className="text-center mt-3 text-sm text-text-mid leading-relaxed max-w-[560px] mx-auto font-dm-sans">
          A Cannoli segmenta sua base automaticamente por comportamento de compra. Descubra quem está ativo, inativo ou em risco e dispare campanhas personalizadas, tudo integrado com seu sistema.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
          {recursosData.map((recurso, index) => (
            <CardRecurso
              key={index}
              icone={recurso.icone}
              titulo={recurso.titulo}
              descricao={recurso.descricao}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Recursos;