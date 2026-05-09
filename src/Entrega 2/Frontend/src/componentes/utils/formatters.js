export const formatarMoeda = (valor) => {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

export const formatarNumero = (valor) => {
  return Number(valor || 0).toLocaleString('pt-BR');
};

export const formatarPercentual = (valor) => {
  return `${Number(valor || 0).toFixed(2)}%`;
};

export const renderizarValorTabela = (key, valor) => {
  const chave = String(key || '').toLowerCase();

  if (chave.includes('receita')) return formatarMoeda(valor);
  if (chave.includes('ticket')) return formatarMoeda(valor);
  if (chave.includes('recorrencia')) return formatarPercentual(valor);
  if (chave.includes('conversao')) return formatarPercentual(valor);
  if (chave.includes('crescimento')) return formatarPercentual(valor);
  if (chave.includes('pedidos')) return formatarNumero(valor);
  if (chave.includes('clientes')) return formatarNumero(valor);
  if (chave.includes('mensagens')) return formatarNumero(valor);
  if (chave.includes('score')) return formatarNumero(valor);

  return valor ?? '-';
};