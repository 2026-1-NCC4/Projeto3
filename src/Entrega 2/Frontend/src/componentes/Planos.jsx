import React from 'react';
import CartaoPlano from './CartaoPlano';

// Dados dos planos
const planosData = [
  {
    nome: 'Essencial',
    descricao: 'Ideal para começar',
    isDestacado: false,
    recursos: [
      { texto: 'Até 5.000 clientes', incluido: true },
      { texto: 'Até 15 segmentações', incluido: true },
      { texto: 'Até 5 campanhas de marketing', incluido: true },
      { texto: '1 número de WhatsApp', incluido: true },
      { texto: 'Suporte via e-mail e chat', incluido: true },
      { texto: 'Automação de campanhas', incluido: false },
      { texto: 'Segmentação avançada', incluido: false },
      { texto: 'Suporte prioritário', incluido: false }
    ]
  },
  {
    nome: 'Estratégia',
    descricao: 'Para negócios em crescimento',
    isDestacado: true,
    textoBadge: 'Recomendado',
    recursos: [
      { texto: 'Até 15.000 clientes', incluido: true },
      { texto: 'Até 30 segmentações', incluido: true },
      { texto: 'Até 20 campanhas de marketing', incluido: true },
      { texto: '5 números de WhatsApp', incluido: true },
      { texto: 'Suporte via e-mail e chat', incluido: true },
      { texto: 'Automação de campanhas', incluido: true },
      { texto: 'Segmentação avançada', incluido: true },
      { texto: 'Suporte prioritário', incluido: false }
    ]
  },
  {
    nome: 'Performance',
    descricao: 'Para grandes operações',
    isDestacado: false,
    recursos: [
      { texto: 'Clientes ilimitados', incluido: true },
      { texto: 'Segmentações ilimitadas', incluido: true },
      { texto: 'Campanhas de marketing ilimitadas', incluido: true },
      { texto: 'Números de WhatsApp ilimitados', incluido: true },
      { texto: 'Suporte via WhatsApp', incluido: true },
      { texto: 'Gerente dedicado', incluido: true },
      { texto: 'Automação avançada', incluido: true },
      { texto: 'Relatórios personalizados', incluido: true }
    ]
  }
];

const Planos = () => {
  return (
    <section id="planos" className="pt-0 pb-20 px-6 bg-cream">
      <div className="max-w-[900px] mx-auto">
        {/* Título da seção */}
        <h2 className="text-center text-[20px] md:text-[28px] font-bold text-text-dark tracking-[-0.4px] leading-tight">
          Escolha o plano ideal e comece a automatizar hoje
        </h2>
        
        {/* Subtítulo */}
        <p className="text-center mt-3 text-sm text-text-mid leading-relaxed max-w-[560px] mx-auto">
          Da primeira campanha até operações avançadas, a Cannoli cresce com você.
        </p>

        {/* Grid de planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12 items-start">
          {planosData.map((plano, index) => (
            <CartaoPlano
              key={index}
              nome={plano.nome}
              descricao={plano.descricao}
              recursos={plano.recursos}
              isDestacado={plano.isDestacado}
              textoBadge={plano.textoBadge}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Planos;