import React from 'react';

const DashboardHeader = ({ onExport }) => {
  return (
    <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
      <div>
        <h1 className="font-dm-sans text-2xl md:text-3xl font-bold text-text-dark">Painel de Indicadores</h1>
        <p className="text-sm text-text-soft mt-1">Visão estratégica e operacional do seu negócio</p>
      </div>
      <button
        onClick={onExport}
        className="bg-transparent border border-border text-text-mid hover:bg-cream hover:border-orange transition px-6 py-2.5 rounded-lg font-semibold text-sm"
      >
        📥 Exportar Relatório
      </button>
    </div>
  );
};

export default DashboardHeader;