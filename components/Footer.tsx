export default function Footer() {
  return (
    <footer className="mt-auto border-t border-navy-100/60 px-5 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-display text-[13px] italic text-navy-400 sm:text-[13.5px]">
          Amigo do Prédio
        </p>
        <p className="text-[10.5px] text-navy-300">
          © {new Date().getFullYear()} — Feito com cuidado para síndicos e conselheiros
        </p>
      </div>
    </footer>
  );
}
