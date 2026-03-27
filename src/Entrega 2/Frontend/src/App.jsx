import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage'; // crie um arquivo separado com sua landing page atual
import Dashboard from './componentes/dashboard/Dashboard';
import Login from './componentes/login/Login';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      
    </Routes>
  );
}

export default App;