import React from 'react';
import { Activity } from 'lucide-react';

import { formatarMoeda, formatarNumero } from './utils/formatters';

const ApiMockTempoReal = ({
  tempoRealAtivo,
  ultimaAtualizacaoTempoReal,
  resultadoTempoReal,
  erroTempoReal
}) => {
  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-orange/10">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              tempoRealAtivo
                ? 'bg-green-100 text-green-700'
                : 'bg-orange/10 text-orange'
            }`}
          >
            <Activity size={24} />
          </div>

          <div>
            <h2 className="text-xl font-bold text-text-dark">
              API mock em tempo real
            </h2>

            <p className="text-sm text-gray-500 mt-1 max-w-3xl">
              Simula variações positivas e negativas nos dados via API e atualiza automaticamente o dashboard por polling a cada 1 hora.
            </p>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
              <span className="px-3 py-1 rounded-full font-semibold bg-green-100 text-green-700">
                Tempo real ativo
              </span>

              {ultimaAtualizacaoTempoReal && (
                <span className="px-3 py-1 rounded-full bg-orange/10 text-orange font-semibold">
                  Última atualização: {ultimaAtualizacaoTempoReal.toLocaleTimeString('pt-BR')}
                </span>
              )}

              {resultadoTempoReal && (
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                  Último mock:{' '}
                  {resultadoTempoReal.direcao === 'diminuir' ? 'Redução' : 'Aumento'} ·{' '}
                  {formatarNumero(
                    resultadoTempoReal.quantidadeAfetada ||
                    resultadoTempoReal.quantidadeGerada ||
                    0
                  )}{' '}
                  registro(s) ·{' '}
                  {formatarMoeda(
                    resultadoTempoReal.impactoReceita ??
                    resultadoTempoReal.receitaGerada ??
                    0
                  )}
                </span>
              )}
            </div>

            {erroTempoReal && (
              <p className="text-sm text-red-700 mt-3">
                {erroTempoReal}
              </p>
            )}
          </div>
        </div>

        <div className="text-left xl:text-right rounded-2xl bg-green-50 border border-green-100 px-5 py-4 min-w-[210px]">
          <p className="text-xs text-green-700">
            Atualização automática
          </p>

          <p className="text-lg font-bold text-green-700 mt-1">
            Ativa
          </p>

          <p className="text-xs text-gray-500 mt-1">
            Polling a cada 1 hora
          </p>
        </div>
      </div>
    </section>
  );
};

export default ApiMockTempoReal;