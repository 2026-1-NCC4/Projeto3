import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const GraficosGrid = ({ vendasData, segmentacaoData }) => {
  const vendasChartRef = useRef(null);
  const segmentacaoChartRef = useRef(null);
  let vendasChartInstance = null;
  let segmentacaoChartInstance = null;

  useEffect(() => {
    if (vendasChartRef.current) {
      if (vendasChartInstance) vendasChartInstance.destroy();
      vendasChartInstance = new Chart(vendasChartRef.current, {
        type: 'line',
        data: {
          labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'],
          datasets: [
            {
              label: 'Período Atual',
              data: vendasData.atual,
              borderColor: '#F26322',
              backgroundColor: 'rgba(242, 99, 34, 0.1)',
              tension: 0.4,
              fill: true,
            },
            {
              label: 'Período Anterior',
              data: vendasData.anterior,
              borderColor: '#7A1D1D',
              backgroundColor: 'rgba(122, 29, 29, 0.1)',
              tension: 0.4,
              fill: true,
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: true },
      });
    }

    if (segmentacaoChartRef.current) {
      if (segmentacaoChartInstance) segmentacaoChartInstance.destroy();
      segmentacaoChartInstance = new Chart(segmentacaoChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Clientes Recorrentes', 'Novos Clientes'],
          datasets: [
            {
              data: [segmentacaoData.recorrentes, segmentacaoData.novos],
              backgroundColor: ['#F26322', '#7A1D1D'],
              borderWidth: 0,
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: true },
      });
    }

    return () => {
      if (vendasChartInstance) vendasChartInstance.destroy();
      if (segmentacaoChartInstance) segmentacaoChartInstance.destroy();
    };
  }, [vendasData, segmentacaoData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="mb-4">
          <div className="font-bold text-text-dark">Evolução de Vendas</div>
          <div className="text-xs text-text-soft mt-1">Comparativo período atual vs anterior</div>
        </div>
        <canvas ref={vendasChartRef} height="250"></canvas>
      </div>
      <div className="bg-white border border-border rounded-2xl p-5">
        <div className="mb-4">
          <div className="font-bold text-text-dark">Segmentação de Clientes</div>
          <div className="text-xs text-text-soft mt-1">Novos vs Recorrentes</div>
        </div>
        <canvas ref={segmentacaoChartRef} height="250"></canvas>
      </div>
    </div>
  );
};

export default GraficosGrid;