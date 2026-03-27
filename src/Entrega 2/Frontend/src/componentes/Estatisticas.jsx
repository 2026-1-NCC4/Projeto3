import React from 'react';

// Dados das estatísticas
const estatisticasData = [
  {
    valor: '+35%',
    label: 'de recorrência média',
    descricao: 'Campanhas inteligentes aumentam a frequência de compra.'
  },
  {
    valor: '+24%',
    label: 'de vendas recuperadas',
    descricao: 'Clientes inativos voltam com automações personalizadas.'
  },
  {
    valor: '+18%',
    label: 'de aumento no ticket médio',
    descricao: 'Clientes fidelizados compram mais.'
  }
];

// Componente do item de estatística
const ItemEstatistica = ({ valor, label, descricao }) => {
  return (
    <div>
      <div className="text-[38px] md:text-[56px] font-bold text-white leading-none tracking-[-1px]">{valor}</div>
      <div className="mt-2.5 text-xs text-white/70 leading-relaxed">
        <strong className="block text-[13px] text-white/90 font-semibold mb-1">{label}</strong>
        {descricao}
      </div>
    </div>
  );
};

// Componente principal da seção
const Estatisticas = () => {
  return (
    <section className="bg-maroon py-[72px] px-6">
      {/* Título */}
      <h2 className="text-center text-[18px] md:text-[26px] font-bold text-white tracking-tight">
        Crescimento previsível com automação inteligente
      </h2>
      
      {/* Subtítulo */}
      <p className="text-center mt-2.5 text-sm text-white/65 max-w-[480px] mx-auto leading-relaxed">
        Nós transformamos o comportamento do cliente em ações automáticas que aumentam vendas e fidelização.
      </p>

      {/* Grid de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[760px] mx-auto mt-14 text-center">
        {estatisticasData.map((estatistica, index) => (
          <ItemEstatistica
            key={index}
            valor={estatistica.valor}
            label={estatistica.label}
            descricao={estatistica.descricao}
          />
        ))}
      </div>
    </section>
  );
};

export default Estatisticas;