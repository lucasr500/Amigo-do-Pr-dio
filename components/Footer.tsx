export default function Footer() {
  return (
    <footer className="mt-auto border-t border-navy-100/70 bg-cream-100/40 px-5 py-6 sm:px-6 sm:py-7">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="font-display text-[13px] italic text-navy-500 sm:text-[13.5px]">
          Amigo do Prédio — seu assistente condominial
        </p>

        <p className="text-[11px] text-navy-400">
          Mais temas sendo adicionados regularmente.
        </p>

        <p className="mt-1 text-[10.5px] text-navy-300">
          © {new Date().getFullYear()} — Feito com cuidado para síndicos e
          conselheiros
        </p>
      </div>
    </footer>
  );
}
