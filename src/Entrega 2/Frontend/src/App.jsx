import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './LandingPage';

import Dashboard from './componentes/dashboard/Dashboard';
import Login from './componentes/login/Login';

import ConvidarStaff from './componentes/admin/ConvidarStaff';
import ConvidarEmpresas from './componentes/admin/ConvidarEmpresas';
import Empresas from './componentes/admin/Empresas';
import Campanhas from './componentes/admin/Campanhas';
import Clientes from './componentes/admin/Clientes';
import Financeiro from './componentes/admin/Financeiro';
import Configuracoes from './componentes/admin/Configuracoes';
import Recomendacoes from './componentes/admin/Recomendacoes';
import ImportacaoDados from './componentes/admin/ImportacaoDados';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/empresas"
        element={
          <PrivateRoute>
            <Empresas />
          </PrivateRoute>
        }
      />

      <Route
        path="/campanhas"
        element={
          <PrivateRoute>
            <Campanhas />
          </PrivateRoute>
        }
      />

      <Route
        path="/recomendacoes"
        element={
          <PrivateRoute>
            <Recomendacoes />
          </PrivateRoute>
        }
      />

      <Route
        path="/clientes"
        element={
          <PrivateRoute>
            <Clientes />
          </PrivateRoute>
        }
      />

      <Route
        path="/financeiro"
        element={
          <PrivateRoute>
            <Financeiro />
          </PrivateRoute>
        }
      />

      <Route
        path="/importacao-dados"
        element={
          <PrivateRoute>
            <ImportacaoDados />
          </PrivateRoute>
        }
      />

      <Route
        path="/configuracoes"
        element={
          <PrivateRoute>
            <Configuracoes />
          </PrivateRoute>
        }
      />

      <Route
        path="/staff"
        element={
          <PrivateRoute>
            <ConvidarStaff />
          </PrivateRoute>
        }
      />

      <Route
        path="/convidar-empresas"
        element={
          <PrivateRoute>
            <ConvidarEmpresas />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;