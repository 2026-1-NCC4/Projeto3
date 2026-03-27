import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const GraficosAdicionais = ({ mensagensData, faturamentoData }) => {
  const mensagensChartRef = useRef(null);
  const faturamentoChartRef = useRef(null);
  let mensagensChartInstance = null;
  let faturamentoChartInstance = null;

  useEffect(() => {
    if (mensagensChartRef.current) {
      if (mensagensChartInstance) mensagensChartInstance.destroy();
      mensagensChartInstance = new Chart(mensagensChartRef.current, {
        type: 'bar',
        data: {
          labels: mensagensData.labels,
          datasets: [
            {
              label: 'Mensagens Enviadas',
              data: mensagensData.data,
              backgroundColor: '#F26322',
              borderRadius: 8,
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: true },
      });
    }

    if (faturamentoChartRef.current) {
      if (faturamentoChartInstance) faturamentoChartInstance.destroy();
      faturamentoChartInstance = new Chart(faturamentoChartRef.current, {
        type: 'bar',
        data: {
          labels: faturamentoData.labels,
          datasets: [
            {
              label: 'Faturamento (R$)',
              data: faturamentoData.data,
              backgroundColor: '#7A1D1D',
              borderRadius: 8,
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: true },
      });
    }

    return () => {
      if (mensagensChartInstance) mensagensChartInstance.destroy();
      if (faturamentoChartInstance) faturamentoChartInstance.destroy();
    };
  }, [mensagensData, faturamentoData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="font-bold text-text-dark mb-4">📱 Mensagens por Campanha</div>
        <canvas ref={mensagensChartRef} height="200"></canvas>
      </div>
      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="font-bold text-text-dark mb-4">💰 Faturamento por Estabelecimento</div>
        <canvas ref={faturamentoChartRef} height="200"></canvas>
      </div>
    </div>
  );
};

export default GraficosAdicionais;