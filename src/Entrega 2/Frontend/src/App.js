import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LandingPage from './LandingPage';
import Dashboard from './componentes/dashboard/Dashboard';
import Login from './componentes/login/Login';
import ConvidarStaff from './componentes/admin/ConvidarStaff';

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
        path="/staff"
        element={
          <PrivateRoute>
            <ConvidarStaff />
          </PrivateRoute>
        }
      />

      <Route path="/admin/dashboard" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;