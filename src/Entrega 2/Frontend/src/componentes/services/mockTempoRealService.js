import { API_URL } from '../constants/dashboardConstants';

export async function atualizarDadosMockTempoReal({
  token,
  variacaoMock
}) {
  const response = await fetch(`${API_URL}/mock-tempo-real/atualizar-dados`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(variacaoMock)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Erro ao atualizar dados simulados.');
  }

  return data.data;
}