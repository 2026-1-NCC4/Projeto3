import React from 'react';

const KpiCard = ({ titulo, valor, descricao, icon: Icon, status, onClick }) => {
  const statusClass =
    status === 'risco'
      ? 'bg-red-100 text-red-700'
      : status === 'atencao'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-orange/10 text-orange';

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm p-6 border border-orange/10 hover:shadow-md transition-all text-left w-full"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">{titulo}</p>

          <h3 className="text-3xl font-bold mt-2 text-text-dark">
            {valor}
          </h3>

          {descricao && (
            <p className="text-xs text-gray-400 mt-2">
              {descricao}
            </p>
          )}

          <p className="text-xs text-orange font-semibold mt-3">
            Clique para detalhar
          </p>
        </div>

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${statusClass}`}>
          <Icon size={24} />
        </div>
      </div>
    </button>
  );
};

export default KpiCard;