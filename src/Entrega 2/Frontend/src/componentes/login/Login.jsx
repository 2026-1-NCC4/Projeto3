import React from 'react';
import PainelEsquerdo from './PainelEsquerdo';
import CardLogin from './CardLogin';

const Login = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <PainelEsquerdo />
      <div className="flex-1 bg-cream flex items-center justify-center p-8 md:p-12">
        <CardLogin />
      </div>
    </div>
  );
};

export default Login;