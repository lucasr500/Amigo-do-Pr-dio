"use client";

const NAV_ITEMS = [
  { id: "overview",       label: "Visão" },
  { id: "visao-geral",    label: "Meu prédio" },
  { id: "revisao-mensal", label: "Revisão" },
  { id: "financeiro",     label: "Financeiro" },
  { id: "documentos",     label: "Documentos" },
  { id: "operacao",       label: "Operação" },
  { id: "dados",          label: "Dados" },
] as const;

export default function CondominioQuickNav() {
  const scrollTo = (id: string) => {
    if (typeof window === "undefined") return;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Seções do condomínio"
      className="overflow-x-auto px-5 pb-2 pt-1 sm:px-6"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex gap-2" style={{ minWidth: "max-content" }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => scrollTo(item.id)}
            className="flex-shrink-0 rounded-full border border-navy-100 bg-white px-3 py-1.5 text-[11.5px] font-medium text-navy-600 shadow-sm transition-all hover:border-navy-200 hover:bg-navy-50 active:scale-[0.97]"
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
