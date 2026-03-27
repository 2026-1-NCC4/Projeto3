import React from 'react';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      <aside className="fixed left-0 top-0 bottom-0 w-72 bg-orange overflow-y-auto transition-transform duration-300 z-50 ...">
        <div className="p-7 pb-6 border-b border-white/15 mb-6">
          <div className="font-playfair text-4xl font-black text-white tracking-tight flex items-center gap-2">
            li
          </div>
          <div className="mt-5 pt-4 border-t border-white/15">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Olá, Chef!</div>
                <div className="text-white/70 text-xs">Restaurante Parceiro</div>
              </div>
            </div>
            <span className="bg-white/20 text-white text-xs font-medium px-2.5 py-1 rounded-full">Premium</span>
          </div>
        </div>

        <nav className="px-4">
          <a href="#" className="nav-item flex items-center gap-3 px-4 py-3 my-1 rounded-xl text-white/85 hover:bg-white/15 hover:text-white transition">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            Dashboard
          </a>
          <a href="#" className="nav-item flex items-center gap-3 px-4 py-3 my-1 rounded-xl text-white/85 hover:bg-white/15 hover:text-white transition">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
            </svg>
            Campanhas
          </a>
          <a href="#" className="nav-item flex items-center gap-3 px-4 py-3 my-1 rounded-xl text-white/85 hover:bg-white/15 hover:text-white transition">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
            Clientes
          </a>
          <a href="#" className="nav-item flex items-center gap-3 px-4 py-3 my-1 rounded-xl text-white/85 hover:bg-white/15 hover:text-white transition">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M4 6h16v2H4V6zm2-4h12v2H6V2zm16 8H2v12h20V10zm-4 6h-4v-2h4v2z" />
            </svg>
            Financeiro
          </a>
          <div className="h-px bg-white/15 my-4"></div>
          <a href="#" className="nav-item flex items-center gap-3 px-4 py-3 my-1 rounded-xl text-white/85 hover:bg-white/15 hover:text-white transition">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
              <path d="M20 4h-4.2c-.4-1.2-1.5-2-2.8-2h-2c-1.3 0-2.4.8-2.8 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h4v2h8V6h4v12z" />
            </svg>
            Configurações
          </a>
          <a href="#" className="nav-item flex items-center gap-3 px-4 py-3 my-1 rounded-xl text-white/85 hover:bg-white/15 hover:text-white transition">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
            </svg>
            Sair
          </a>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;