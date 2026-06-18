// Estado de erro premium — irmão visual do EmptyState.
// Cartão sereno e tranquilizador: comunica que os dados locais estão preservados
// e oferece uma ação de recuperação. Puramente apresentacional.

type ErrorStateProps = {
  /** Pequeno rótulo superior (ex.: nome da seção que falhou). */
  eyebrow?: string;
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export default function ErrorState({
  eyebrow,
  title = "Não foi possível carregar.",
  description = "Seus dados locais estão preservados. Tente novamente ou exporte um backup pelo Condomínio.",
  retryLabel = "Tentar novamente",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-2xl border border-navy-100/80 bg-white/[0.88] px-5 py-6 text-center shadow-card"
    >
      <span
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-inset ring-amber-100"
        aria-hidden="true"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path d="M12 8.5v4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16.2" r="1" fill="currentColor" />
          <path d="M10.3 4.2 2.6 17.8A2 2 0 0 0 4.3 21h15.4a2 2 0 0 0 1.7-3.2L13.7 4.2a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </span>
      {eyebrow && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-300">{eyebrow}</p>
      )}
      <p className="mt-1 text-[14px] font-semibold text-navy-800">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[300px] text-[12px] leading-relaxed text-navy-500">{description}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full bg-navy-700 px-5 py-2.5 text-[12px] font-semibold text-cream-50 shadow-card transition-colors hover:bg-navy-800 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300/50"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
