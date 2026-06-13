// Estado de carregamento premium — irmão visual do EmptyState.
// Esqueleto discreto (animate-pulse) que evita "tela em branco" durante cargas
// sob demanda. Puramente apresentacional; sem dependência de dados/rede.

type LoadingStateProps = {
  /** Rótulo acessível e visível (ex.: "Carregando saúde…"). */
  label?: string;
  /** Quantidade de linhas do esqueleto. */
  rows?: number;
};

export default function LoadingState({ label = "Carregando…", rows = 3 }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="rounded-2xl border border-navy-100/70 bg-white/[0.82] px-4 py-5 shadow-card"
    >
      <span className="sr-only">{label}</span>
      <div className="flex items-center gap-3" aria-hidden="true">
        <span className="h-9 w-9 flex-shrink-0 animate-pulse rounded-2xl bg-navy-100/70" />
        <div className="min-w-0 flex-1 space-y-2">
          <span className="block h-3 w-1/3 animate-pulse rounded-full bg-navy-100/70" />
          <span className="block h-2.5 w-2/3 animate-pulse rounded-full bg-navy-100/50" />
        </div>
      </div>
      <div className="mt-4 space-y-2.5" aria-hidden="true">
        {Array.from({ length: Math.max(1, rows) }).map((_, i) => (
          <span
            key={i}
            className="block h-2.5 animate-pulse rounded-full bg-navy-100/45"
            style={{ width: `${92 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}
