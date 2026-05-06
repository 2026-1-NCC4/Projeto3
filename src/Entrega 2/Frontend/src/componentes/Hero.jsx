import React from 'react';
import { useNavigate } from 'react-router-dom';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[760px] bg-orange overflow-hidden px-6 pt-[110px] pb-[170px]">
      {/* Background decorativo */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white rounded-full blur-3xl" />
        <div className="absolute top-40 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/2 w-72 h-72 bg-white rounded-full blur-3xl" />
      </div>

      {/* Grid suave */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        {/* Texto principal */}
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 text-white px-4 py-2 rounded-full text-sm font-medium mb-7 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-white" />
            CRM inteligente para retenção e vendas
          </div>

          <h1 className="font-playfair text-[58px] md:text-[86px] lg:text-[104px] font-black text-white leading-[0.9] tracking-[-3px]">
            Cannoli
          </h1>

          <p className="mt-7 text-2xl md:text-4xl font-bold text-white leading-tight max-w-2xl mx-auto lg:mx-0">
            Cliente esquecido é{' '}
            <span className="relative inline-block">
              dinheiro perdido
              <span className="absolute left-0 -bottom-1 w-full h-2 bg-white/25 rounded-full" />
            </span>
            .
          </p>

          <p className="mt-6 text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
            Transforme histórico de compras em inteligência comercial, campanhas de reativação
            e insights para vender mais para quem já conhece sua marca.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="group bg-white text-orange font-bold px-7 py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
            >
              <span className="w-9 h-9 rounded-xl bg-orange/10 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-orange"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                </svg>
              </span>
              Acessar plataforma
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="border border-white/35 text-white font-semibold px-7 py-4 rounded-2xl hover:bg-white/10 transition-all backdrop-blur-sm"
            >
              Criar conta
            </button>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl mx-auto lg:mx-0">
            <div className="bg-white/12 border border-white/20 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">CRM</p>
              <p className="text-xs text-white/75 mt-1">Dados centralizados</p>
            </div>

            <div className="bg-white/12 border border-white/20 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">KPIs</p>
              <p className="text-xs text-white/75 mt-1">Painéis dinâmicos</p>
            </div>

            <div className="bg-white/12 border border-white/20 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white">IA</p>
              <p className="text-xs text-white/75 mt-1">Insights de ação</p>
            </div>
          </div>
        </div>

        {/* Card visual do dashboard */}
        <div className="relative hidden lg:block">
          <div className="absolute -inset-6 bg-white/20 rounded-[2rem] blur-2xl" />

          <div className="relative bg-white/95 rounded-[2rem] shadow-2xl p-6 border border-white/70">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-gray-500">Painel Cannoli</p>
                <h3 className="text-xl font-bold text-gray-900">
                  Visão comercial
                </h3>
              </div>

              <div className="w-11 h-11 rounded-2xl bg-orange text-white flex items-center justify-center">
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="M7 14l4-4 3 3 5-7" />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-orange/10 rounded-2xl p-4">
                <p className="text-xs text-gray-500">Receita</p>
                <p className="text-xl font-bold text-gray-900 mt-1">R$ 84k</p>
              </div>

              <div className="bg-gray-100 rounded-2xl p-4">
                <p className="text-xs text-gray-500">Pedidos</p>
                <p className="text-xl font-bold text-gray-900 mt-1">2.1k</p>
              </div>

              <div className="bg-gray-100 rounded-2xl p-4">
                <p className="text-xs text-gray-500">Retorno</p>
                <p className="text-xl font-bold text-gray-900 mt-1">32%</p>
              </div>
            </div>

            <div className="h-56 bg-gray-50 rounded-2xl p-5 flex items-end gap-4">
              {[42, 76, 58, 95, 71, 115, 88].map((altura, index) => (
                <div key={index} className="flex-1 flex items-end">
                  <div
                    className="w-full bg-orange rounded-t-xl"
                    style={{ height: `${altura}px` }}
                  />
                </div>
              ))}
            </div>

            <div className="mt-5 bg-green-50 border border-green-100 rounded-2xl p-4">
              <p className="text-sm font-semibold text-green-700">
                Insight detectado
              </p>
              <p className="text-xs text-green-700/80 mt-1">
                Clientes inativos têm alto potencial de reativação nesta semana.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Onda inferior */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg viewBox="0 0 1440 120" className="w-full h-[120px]" preserveAspectRatio="none">
          <path
            d="M0,40 C240,120 480,0 720,60 C960,120 1200,20 1440,60 L1440,120 L0,120 Z"
            fill="#FFF"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;