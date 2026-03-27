import React from 'react';

const Hero = () => {
  return (
    <section className="bg-orange text-center py-[72px] px-6 pb-[100px]">
      {/* Garantindo a fonte Playfair Display com fallback */}
      <h1 className="font-playfair text-[64px] md:text-[96px] font-black text-white leading-none tracking-[-2px] animate-fade-up">
        Cannoli
      </h1>
      <p className="mt-3.5 text-base font-normal text-white/90 leading-relaxed animate-fade-up-delay">
        Transforme dados em clientes<br />fiéis
      </p>
    </section>
  );
};

export default Hero;