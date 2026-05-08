import React from 'react';

const recursosData = [
  {
    etiqueta: 'Dados',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z" />
        <path d="M4 7v5c0 1.7 3.6 3 8 3s8-1.3 8-3V7" />
        <path d="M4 12v5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5" />
      </svg>
    ),
    titulo: 'Dados centralizados',
    descricao:
      'Organize pedidos, clientes, campanhas e histórico de compras em uma base única para acompanhar o negócio com mais clareza.'
  },
  {
    etiqueta: 'Segmentação',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="7" r="2" />
        <circle cx="16" cy="17" r="3" />
        <path d="M10.5 9.5l3.5 5" />
        <path d="M10.7 7.6l4.4-.4" />
      </svg>
    ),
    titulo: 'Clientes por comportamento',
    descricao:
      'Identifique clientes ativos, inativos, recorrentes e em risco para apoiar campanhas mais precisas e ações de reativação.'
  },
  {
    etiqueta: 'Performance',
    icone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 3v18h18" />
        <path d="M7 15l4-4 3 3 5-7" />
        <path d="M19 7v5h-5" />
      </svg>
    ),
    titulo: 'Indicadores em evolução',
    descricao:
      'Acompanhe receita, pedidos, ticket médio, recorrência e campanhas com indicadores preparados para atualização dinâmica.'
  }
];

const CardRecurso = ({ etiqueta, icone, titulo, descricao }) => {
  return (
    <div className="group relative overflow-hidden rounded-[28px] border border-orange/10 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(242,99,34,0.16)]">
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-orange/10 blur-2xl transition-all duration-300 group-hover:bg-orange/20" />

      <div className="relative">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-orange/10 text-orange transition-all duration-300 group-hover:scale-105 group-hover:bg-orange group-hover:text-white">
            {icone}
          </div>

          <span className="rounded-full border border-orange/15 bg-orange/5 px-3 py-1 text-xs font-semibold text-orange">
            {etiqueta}
          </span>
        </div>

        <h3 className="text-lg font-bold text-text-dark">
          {titulo}
        </h3>

        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          {descricao}
        </p>
      </div>
    </div>
  );
};

const Recursos = () => {
  return (
    <section
      id="sobre"
      className="relative overflow-hidden bg-white px-6 py-28"
    >
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-orange/5 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-orange/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange/15 bg-orange/5 px-4 py-2 text-sm font-semibold text-orange">
            <span className="h-2 w-2 rounded-full bg-orange" />
            Sobre a solução
          </span>

          <h2 className="mt-6 text-3xl font-black tracking-tight text-text-dark md:text-5xl">
            Transforme dados em decisões comerciais.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-gray-500 md:text-lg">
            A Cannoli organiza a base de clientes e transforma histórico de compras em
            indicadores, segmentações e oportunidades de ação para aumentar retenção e vendas.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {recursosData.map((recurso, index) => (
            <CardRecurso
              key={index}
              etiqueta={recurso.etiqueta}
              icone={recurso.icone}
              titulo={recurso.titulo}
              descricao={recurso.descricao}
            />
          ))}
        </div>

        <div className="mt-14 rounded-[30px] border border-orange/10 bg-gradient-to-r from-orange/10 via-orange/5 to-transparent p-6 md:p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div>
              <p className="text-3xl font-black text-orange">01</p>
              <h3 className="mt-2 font-bold text-text-dark">Importe a base</h3>
              <p className="mt-2 text-sm text-gray-500">
                Comece com os dados existentes em Excel e transforme a base em informação estruturada.
              </p>
            </div>

            <div>
              <p className="text-3xl font-black text-orange">02</p>
              <h3 className="mt-2 font-bold text-text-dark">Calcule indicadores</h3>
              <p className="mt-2 text-sm text-gray-500">
                O motor analítico prepara KPIs, rankings, segmentações e alertas para o painel.
              </p>
            </div>

            <div>
              <p className="text-3xl font-black text-orange">03</p>
              <h3 className="mt-2 font-bold text-text-dark">Aja com mais precisão</h3>
              <p className="mt-2 text-sm text-gray-500">
                Use os insights para reativar clientes, acompanhar campanhas e priorizar oportunidades.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Recursos;