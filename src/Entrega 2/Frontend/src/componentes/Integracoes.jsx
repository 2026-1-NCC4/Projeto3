import React from 'react';

// Dados das integrações
const integracoesData = [
  {
    nome: '99Food',
    logo: 'https://damedosassados.com.br/wp-content/uploads/2021/03/99-food-logo-1536x360-1.png',
    altura: 'max-h-7',
    largura: 'max-w-[105px]'
  },
  {
    nome: 'iFood',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/IFood_logo.svg/3840px-IFood_logo.svg.png',
    altura: 'max-h-7',
    largura: 'max-w-[95px]'
  },
  {
    nome: 'Linx',
    logo: 'https://e7.pngegg.com/pngimages/925/291/png-clipart-linx-computer-software-management-business-enterprise-resource-planning-brazil-angle-company.png',
    altura: 'max-h-8',
    largura: 'max-w-[105px]'
  }
];

// Componente do card de integração
const CardIntegracao = ({ nome, logo, altura, largura }) => {
  return (
    <div className="flex items-center justify-center px-7 py-4 bg-white border border-border rounded-xl min-w-[120px] h-[62px] transition hover:shadow-md">
      <img
        src={logo}
        alt={`Logo ${nome}`}
        title={nome}
        className={`${altura} ${largura} object-contain`}
        loading="lazy"
      />
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
            <CardIntegracao
              key={index}
              nome={integracao.nome}
              logo={integracao.logo}
              altura={integracao.altura}
              largura={integracao.largura}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Integracoes;