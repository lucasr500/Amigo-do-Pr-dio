type Props = {
  cadastrados: number;
  criticosNaoConfirmados: number;
  naoAplica: number;
  naoTenho: number;
  onOpen: () => void;
  precisa: number;
  tenho: number;
  total: number;
};

export default function DocumentosCollapsedButton({
  cadastrados,
  criticosNaoConfirmados,
  naoAplica,
  naoTenho,
  onOpen,
  precisa,
  tenho,
  total,
}: Props) {
  const pct = cadastrados > 0 ? Math.round((tenho / Math.max(1, total - naoAplica)) * 100) : null;
  const subtitle = cadastrados === 0
    ? "Comece por convenção, AVCB, seguro, atas, laudos e contratos."
    : criticosNaoConfirmados > 0
    ? `${tenho} confirmados · ${criticosNaoConfirmados} ${criticosNaoConfirmados > 1 ? "documentos essenciais" : "documento essencial"} a revisar`
    : `${tenho} confirmados · ${precisa} a localizar · ${naoTenho} ausentes`;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={false}
      aria-controls="documentos-essenciais-panel"
      className="flex w-full items-center gap-2.5 rounded-lg border border-navy-100/70 bg-white/[0.82] px-4 py-3.5 text-left shadow-card transition-colors hover:bg-white active:bg-navy-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300/40"
    >
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[9.5px] font-bold tracking-[0.08em] text-navy-500" aria-hidden="true">
        DOC
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-navy-800">Documentos essenciais</span>
        <span className="block truncate text-[11.5px] text-navy-500">{subtitle}</span>
      </span>
      {pct !== null && (
        <span className={`shrink-0 text-[11px] font-semibold ${pct >= 70 ? "text-sage-700" : pct >= 40 ? "text-amber-700" : "text-terracotta-700"}`}>
          {pct}%
        </span>
      )}
      <span className="shrink-0 text-[11.5px] font-semibold text-navy-600">
        {cadastrados === 0 ? "Mapear" : "Ver"}
      </span>
    </button>
  );
}
