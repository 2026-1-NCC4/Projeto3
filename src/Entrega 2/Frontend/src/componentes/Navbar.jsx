import React from 'react';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-orange h-[60px] flex items-center justify-between px-5 md:px-10">
      {/* Logo com Playfair Display */}
      <div className="font-playfair text-[22px] font-black text-white tracking-tight">
        li
      </div>
      <ul className="flex gap-6 md:gap-9 list-none">
        <li>
          <a href="#sobre" className="text-white text-sm font-medium opacity-90 hover:opacity-100 transition font-dm-sans">
            Sobre nós
          </a>
        </li>
        <li>
          <a href="#planos" className="text-white text-sm font-medium opacity-90 hover:opacity-100 transition font-dm-sans">
            Planos
          </a>
        </li>
        <li>
          <a href="#integracoes" className="text-white text-sm font-medium opacity-90 hover:opacity-100 transition font-dm-sans">
            Integrações
          </a>
        </li>
      </ul>
      <div className="w-[34px] h-[34px] rounded-full bg-white/25 flex items-center justify-center cursor-pointer">
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-white">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      </div>
    </nav>
  );
};

export default Navbar;