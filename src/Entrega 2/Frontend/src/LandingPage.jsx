import React from 'react';
import Navbar from './componentes/Navbar';
import Hero from './componentes/Hero';
import Recursos from './componentes/Recursos';
import Sobre from './componentes/Sobre'; // <-- importe do novo componente
import Estatisticas from './componentes/Estatisticas';
import Integracoes from './componentes/Integracoes';
import Planos from './componentes/Planos';
import Rodape from './componentes/Rodape';

function App() {
  return (
    <div className="font-dm-sans text-text-dark bg-cream overflow-x-hidden">
      <Navbar />
      <Hero />
       <Sobre />   
      <Estatisticas />
       <Recursos />
      <Integracoes />
      <Planos />
      <Rodape />
    </div>
  );
}

export default App;