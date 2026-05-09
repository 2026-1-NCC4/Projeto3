import React from 'react';

const CardGrafico = ({ titulo, descricao, children }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-orange/10">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-text-dark">
          {titulo}
        </h2>

        {descricao && (
          <p className="text-sm text-gray-500 mt-1">
            {descricao}
          </p>
        )}
      </div>

      <div className="h-80">
        {children}
      </div>
    </div>
  );
};

export default CardGrafico;