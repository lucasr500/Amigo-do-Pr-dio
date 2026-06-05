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
    ? "AVCB, seguro, convenção, brigada e outros — mapeie a documentação do prédio"
    : criticosNaoConfirmados > 0
    ? `${tenho} confirmados · ${criticosNaoConfirmados} documento${criticosNaoConfirmados > 1 ? "s" : ""} crítico${criticosNaoConfirmados > 1 ? "s" : ""} sem confirmar`
    : `${tenho} confirmados · ${precisa} a localizar · ${naoTenho} ausentes`;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-expanded={false}
      aria-controls="documentos-essenciais-panel"
      className="flex w-full items-center gap-2.5 rounded-[18px] border border-cream-200/90 bg-white/78 px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(31,49,71,0.03)] transition-colors hover:bg-white active:bg-navy-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-300/40"
    >
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[10px] font-bold text-navy-500" aria-hidden="true">
        DOC
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-navy-800">Documentos essenciais</span>
        <span className="block truncate text-[11.5px] text-navy-400">{subtitle}</span>
      </span>
      {pct !== null && (
        <span className={`shrink-0 text-[11px] font-semibold ${pct >= 70 ? "text-teal-600" : pct >= 40 ? "text-amber-600" : "text-terracotta-600"}`}>
          {pct}%
        </span>
      )}
      <span className="shrink-0 text-[11.5px] font-semibold text-navy-500">
        {cadastrados === 0 ? "Mapear →" : "Ver →"}
      </span>
    </button>
  );
}
