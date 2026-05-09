import React from 'react';

const StatusBadge = ({ status }) => {
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${
        status === 'saudavel'
          ? 'bg-green-100 text-green-700'
          : status === 'atencao'
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-red-100 text-red-700'
      }`}
    >
      {status}
    </span>
  );
};

export default StatusBadge;