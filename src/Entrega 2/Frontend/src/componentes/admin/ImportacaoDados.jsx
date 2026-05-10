import React, { useEffect, useState } from 'react';
import Sidebar from '../dashboard/Sidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const formatarNumero = (valor) => {
  return Number(valor || 0).toLocaleString('pt-BR');
};

const formatarData = (valor) => {
  if (!valor) return '-';

  return new Date(valor).toLocaleString('pt-BR');
};

const statusLabel = {
  processado: 'Processado',
  processado_com_alertas: 'Processado com alertas',
  erro: 'Erro'
};

const statusClasse = {
  processado: 'bg-green-100 text-green-700 border-green-200',
  processado_com_alertas: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  erro: 'bg-red-100 text-red-700 border-red-200'
};

const tiposBase = [
  { value: 'generico', label: 'Genérico' },
  { value: 'stores', label: 'Empresas / Restaurantes' },
  { value: 'pedidos', label: 'Pedidos' },
  { value: 'clientes', label: 'Clientes' },
  { value: 'enderecos', label: 'Endereços de clientes' },
  { value: 'campanhas', label: 'Campanhas' },
  { value: 'campanhas_pedidos', label: 'Campanhas x Pedidos' },
  { value: 'templates', label: 'Templates' }
];

const CardResumo = ({ titulo, valor, descricao }) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
      <p className="text-sm text-gray-500">{titulo}</p>

      <h2 className="text-3xl font-bold mt-2 text-text-dark">
        {valor}
      </h2>

      {descricao && (
        <p className="text-xs text-gray-400 mt-2">
          {descricao}
        </p>
      )}
    </div>
  );
};

const ImportacaoDados = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [arquivo, setArquivo] = useState(null);
  const [tipoBase, setTipoBase] = useState('generico');
  const [historico, setHistorico] = useState([]);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const token = localStorage.getItem('token');

  const fontePoppins = {
    fontFamily: "'Poppins', sans-serif"
  };

  const carregarHistorico = async () => {
    try {
      setCarregandoHistorico(true);

      const response = await fetch(`${API_URL}/importacao-dados/historico`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || 'Erro ao carregar histórico de importações.');
      }

      setHistorico(json.data || []);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  const limparMensagens = () => {
    setTimeout(() => {
      setErro('');
      setSucesso('');
    }, 4000);
  };

  const handleImportar = async (event) => {
    event.preventDefault();

    try {
      setErro('');
      setSucesso('');
      setResultado(null);

      if (!arquivo) {
        setErro('Selecione um arquivo CSV, XLS ou XLSX antes de importar.');
        limparMensagens();
        return;
      }

      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('tipoBase', tipoBase);

      setLoading(true);

      const response = await fetch(`${API_URL}/importacao-dados`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.detail || json.message || 'Erro ao importar arquivo.');
      }

      setResultado(json.data);
      setSucesso(json.message || 'Arquivo importado com sucesso.');
      setArquivo(null);

      await carregarHistorico();
      limparMensagens();
    } catch (error) {
      setErro(error.message);
      limparMensagens();
    } finally {
      setLoading(false);
    }
  };

  const totalImportacoes = historico.length;

  const totalLinhasAceitas = historico.reduce(
    (acc, item) => acc + Number(item.linhasAceitas || 0),
    0
  );

  const totalLinhasRejeitadas = historico.reduce(
    (acc, item) => acc + Number(item.linhasRejeitadas || 0),
    0
  );

  const totalLinhasDuplicadas = historico.reduce(
    (acc, item) => acc + Number(item.linhasDuplicadas || 0),
    0
  );

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 lg:ml-72">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden fixed top-4 left-4 z-50 bg-orange p-2 rounded-lg shadow-lg"
        >
          <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>

        <main className="p-5 lg:p-8">
          <header
            className="mb-8"
            style={fontePoppins}
          >
            <h1
              className="text-3xl font-bold text-text-dark"
              style={fontePoppins}
            >
              Importação de Dados
            </h1>

            <p
              className="text-sm text-gray-500 mt-2 max-w-3xl"
              style={fontePoppins}
            >
              Envie arquivos CSV ou Excel para validação, tratamento básico,
              deduplicação e registro de qualidade dos dados.
            </p>
          </header>

          {erro && (
            <section className="bg-red-100 rounded-2xl p-5 border border-red-300 text-red-700 mb-6">
              {erro}
            </section>
          )}

          {sucesso && (
            <section className="bg-green-100 rounded-2xl p-5 border border-green-300 text-green-700 mb-6">
              {sucesso}
            </section>
          )}

          <section className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
            <CardResumo
              titulo="Importações registradas"
              valor={formatarNumero(totalImportacoes)}
              descricao="Últimos registros armazenados no banco"
            />

            <CardResumo
              titulo="Linhas aceitas"
              valor={formatarNumero(totalLinhasAceitas)}
              descricao="Linhas válidas processadas"
            />

            <CardResumo
              titulo="Linhas rejeitadas"
              valor={formatarNumero(totalLinhasRejeitadas)}
              descricao="Linhas com campos obrigatórios ausentes"
            />

            <CardResumo
              titulo="Duplicadas"
              valor={formatarNumero(totalLinhasDuplicadas)}
              descricao="Linhas duplicadas identificadas"
            />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm xl:col-span-1">
              <h2 className="text-xl font-bold mb-2">
                Nova importação
              </h2>

              <p className="text-sm text-gray-500 mb-5">
                Selecione a base e envie um arquivo CSV, XLS ou XLSX.
              </p>

              <form onSubmit={handleImportar} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Tipo de base
                  </label>

                  <select
                    value={tipoBase}
                    onChange={(event) => setTipoBase(event.target.value)}
                    className="w-full rounded-xl border border-orange/20 px-4 py-3 outline-none focus:border-orange bg-white"
                  >
                    {tiposBase.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Arquivo
                  </label>

                  <input
                    type="file"
                    accept=".csv,.xls,.xlsx"
                    onChange={(event) => setArquivo(event.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-orange/20 px-4 py-3 outline-none focus:border-orange bg-white"
                  />

                  {arquivo && (
                    <p className="text-xs text-gray-500 mt-2">
                      Arquivo selecionado: {arquivo.name}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-5 py-3 rounded-xl bg-orange text-white font-semibold hover:bg-orange-dark transition disabled:opacity-50"
                >
                  {loading ? 'Importando...' : 'Importar e validar'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm xl:col-span-2">
              <h2 className="text-xl font-bold mb-2">
                Resultado da última importação
              </h2>

              <p className="text-sm text-gray-500 mb-5">
                Resumo de qualidade do arquivo processado.
              </p>

              {!resultado && (
                <div className="rounded-2xl bg-orange/5 border border-orange/10 p-6 text-sm text-gray-500">
                  Nenhuma importação realizada nesta sessão.
                </div>
              )}

              {resultado && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-5">
                    <CardResumo
                      titulo="Total"
                      valor={formatarNumero(resultado.totalLinhas)}
                    />

                    <CardResumo
                      titulo="Aceitas"
                      valor={formatarNumero(resultado.linhasAceitas)}
                    />

                    <CardResumo
                      titulo="Rejeitadas"
                      valor={formatarNumero(resultado.linhasRejeitadas)}
                    />

                    <CardResumo
                      titulo="Duplicadas"
                      valor={formatarNumero(resultado.linhasDuplicadas)}
                    />

                    <CardResumo
                      titulo="Campos faltantes"
                      valor={formatarNumero(resultado.camposFaltantes)}
                    />
                  </div>

                  <div className="rounded-2xl bg-orange/5 border border-orange/10 p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div>
                        <p className="font-bold">{resultado.nomeArquivo}</p>
                        <p className="text-sm text-gray-500">
                          Base: {resultado.tipoBase} · Tipo: {resultado.tipoArquivo}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          statusClasse[resultado.statusProcessamento] ||
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        {statusLabel[resultado.statusProcessamento] || resultado.statusProcessamento}
                      </span>
                    </div>

                    {resultado.detalhesRejeicao?.length > 0 && (
                      <div className="mt-5">
                        <p className="font-semibold text-sm mb-2">
                          Primeiras rejeições encontradas
                        </p>

                        <div className="space-y-2">
                          {resultado.detalhesRejeicao.map((item, index) => (
                            <div
                              key={index}
                              className="rounded-xl bg-white border border-orange/10 p-3 text-sm"
                            >
                              Linha {item.linha}: {item.motivo}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="bg-white rounded-2xl p-6 border border-orange/10 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold">
                  Histórico de importações
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Registro de data/hora, qualidade dos dados e status do processamento.
                </p>
              </div>

              <button
                type="button"
                onClick={carregarHistorico}
                disabled={carregandoHistorico}
                className="px-5 py-3 rounded-xl border border-orange/20 text-orange font-semibold hover:bg-orange/5 transition disabled:opacity-50"
              >
                {carregandoHistorico ? 'Atualizando...' : 'Atualizar histórico'}
              </button>
            </div>

            {carregandoHistorico && (
              <p className="text-sm text-gray-500">
                Carregando histórico...
              </p>
            )}

            {!carregandoHistorico && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-3 pr-4">Arquivo</th>
                      <th className="py-3 pr-4">Origem/base</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Total</th>
                      <th className="py-3 pr-4">Aceitas</th>
                      <th className="py-3 pr-4">Rejeitadas</th>
                      <th className="py-3 pr-4">Duplicadas</th>
                      <th className="py-3 pr-4">Campos faltantes</th>
                      <th className="py-3 pr-4">Finalizado em</th>
                    </tr>
                  </thead>

                  <tbody>
                    {historico.map((item) => (
                      <tr key={item.id} className="border-b last:border-b-0">
                        <td className="py-3 pr-4 font-medium">
                          {item.nomeArquivo}
                        </td>

                        <td className="py-3 pr-4">
                          {item.origem}
                        </td>

                        <td className="py-3 pr-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              statusClasse[item.statusProcessamento] ||
                              'bg-gray-100 text-gray-700 border-gray-200'
                            }`}
                          >
                            {statusLabel[item.statusProcessamento] || item.statusProcessamento}
                          </span>
                        </td>

                        <td className="py-3 pr-4">
                          {formatarNumero(item.totalLinhas)}
                        </td>

                        <td className="py-3 pr-4">
                          {formatarNumero(item.linhasAceitas)}
                        </td>

                        <td className="py-3 pr-4">
                          {formatarNumero(item.linhasRejeitadas)}
                        </td>

                        <td className="py-3 pr-4">
                          {formatarNumero(item.linhasDuplicadas)}
                        </td>

                        <td className="py-3 pr-4">
                          {formatarNumero(item.camposFaltantes)}
                        </td>

                        <td className="py-3 pr-4">
                          {formatarData(item.finalizadoEm)}
                        </td>
                      </tr>
                    ))}

                    {historico.length === 0 && (
                      <tr>
                        <td colSpan="9" className="py-6 text-center text-gray-500">
                          Nenhuma importação registrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default ImportacaoDados;
