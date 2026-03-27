const API_URL = 'http://localhost:3001/api';

const getToken = () => {
  return localStorage.getItem('violetaflow_token') || sessionStorage.getItem('violetaflow_token');
};

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
};

// API de Tarefas
export const tarefasAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/tarefas`, { headers: getHeaders() });
    return response.json();
  },
  create: async (tarefa) => {
    const response = await fetch(`${API_URL}/tarefas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(tarefa)
    });
    return response.json();
  },
  update: async (id, tarefa) => {
    const response = await fetch(`${API_URL}/tarefas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(tarefa)
    });
    return response.json();
  },
  mover: async (id, novoStatus) => {
    const response = await fetch(`${API_URL}/tarefas/${id}/mover`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ novoStatus })
    });
    return response.json();
  },
  delete: async (id) => {
    const response = await fetch(`${API_URL}/tarefas/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.json();
  }
};

// API de Eventos
export const eventosAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/eventos`, { headers: getHeaders() });
    return response.json();
  },
  create: async (evento) => {
    const response = await fetch(`${API_URL}/eventos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(evento)
    });
    return response.json();
  },
  update: async (id, evento) => {
    const response = await fetch(`${API_URL}/eventos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(evento)
    });
    return response.json();
  },
  delete: async (id) => {
    const response = await fetch(`${API_URL}/eventos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.json();
  }
};