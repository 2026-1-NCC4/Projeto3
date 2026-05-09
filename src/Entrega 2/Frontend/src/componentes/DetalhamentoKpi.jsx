import React from 'react';
import { Download, FileText, X } from 'lucide-react';

import StatusBadge from './StatusBadge';
import { exportarCsv, exportarPdf } from './utils/exporters';
import { renderizarValorTabela } from './utils/formatters';

const DetalhamentoKpi = ({ detalheSelecionado, onFechar }) => {
  if (!detalheSelecionado) {
    return null;
  }

  return (
    <section
      id="detalhamento-kpi"
      className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-orange/10"
    >
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-text-dark">
            {detalheSelecionado.titulo}
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {detalheSelecionado.descricao}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() =>
              exportarCsv({
                nomeArquivo: detalheSelecionado.nomeArquivo,
                colunas: detalheSelecionado.colunas,
                dados: detalheSelecionado.dados
              })
            }
            disabled={!detalheSelecionado.dados || detalheSelecionado.dados.length === 0}
            className="px-4 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-50 flex items-center gap-2"
          >
            <Download size={18} />
            Exportar CSV
          </button>

          <button
            type="button"
            onClick={() =>
              exportarPdf({
                titulo: detalheSelecionado.titulo,
                descricao: detalheSelecionado.descricao,
                nomeArquivo: detalheSelecionado.nomeArquivo,
                colunas: detalheSelecionado.colunas,
                dados: detalheSelecionado.dados
              })
            }
            disabled={!detalheSelecionado.dados || detalheSelecionado.dados.length === 0}
            className="px-4 py-3 rounded-xl bg-white border border-orange/20 text-orange font-semibold hover:bg-orange/5 transition disabled:opacity-50 flex items-center gap-2"
          >
            <FileText size={18} />
            Exportar PDF
          </button>

          <button
            type="button"
            onClick={onFechar}
            className="px-4 py-3 rounded-xl bg-orange/10 text-orange font-semibold hover:bg-orange/15 transition flex items-center gap-2"
          >
            <X size={18} />
            Fechar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              {detalheSelecionado.colunas.map((coluna) => (
                <th key={coluna.key} className="py-3 pr-4">
                  {coluna.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {(detalheSelecionado.dados || []).slice(0, 30).map((item, index) => (
              <tr key={index} className="border-b last:border-b-0">
                {detalheSelecionado.colunas.map((coluna) => (
                  <td key={coluna.key} className="py-3 pr-4">
                    {coluna.key === 'status' ? (
                      <StatusBadge status={item[coluna.key]} />
                    ) : (
                      renderizarValorTabela(coluna.key, item[coluna.key])
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {(!detalheSelecionado.dados || detalheSelecionado.dados.length === 0) && (
              <tr>
                <td
                  colSpan={detalheSelecionado.colunas.length}
                  className="py-6 text-center text-gray-500"
                >
                  Nenhum dado encontrado para este detalhamento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detalheSelecionado.dados?.length > 30 && (
        <p className="text-xs text-gray-500 mt-4">
          Mostrando os primeiros 30 registros. A exportação CSV inclui todos os registros disponíveis.
        </p>
      )}
    </section>
  );
};

export default DetalhamentoKpi;