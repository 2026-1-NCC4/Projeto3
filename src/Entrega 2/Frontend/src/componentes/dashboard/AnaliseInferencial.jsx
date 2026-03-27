import React from 'react';

const AnaliseInferencial = () => {
  return (
    <div className="bg-white border border-border rounded-2xl p-6 mb-8">
      <h3 className="text-lg font-bold text-text-dark mb-4 flex items-center gap-2">📊 Análise Inferencial</h3>
      <div className="bg-cream rounded-2xl p-5">
        <h4 className="font-semibold text-text-dark mb-3">Teste A/B: Campanha A vs Campanha B</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          <div>
            <p><strong>Campanha A (Cupom 15%)</strong></p>
            <p className="text-sm text-text-mid">Conversão: 8.2%</p>
            <p className="text-sm text-text-mid">Vendas: 192</p>
          </div>
          <div>
            <p><strong>Campanha B (Frete Grátis)</strong></p>
            <p className="text-sm text-text-mid">Conversão: 10.4%</p>
            <p className="text-sm text-text-mid">Vendas: 245</p>
          </div>
        </div>
        <div className="bg-border font-mono text-sm py-2 px-3 rounded-lg inline-block">
          📈 Intervalo de Confiança (95%): 2.2% ± 1.8% → Campanha B é significativamente melhor
        </div>
        <p className="text-sm text-text-mid mt-4">
          ✅ A campanha B apresentou resultado superior com p-valor = 0.023, indicando diferença estatisticamente significativa.
        </p>
      </div>
    </div>
  );
};

export default AnaliseInferencial;