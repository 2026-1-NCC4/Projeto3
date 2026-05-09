import React from 'react';

import {
  formatarMoeda,
  formatarNumero,
  formatarPercentual
} from './utils/formatters';

const TooltipSerieTemporal = ({ active, payload, label, tipo }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-orange/10 p-3">
      <p className="text-sm font-bold text-text-dark mb-2">
        {label}
      </p>

      {payload.map((item, index) => {
        const key = String(item.dataKey || '').toLowerCase();
        const valor = item.value;

        const valorFormatado =
          key.includes('variacao')
            ? formatarPercentual(valor)
            : tipo === 'moeda'
              ? formatarMoeda(valor)
              : formatarNumero(valor);

        return (
          <p key={`${item.dataKey}-${index}`} className="text-xs text-gray-600">
            <strong>{item.name || item.dataKey}:</strong> {valorFormatado}
          </p>
        );
      })}
    </div>
  );
};

export default TooltipSerieTemporal;