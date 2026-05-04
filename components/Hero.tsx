export default function Hero() {
  return (
    <section className="px-5 pt-3 pb-6 sm:px-6 sm:pt-4 sm:pb-8">
      <div className="animate-fade-in-up stagger-1">
        <h2 className="font-display text-[28px] font-medium leading-[1.1] tracking-tight text-navy-800 sm:text-[34px]">
          Respostas rápidas para a{" "}
          <span className="relative inline-block">
            <span className="relative z-10 italic text-navy-900">rotina</span>
            <span
              aria-hidden="true"
              className="absolute bottom-0.5 left-0 right-0 z-0 h-2.5 bg-sage-200/70"
            />
          </span>{" "}
          do seu condomínio
        </h2>
        <p className="mt-3 text-[14.5px] leading-relaxed text-navy-500 sm:text-[15px]">
          Sem linguagem complicada. Sem espera. Sem dor de cabeça.
        </p>
      </div>
    </section>
  );
}
