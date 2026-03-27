import React from 'react';

const KPICard = ({ title, value, change, changeType, icon, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-border rounded-2xl p-5 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-orange-light"
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs font-semibold text-text-soft uppercase tracking-wide">{title}</span>
        <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-xl">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-text-dark mb-2">{value}</div>
      <div className={`text-xs flex items-center gap-1 ${changeType === 'positive' ? 'text-success' : 'text-danger'}`}>
        {changeType === 'positive' ? '↑' : '↓'} {change} vs período anterior
      </div>
    </div>
  );
};

const KPIGrid = ({ kpis, onKpiClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5 mb-8">
      {kpis.map((kpi, index) => (
        <KPICard
          key={index}
          title={kpi.title}
          value={kpi.value}
          change={kpi.change}
          changeType={kpi.changeType}
          icon={kpi.icon}
          onClick={() => onKpiClick(kpi.id)}
        />
      ))}
    </div>
  );
};

export default KPIGrid;