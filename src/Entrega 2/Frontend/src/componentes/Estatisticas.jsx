import React, { useState, useEffect, useRef } from 'react';

// Dados das estatísticas
const estatisticasData = [
  {
    valor: 35,
    sufixo: '%',
    prefixo: '+',
    label: 'de recorrência média',
    descricao: 'Campanhas inteligentes aumentam a frequência de compra.'
  },
  {
    valor: 24,
    sufixo: '%',
    prefixo: '+',
    label: 'de vendas recuperadas',
    descricao: 'Clientes inativos voltam com automações personalizadas.'
  },
  {
    valor: 18,
    sufixo: '%',
    prefixo: '+',
    label: 'de aumento no ticket médio',
    descricao: 'Clientes fidelizados compram mais.'
  }
];

// Hook personalizado para detectar quando o elemento está visível
const useVisibilityObserver = (ref) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref]);

  return isVisible;
};

// Componente de contagem animada
const ContagemAnimada = ({ valorFinal, prefixo = '+', sufixo = '%', duracao = 2000 }) => {
  const [contador, setContador] = useState(0);
  const elementoRef = useRef(null);
  const isVisible = useVisibilityObserver(elementoRef);
  const animacaoIniciada = useRef(false);

  useEffect(() => {
    if (isVisible && !animacaoIniciada.current) {
      animacaoIniciada.current = true;
      
      let startTime = null;
      let animationFrame;

      const animar = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duracao, 1);
        
        // Easing function para uma animação mais suave
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const valorAtual = Math.floor(easeOutCubic * valorFinal);
        
        setContador(valorAtual);
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animar);
        } else {
          setContador(valorFinal);
        }
      };

      animationFrame = requestAnimationFrame(animar);
      
      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }
  }, [isVisible, valorFinal, duracao]);

  return (
    <div ref={elementoRef} className="text-[38px] md:text-[56px] font-bold text-white leading-none tracking-[-1px]">
      {prefixo}{contador}{sufixo}
    </div>
  );
};

// Componente do item de estatística
const ItemEstatistica = ({ valor, prefixo, sufixo, label, descricao }) => {
  return (
    <div className="transform transition-all duration-700 hover:scale-105">
      <ContagemAnimada 
        valorFinal={valor} 
        prefixo={prefixo} 
        sufixo={sufixo} 
        duracao={2000}
      />
      <div className="mt-2.5 text-xs text-white/70 leading-relaxed">
        <strong className="block text-[13px] text-white/90 font-semibold mb-1">{label}</strong>
        {descricao}
      </div>
    </div>
  );
};

// Componente principal da seção
const Estatisticas = () => {
  return (
    <section className="bg-maroon py-[72px] px-6 overflow-hidden">
      {/* Título com animação de fade-in */}
      <div className="animate-fade-in-up">
        <h2 className="text-center text-[18px] md:text-[26px] font-bold text-white tracking-tight">
          Crescimento previsível com automação inteligente
        </h2>
      </div>
      
      {/* Subtítulo com animação de fade-in */}
      <div className="animate-fade-in-up animation-delay-200">
        <p className="text-center mt-2.5 text-sm text-white/65 max-w-[480px] mx-auto leading-relaxed">
          Nós transformamos o comportamento do cliente em ações automáticas que aumentam vendas e fidelização.
        </p>
      </div>

      {/* Grid de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[760px] mx-auto mt-14 text-center">
        {estatisticasData.map((estatistica, index) => (
          <div 
            key={index}
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * 200}ms` }}
          >
            <ItemEstatistica
              valor={estatistica.valor}
              prefixo={estatistica.prefixo}
              sufixo={estatistica.sufixo}
              label={estatistica.label}
              descricao={estatistica.descricao}
            />
          </div>
        ))}
      </div>

      {/* CSS para as animações */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
    </section>
  );
};

export default Estatisticas;