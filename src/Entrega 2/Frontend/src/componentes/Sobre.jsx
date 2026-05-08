import React from 'react';

const Sobre = () => {
  return (
    <section id="sobre-cannoli" className="py-24 px-6 bg-gradient-to-b from-white via-cream/40 to-white overflow-hidden">
      <div className="max-w-6xl mx-auto">
        
        {/* Badge indicativo */}
        <div className="flex justify-center mb-6">
          <span className="inline-block px-4 py-1 rounded-full bg-orange/10 text-orange text-xs font-semibold tracking-wider backdrop-blur-sm">
            ⚡ CONHEÇA A CANNOLI
          </span>
        </div>

        {/* Grid 2 colunas no desktop */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          
          {/* Coluna da esquerda - texto */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-text-dark tracking-tight leading-tight">
              Transforme vendas pontuais em{' '}
              <span className="text-orange bg-gradient-to-r from-orange/10 to-transparent px-2 inline-block rounded-lg">
                relacionamento contínuo
              </span>
            </h2>
            
            <p className="text-base text-text-mid leading-relaxed">
              Somos uma plataforma de <strong className="text-text-dark">CRM, fidelização e inteligência de dados</strong> desenvolvida para bares, restaurantes, cafeterias e operações do varejo alimentar. Nosso propósito é ajudar você a conhecer melhor seus clientes, se comunicar de forma personalizada e aumentar a recorrência de consumo.
            </p>

            <p className="text-base text-text-mid leading-relaxed">
              Através da unificação de dados, segmentação inteligente, campanhas automatizadas via WhatsApp e um ecossistema completo com <strong className="text-text-dark">cashback integrado</strong>, a Cannoli permite que cada venda se torne uma oportunidade de construir relacionamento e gerar novas compras.
            </p>

            {/* Lista de pilares com ícones */}
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange/20 flex items-center justify-center mt-0.5">
                  <svg className="w-3.5 h-3.5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-text-mid">Captura de dados no momento da venda</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange/20 flex items-center justify-center mt-0.5">
                  <svg className="w-3.5 h-3.5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-text-mid">Análise de comportamento do consumidor</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange/20 flex items-center justify-center mt-0.5">
                  <svg className="w-3.5 h-3.5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-text-mid">Automação de campanhas estratégicas</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange/20 flex items-center justify-center mt-0.5">
                  <svg className="w-3.5 h-3.5 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-text-mid">Cashback integrado para fidelização</span>
              </div>
            </div>

            {/* Citação / Destaque */}
            <div className="border-l-4 border-orange pl-5 mt-6">
              <p className="text-lg font-medium text-text-dark italic">
                “Fidelização não é sorte. É método, estratégia e uso inteligente de dados.”
              </p>
              <p className="text-sm text-text-mid mt-2">— Cannoli</p>
            </div>

            {/* Botão sutil */}
            <div className="pt-4">
              <button className="group inline-flex items-center gap-2 text-orange font-semibold hover:gap-3 transition-all">
                <span>Quero construir relacionamento com quem já me conhece</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Coluna da direita - elemento visual (gráfico ou ilustração abstrata) */}
          <div className="relative">
            <div className="relative z-10 bg-gradient-to-br from-orange/5 to-white rounded-3xl p-6 border border-orange/20 shadow-xl">
              {/* Ícone decorativo */}
              <div className="absolute -top-5 -right-5 w-20 h-20 bg-orange/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-5 -left-5 w-32 h-32 bg-orange/5 rounded-full blur-3xl"></div>
              
              <div className="relative">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-tr from-orange to-orange-400 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-center text-xl font-bold text-text-dark mb-3">+ de 300 operações já transformam vendas em recorrência</h3>
                <p className="text-center text-sm text-text-mid leading-relaxed">
                  Dados unificados, campanhas no momento certo e menos dependência de marketplaces.
                </p>

                {/* Mini gráfico simulado */}
                <div className="mt-8 bg-white/50 rounded-xl p-4 backdrop-blur-sm border border-border">
                  <div className="flex justify-between items-end h-20 gap-2">
                    <div className="w-full bg-orange/20 rounded-t-lg h-10 transition-all hover:h-14 hover:bg-orange/40"></div>
                    <div className="w-full bg-orange/30 rounded-t-lg h-14 transition-all hover:h-16 hover:bg-orange/50"></div>
                    <div className="w-full bg-orange/40 rounded-t-lg h-16 transition-all hover:h-20 hover:bg-orange/60"></div>
                    <div className="w-full bg-orange/50 rounded-t-lg h-12 transition-all hover:h-18 hover:bg-orange/70"></div>
                    <div className="w-full bg-orange/60 rounded-t-lg h-20 transition-all hover:h-24 hover:bg-orange/80"></div>
                  </div>
                  <p className="text-center text-xs text-text-mid mt-3">↑ Crescimento médio de recorrência</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Linha decorativa final */}
        <div className="mt-20 text-center opacity-60">
          <p className="text-sm text-text-mid max-w-2xl mx-auto">
            Porque servir uma boa refeição é essencial, mas <strong className="text-text-dark">construir relacionamento é o que transforma clientes em fãs da marca.</strong>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Sobre;
