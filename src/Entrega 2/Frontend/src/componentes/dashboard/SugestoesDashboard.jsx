import React from 'react';

const SugestoesDashboard = ({ sugestoes }) => {
  return (
    <div className="bg-white border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">💡</span>
        <h3 className="text-lg font-bold text-text-dark">Sugestão de Campanhas</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left py-3 px-2 text-xs font-semibold text-text-soft border-b border-border">Segmento</th>
              <th className="text-left py-3 px-2 text-xs font-semibold text-text-soft border-b border-border">Potencial</th>
              <th className="text-left py-3 px-2 text-xs font-semibold text-text-soft border-b border-border">Sugestão</th>
              <th className="text-left py-3 px-2 text-xs font-semibold text-text-soft border-b border-border">ROI Projetado</th>
            </tr>
          </thead>
          <tbody>
            {sugestoes.map((sug, idx) => (
              <tr key={idx} className="hover:bg-orange/5">
                <td className="py-3 px-2 text-sm text-text-mid border-b border-border">{sug.segmento}</td>
                <td className="py-3 px-2 text-sm text-text-mid border-b border-border">{sug.potencial}</td>
                <td className="py-3 px-2 text-sm text-text-mid border-b border-border">{sug.sugestao}</td>
                <td className="py-3 px-2 text-sm text-text-mid border-b border-border">{sug.roi}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SugestoesDashboard;