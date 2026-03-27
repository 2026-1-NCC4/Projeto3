import React, { useState } from 'react';

const FiltrosBar = ({ onFilter }) => {
  const [periodo, setPeriodo] = useState('mes');
  const [unidade, setUnidade] = useState('todas');
  const [canal, setCanal] = useState('todos');
  const [campanha, setCampanha] = useState('todas');

  const handleApply = () => {
    onFilter({ periodo, unidade, canal, campanha });
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-5 mb-8 flex flex-wrap gap-4 items-end">
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-semibold text-text-mid uppercase tracking-wide mb-1.5">📅 Período</label>
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-dm-sans bg-white focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/10"
        >
          <option value="hoje">Hoje</option>
          <option value="semana">Última semana</option>
          <option value="mes">Último mês</option>
          <option value="trimestre">Último trimestre</option>
          <option value="ano">Último ano</option>
        </select>
      </div>
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-semibold text-text-mid uppercase tracking-wide mb-1.5">🏪 Restaurante/Unidade</label>
        <select
          value={unidade}
          onChange={(e) => setUnidade(e.target.value)}
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-dm-sans bg-white focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/10"
        >
          <option value="todas">Todas as unidades</option>
          <option value="matriz">Matriz - Vila Madalena</option>
          <option value="filial1">Filial - Moema</option>
          <option value="filial2">Filial - Pinheiros</option>
        </select>
      </div>
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-semibold text-text-mid uppercase tracking-wide mb-1.5">📱 Canal</label>
        <select
          value={canal}
          onChange={(e) => setCanal(e.target.value)}
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-dm-sans bg-white focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/10"
        >
          <option value="todos">Todos os canais</option>
          <option value="delivery">Delivery Próprio</option>
          <option value="ifood">iFood</option>
          <option value="balcao">Balcão</option>
        </select>
      </div>
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-semibold text-text-mid uppercase tracking-wide mb-1.5">🎯 Campanha</label>
        <select
          value={campanha}
          onChange={(e) => setCampanha(e.target.value)}
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm font-dm-sans bg-white focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange/10"
        >
          <option value="todas">Todas as campanhas</option>
          <option value="blackfriday">Black Friday 2024</option>
          <option value="natal">Natal Especial</option>
          <option value="aniversario">Aniversário LI</option>
        </select>
      </div>
      <button
        onClick={handleApply}
        className="bg-orange text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-orange-dark transition transform hover:-translate-y-0.5"
      >
        Aplicar Filtros
      </button>
    </div>
  );
};

export default FiltrosBar;