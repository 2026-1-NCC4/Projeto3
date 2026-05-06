const API_URL = 'http://localhost:3001/api';

export async function buscarAdminDashboard(filtros = {}) {
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');

  const params = new URLSearchParams({
    periodo: filtros.periodo || 'todos',
    empresa: filtros.empresa || 'todas',
    canal: filtros.canal || 'todos',
    tipoPedido: filtros.tipoPedido || 'todos'
  });

  const response = await fetch(`${API_URL}/admin-dashboard?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erro ao carregar dashboard administrativo.');
  }

  return data.data;
}