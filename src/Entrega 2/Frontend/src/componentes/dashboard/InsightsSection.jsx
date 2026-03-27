import React from 'react';

const insights = [
  {
    type: 'warning',
    title: '⚠️ Alerta de Recorrência',
    text: 'Taxa de recorrência caiu 5% na última semana. Considere campanha de reativação para clientes inativos.',
    borderColor: 'border-yellow-500',
  },
  {
    type: 'success',
    title: '✅ Oportunidade Identificada',
    text: 'Clientes que compram sobremesas têm ticket 40% maior. Sugerimos upsell automatizado.',
    borderColor: 'border-green-500',
  },
  {
    type: 'danger',
    title: '📉 Queda no Ticket Médio',
    text: 'Ticket médio reduziu 3% na última semana. Analisar mix de produtos ofertados.',
    borderColor: 'border-red-500',
  },
];

const InsightsSection = () => {
  return (
    <div className="bg-gradient-to-r from-maroon to-[#5a1616] rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-3xl">⚡</span>
        <h3 className="text-white text-lg font-bold">Insights e Alertas</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {insights.map((item, idx) => (
          <div
            key={idx}
            className={`bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-l-4 ${item.borderColor}`}
          >
            <div className="text-white font-semibold text-sm mb-2">{item.title}</div>
            <div className="text-white/80 text-xs leading-relaxed">{item.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsightsSection;