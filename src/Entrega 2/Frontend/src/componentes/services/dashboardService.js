import { API_URL } from '../constants/dashboardConstants';

export async function buscarDashboard({
  token,
  isPainelCannoli,
  filtros
}) {
  const params = new URLSearchParams();

  params.append('periodo', filtros.periodo);
  params.append('canal', filtros.canal);
  params.append('tipoPedido', filtros.tipoPedido);

  let endpoint = `${API_URL}/company-dashboard`;

  if (isPainelCannoli) {
    endpoint = `${API_URL}/admin-dashboard`;
    params.append('empresa', filtros.empresa);
  }

  const response = await fetch(`${endpoint}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erro ao carregar dashboard.');
  }

  return data.data;
}