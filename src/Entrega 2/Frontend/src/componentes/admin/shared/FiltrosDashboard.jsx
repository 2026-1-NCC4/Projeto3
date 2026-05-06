import React from 'react';

const FILTROS_PADRAO = {
  periodo: 'todos',
  empresa: 'todas',
  canal: 'todos',
  tipoPedido: 'todos'
};

const normalizarFiltros = (filtros = {}) => ({
  ...FILTROS_PADRAO,
  ...filtros
});

const FiltrosDashboard = ({
  filtros = FILTROS_PADRAO,
  setFiltros,
  opcoes = {},
  onAplicar,
  onLimpar,
  loading = false,
  exibirEmpresa = true,
  exibirCanal = true,
  exibirTipoPedido = true,
  exibirPeriodo = true,
  titulo = 'Filtros da visão',
  descricao = 'Os filtros recalculam os indicadores exibidos nesta aba.'
}) => {
  const filtrosAtuais = normalizarFiltros(filtros);

  const alterarFiltro = (campo, valor) => {
    setFiltros((estadoAtual) => ({
      ...normalizarFiltros(estadoAtual),
      [campo]: valor
    }));
  };

  const periodos = opcoes.periodos || [];
  const empresas = opcoes.empresas || [];
  const canais = opcoes.canais || [];
  const tiposPedido = opcoes.tiposPedido || [];

  const nomeEmpresaSelecionada = (() => {
    if (!exibirEmpresa || filtrosAtuais.empresa === 'todas') {
      return 'todas as empresas';
    }

    const empresa = empresas.find(
      (item) => String(item.id) === String(filtrosAtuais.empresa)
    );

    return empresa?.nome || 'empresa selecionada';
  })();

  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-orange/10">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-text-dark">
            {titulo}
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            {descricao}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onAplicar}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-60"
          >
            Aplicar filtros
          </button>

          <button
            type="button"
            onClick={onLimpar}
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-orange/10 text-orange font-semibold hover:bg-orange/15 transition disabled:opacity-60"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {exibirPeriodo && (
          <div>
            <label className="text-xs font-semibold text-gray-500">
              Período
            </label>

            <select
              value={filtrosAtuais.periodo}
              onChange={(e) => alterarFiltro('periodo', e.target.value)}
              className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 bg-white text-sm outline-none focus:border-orange"
            >
              <option value="todos">Todos os períodos</option>

              {periodos.map((periodo) => (
                <option key={periodo} value={periodo}>
                  {periodo}
                </option>
              ))}
            </select>
          </div>
        )}

        {exibirEmpresa && (
          <div>
            <label className="text-xs font-semibold text-gray-500">
              Empresa
            </label>

            <select
              value={filtrosAtuais.empresa}
              onChange={(e) => alterarFiltro('empresa', e.target.value)}
              className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 bg-white text-sm outline-none focus:border-orange"
            >
              <option value="todas">Todas as empresas</option>

              {empresas.map((empresa) => (
                <option key={empresa.id} value={empresa.id}>
                  {empresa.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {exibirCanal && (
          <div>
            <label className="text-xs font-semibold text-gray-500">
              Canal
            </label>

            <select
              value={filtrosAtuais.canal}
              onChange={(e) => alterarFiltro('canal', e.target.value)}
              className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 bg-white text-sm outline-none focus:border-orange"
            >
              <option value="todos">Todos os canais</option>

              {canais.map((canal) => (
                <option key={canal} value={canal}>
                  {canal}
                </option>
              ))}
            </select>
          </div>
        )}

        {exibirTipoPedido && (
          <div>
            <label className="text-xs font-semibold text-gray-500">
              Tipo de pedido
            </label>

            <select
              value={filtrosAtuais.tipoPedido}
              onChange={(e) => alterarFiltro('tipoPedido', e.target.value)}
              className="mt-2 w-full border border-orange/10 rounded-xl px-4 py-3 bg-white text-sm outline-none focus:border-orange"
            >
              <option value="todos">Todos os tipos</option>

              {tiposPedido.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mt-5 text-xs text-gray-500">
        Visão atual:{' '}
        <strong>{nomeEmpresaSelecionada}</strong> ·{' '}
        <strong>
          {filtrosAtuais.periodo === 'todos'
            ? 'todos os períodos'
            : filtrosAtuais.periodo}
        </strong>{' '}
        ·{' '}
        <strong>
          {filtrosAtuais.canal === 'todos'
            ? 'todos os canais'
            : filtrosAtuais.canal}
        </strong>{' '}
        ·{' '}
        <strong>
          {filtrosAtuais.tipoPedido === 'todos'
            ? 'todos os tipos'
            : filtrosAtuais.tipoPedido}
        </strong>
      </div>
    </section>
  );
};

export default FiltrosDashboard;