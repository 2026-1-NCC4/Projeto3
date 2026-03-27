import React from 'react';

// Dados das integrações
const integracoesData = [
  {
    nome: '99Food',
    classe: 'text-[#E8253A]',
    conteudo: (
      <>
        <span>99</span><span className="text-base opacity-80">Food</span>
      </>
    )
  },
  {
    nome: 'iFood',
    classe: 'text-[#EA1D2C]',
    conteudo: (
      <>
        <span className="text-[#EA1D2C] italic font-black">i</span>
        <span className="text-[#EA1D2C] font-black">food</span>
      </>
    )
  },
  {
    nome: 'Linx',
    classe: 'text-[#0065B3] font-bold tracking-[-1px]',
    conteudo: (
      <>
        Linx<span className="text-orange text-[22px] leading-none align-middle">✦</span>
      </>
    )
  }
];

// Componente do card de integração
const CardIntegracao = ({ children, classe }) => {
  return (
    <div className={`flex items-center justify-center px-7 py-4 bg-white border border-border rounded-xl text-xl font-extrabold text-text-dark min-w-[120px] transition hover:shadow-md ${classe}`}>
      {children}
    </div>
  );
};

// Componente principal da seção
const Integracoes = () => {
  return (
    <section id="integracoes" className="py-20 px-6 bg-cream">
      <div className="max-w-[900px] mx-auto">
        {/* Título */}
        <h2 className="text-center text-[20px] md:text-[28px] font-bold text-text-dark tracking-[-0.4px] leading-tight">
          Integre com as ferramentas que você já utiliza
        </h2>
        
        {/* Subtítulo */}
        <p className="text-center mt-3 text-sm text-text-mid leading-relaxed max-w-[560px] mx-auto">
          Nos conectamos ao seu ecossistema para centralizar dados e automatizar campanhas sem complicação.
        </p>

        {/* Logos das integrações */}
        <div className="flex flex-wrap items-center justify-center gap-12 mt-10">
          {integracoesData.map((integracao, index) => (
            <CardIntegracao key={index} classe={integracao.classe}>
              {integracao.conteudo}
            </CardIntegracao>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Integracoes;