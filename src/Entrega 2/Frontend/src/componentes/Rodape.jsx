import React from 'react';

const Rodape = () => {
  return (
    <footer className="bg-[#1a1a1a] pt-14 pb-8 px-5 md:px-10">
      <div className="max-w-[940px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 border-b border-white/10">
        
        <div>
          <div className="text-[12px] font-bold text-white/85 uppercase tracking-wide mb-3.5 font-dm-sans">Menu</div>
          <ul className="flex flex-col gap-2">
            <li><a href="#" className="text-[13px] text-white/55 hover:text-orange transition font-dm-sans">A Cannoli</a></li>
            <li><a href="#" className="text-[13px] text-white/55 hover:text-orange transition font-dm-sans">Soluções</a></li>
            <li><a href="#" className="text-[13px] text-white/55 hover:text-orange transition font-dm-sans">Planos</a></li>
            <li><a href="#" className="text-[13px] text-white/55 hover:text-orange transition font-dm-sans">Integrações</a></li>
            <li><a href="#" className="text-[13px] text-white/55 hover:text-orange transition font-dm-sans">Como Funciona</a></li>
          </ul>
        </div>

        <div>
          <div className="text-[12px] font-bold text-white/85 uppercase tracking-wide mb-3.5 font-dm-sans">Soluções</div>
          <ul className="flex flex-col gap-2">
            <li><a href="#" className="text-[13px] text-white/55 hover:text-orange transition font-dm-sans">Conheça seu cliente</a></li>
            <li><a href="#" className="text-[13px] text-white/55 hover:text-orange transition font-dm-sans">Fidelize e retenha</a></li>
            <li><a href="#" className="text-[13px] text-white/55 hover:text-orange transition font-dm-sans">Atraia mais clientes</a></li>
            <li><a href="#" className="text-[13px] text-white/55 hover:text-orange transition font-dm-sans">Ofertas que vendem</a></li>
            <li><a href="#" className="text-[13px] text-white/55 hover:text-orange transition font-dm-sans">Relacionamento que Vence</a></li>
            <li><a href="#" className="text-[13px] text-white/55 hover:text-orange transition font-dm-sans">Decisões com Dados</a></li>
          </ul>
        </div>

        <div>
          <div className="text-[12px] font-bold text-white/85 uppercase tracking-wide mb-3.5 font-dm-sans">Contato</div>
          <div className="space-y-3">
            {/* Email */}
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-white/55 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <a href="mailto:contato@cannoli.food" className="text-[12.5px] text-orange hover:text-orange/80 transition font-dm-sans">
                contato@cannoli.food
              </a>
            </div>
            
            {/* Telefone */}
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-white/55 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span className="text-[12.5px] text-white/55 font-dm-sans">(11) 91680-4011</span>
            </div>
            
            {/* Endereço */}
            <div className="flex items-start gap-2.5">
              <svg className="w-4 h-4 text-white/55 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-[12.5px] text-white/55 leading-relaxed font-dm-sans">
                Av. Ibirapuera, 787 · Avenida Ibirapuera<br />
                São Paulo · SP · 04029-000
              </span>
            </div>
            
            {/* Redes Sociais */}
            <div className="pt-2">
              <strong className="text-[12px] text-white/70 font-semibold block mb-3">Redes Sociais</strong>
              <div className="flex gap-2.5">
                <a href="#" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-orange transition group">
                  <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] fill-white/70 group-hover:fill-white transition">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-orange transition group">
                  <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] fill-white/70 group-hover:fill-white transition">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[12px] font-bold text-white/85 uppercase tracking-wide mb-3.5 font-dm-sans">Acesso Rápido</div>
          <a href="#" className="inline-block mb-2.5 bg-orange text-white text-[13px] font-semibold py-2.5 px-5 rounded-lg hover:bg-[#d6541a] transition font-dm-sans">
            Iniciar Demo
          </a>
          <br />
          <a href="#planos" className="inline-block mt-2 bg-transparent border border-white/20 text-white text-[13px] font-semibold py-2.5 px-5 rounded-lg hover:bg-orange transition font-dm-sans">
            Ver Planos
          </a>
          <p className="text-xs italic text-white/40 mt-2 leading-relaxed font-dm-sans">
            "Transforme dados de clientes em estratégias que geram crescimento real."
          </p>
        </div>
      </div>

      <div className="max-w-[940px] mx-auto mt-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <span className="font-playfair text-lg font-black text-white">Cannoli</span>
        <span className="text-[11px] text-white/30 font-dm-sans">
          © 2024 Cannoli Food Ltda. Todos os direitos reservados. &nbsp;|&nbsp;
          <a href="#" className="text-white/45 hover:text-orange no-underline">Preferências de Cookies</a> &nbsp;|&nbsp;
          <a href="#" className="text-white/45 hover:text-orange no-underline">Soluções</a> &nbsp;|&nbsp;
          <a href="#" className="text-white/45 hover:text-orange no-underline">Planos</a>
        </span>
      </div>
    </footer>
  );
};

export default Rodape;