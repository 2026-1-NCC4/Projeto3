import React from 'react';

const CampanhasDashboard = ({ campanhas }) => {
  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">🎯</span>
        <h3 className="text-lg font-bold text-text-dark">Dashboard de Campanhas</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-3 px-2 text-xs font-semibold text-text-soft border-b border-border">Campanha</th>
              <th className="text-left py-3 px-2 text-xs font-semibold text-text-soft border-b border-border">Mensagens</th>
              <th className="text-left py-3 px-2 text-xs font-semibold text-text-soft border-b border-border">Conversão</th>
              <th className="text-left py-3 px-2 text-xs font-semibold text-text-soft border-b border-border">Vendas</th>
              <th className="text-left py-3 px-2 text-xs font-semibold text-text-soft border-b border-border">ROI</th>
            </tr>
          </thead>
          <tbody>
            {campanhas.map((camp, idx) => (
              <tr key={idx} className="hover:bg-orange/5">
                <td className="py-3 px-2 text-sm text-text-mid border-b border-border">{camp.nome}</td>
                <td className="py-3 px-2 text-sm text-text-mid border-b border-border">{camp.mensagens}</td>
                <td className="py-3 px-2 text-sm text-text-mid border-b border-border">{camp.conversao}</td>
                <td className="py-3 px-2 text-sm text-text-mid border-b border-border">{camp.vendas}</td>
                <td className="py-3 px-2 text-sm text-text-mid border-b border-border">{camp.roi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CampanhasDashboard;