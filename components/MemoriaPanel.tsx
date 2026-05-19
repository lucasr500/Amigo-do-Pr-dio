"use client";

import { useEffect, useState } from "react";
import {
  addPendencia,
  getMemoriaOperacional,
  getPendenciasAbertas,
  saveMemoriaOperacional,
  getProfile,
  logInteraction,
  MemoriaOperacional,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

type Props = {
  onSaved?: () => void;
  autoExpand?: boolean;
};

type Campo = {
  key: keyof MemoriaOperacional;
  label: string;
  sublabel?: string;
  tipo: "data" | "texto";
  placeholder?: string;
  icon: string;
  grupo: "vencimentos" | "manutencoes" | "fornecedores";
};

const CAMPOS: Campo[] = [
  {
    key: "vencimentoAVCB",
    label: "Vencimento do AVCB",
    sublabel: "Auto de Vistoria do Corpo de Bombeiros",
    tipo: "data",
    icon: "📋",
    grupo: "vencimentos",
  },
  {
    key: "vencimentoSeguro",
    label: "Vencimento do seguro",
    sublabel: "Seguro condominial obrigatório por lei",
    tipo: "data",
    icon: "🛡️",
    grupo: "vencimentos",
  },
  {
    key: "fimMandatoSindico",
    label: "Fim do mandato do síndico",
    sublabel: "Registre para lembrar de convocar a assembleia de eleição ou recondução com antecedência",
    tipo: "data",
    icon: "🗳️",
    grupo: "vencimentos",
  },
  {
    key: "ultimaAGO",
    label: "Última AGO realizada",
    sublabel: "Assembleia Geral Ordinária",
    tipo: "data",
    icon: "👥",
    grupo: "manutencoes",
  },
  {
    key: "ultimaDedetizacao",
    label: "Última dedetização",
    tipo: "data",
    icon: "🐛",
    grupo: "manutencoes",
  },
  {
    key: "ultimaLimpezaCaixaDAgua",
    label: "Última limpeza da caixa d'água",
    tipo: "data",
    icon: "💧",
    grupo: "manutencoes",
  },
  {
    key: "ultimaManutencaoElevador",
    label: "Última manutenção do elevador",
    tipo: "data",
    icon: "🛗",
    grupo: "manutencoes",
  },
  {
    key: "ultimaInspecaoExtintores",
    label: "Última inspeção de extintores",
    tipo: "data",
    icon: "🧯",
    grupo: "manutencoes",
  },
  {
    key: "ultimaVistoriaSPDA",
    label: "Última vistoria do para-raios",
    sublabel: "SPDA — Sistema de Proteção contra Descargas Atmosféricas",
    tipo: "data",
    icon: "⚡",
    grupo: "manutencoes",
  },
  {
    key: "ultimaVistoriaEletrica",
    label: "Última vistoria elétrica",
    tipo: "data",
    icon: "🔌",
    grupo: "manutencoes",
  },
  {
    key: "administradora",
    label: "Administradora atual",
    tipo: "texto",
    icon: "🏢",
    placeholder: "Nome da administradora",
    grupo: "fornecedores",
  },
  {
    key: "prestadoraElevador",
    label: "Empresa do elevador",
    tipo: "texto",
    icon: "🔧",
    placeholder: "Nome da empresa",
    grupo: "fornecedores",
  },
];

const ESSENTIAL_KEYS: Array<keyof MemoriaOperacional> = [
  "vencimentoAVCB", "vencimentoSeguro", "fimMandatoSindico",
];

const MANUTENCAO_KEYS: Array<keyof MemoriaOperacional> = [
  "ultimaAGO", "ultimaDedetizacao", "ultimaLimpezaCaixaDAgua",
  "ultimaManutencaoElevador", "ultimaInspecaoExtintores",
  "ultimaVistoriaSPDA", "ultimaVistoriaEletrica",
];

const GRUPO_LABEL: Record<string, string> = {
  vencimentos:  "Essenciais",
  manutencoes:  "Manutenções e rotinas",
  fornecedores: "Fornecedores",
};

// Títulos e campo de telemetria para pendências criadas via "lembrar depois"
const MEMORIA_LEMBRAR: Partial<Record<keyof MemoriaOperacional, { titulo: string; campo: string }>> = {
  vencimentoAVCB:    { titulo: "Cadastrar data do AVCB",                    campo: "avcb" },
  vencimentoSeguro:  { titulo: "Cadastrar vencimento do seguro condominial", campo: "seguro" },
  fimMandatoSindico: { titulo: "Cadastrar fim do mandato do síndico",        campo: "mandato" },
};

export default function MemoriaPanel({ onSaved, autoExpand }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<MemoriaOperacional>({});
  const [hasElevador, setHasElevador] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedSummary, setSavedSummary] = useState<string[]>([]);
  const [showManutencoes, setShowManutencoes] = useState(false);
  const [savedMemoriaIds, setSavedMemoriaIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const memoria = getMemoriaOperacional();
    const profile = getProfile();
    setDraft(memoria);
    setHasElevador(profile?.hasElevador === true);
    setShowManutencoes(MANUTENCAO_KEYS.some((k) => memoria[k]));
    const existing = getPendenciasAbertas()
      .filter((p) => p.origem === "memoria" && !!p.matchedId)
      .map((p) => p.matchedId!);
    setSavedMemoriaIds(new Set(existing));
    setHydrated(true);
  }, []);

  // Autoexpand quando solicitado pelo pai (após salvar perfil)
  useEffect(() => {
    if (autoExpand && hydrated && !expanded) {
      setExpanded(true);
      const mem = getMemoriaOperacional();
      const eCount = ESSENTIAL_KEYS.filter((k) => mem[k] && mem[k] !== "").length;
      setShowManutencoes(eCount >= 3 || MANUTENCAO_KEYS.some((k) => mem[k]));
    }
  }, [autoExpand, hydrated, expanded]);

  if (!hydrated) return null;

  const essentialCount = ESSENTIAL_KEYS.filter((k) => draft[k] && draft[k] !== "").length;
  const manutencaoFilled = MANUTENCAO_KEYS.filter((k) => draft[k] && draft[k] !== "").length;

  const set = <K extends keyof MemoriaOperacional>(key: K, value: MemoriaOperacional[K]) => {
    setSaved(false);
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleLembrarDepois = (key: keyof MemoriaOperacional) => {
    if (savedMemoriaIds.has(key)) return;
    const entry = MEMORIA_LEMBRAR[key];
    if (!entry) return;
    addPendencia({ titulo: entry.titulo, categoria: "gestao", origem: "memoria", matchedId: String(key) });
    void trackEvent("pendencia_created_from_memoria", { field: entry.campo });
    setSavedMemoriaIds((prev) => new Set([...prev, key]));
  };

  const salvar = () => {
    saveMemoriaOperacional(draft);
    logInteraction("memoria-operacional-salva", String(Object.keys(draft).length));
    void trackEvent("memoria_saved", { item_count: Object.values(draft).filter(v => v && v !== "").length });

    const lines: string[] = [];
    if (draft.vencimentoAVCB) {
      const dt = new Date(draft.vencimentoAVCB);
      if (!isNaN(dt.getTime())) {
        const d = Math.floor((dt.getTime() - Date.now()) / 86400000);
        lines.push(d > 0 ? `AVCB · válido por ${d} dias` : "AVCB · vencido");
      }
    }
    if (draft.vencimentoSeguro) {
      const dt = new Date(draft.vencimentoSeguro);
      if (!isNaN(dt.getTime())) {
        const d = Math.floor((dt.getTime() - Date.now()) / 86400000);
        lines.push(d > 0 ? `Seguro · válido por ${d} dias` : "Seguro · vencido");
      }
    }
    if (draft.fimMandatoSindico) {
      const dt = new Date(draft.fimMandatoSindico);
      if (!isNaN(dt.getTime())) {
        const d = Math.floor((dt.getTime() - Date.now()) / 86400000);
        lines.push(d > 0 ? `Mandato · ${d} dias restantes` : "Mandato · vencido");
      }
    }
    const manutencaoCount = [
      draft.ultimaAGO, draft.ultimaDedetizacao, draft.ultimaLimpezaCaixaDAgua,
      draft.ultimaManutencaoElevador, draft.ultimaInspecaoExtintores,
      draft.ultimaVistoriaSPDA, draft.ultimaVistoriaEletrica,
    ].filter(Boolean).length;
    if (manutencaoCount > 0) lines.push(`${manutencaoCount} manutenção${manutencaoCount > 1 ? "ões" : ""} registrada${manutencaoCount > 1 ? "s" : ""}`);

    setSavedSummary(lines);
    setSaved(true);
    setTimeout(() => {
      setExpanded(false);
      setSaved(false);
      setSavedSummary([]);
      onSaved?.();
    }, 1600);
  };

  const camposFiltrados = CAMPOS.filter((c) => {
    if ((c.key === "ultimaManutencaoElevador" || c.key === "prestadoraElevador") && !hasElevador) return false;
    return true;
  });

  const grupos = Array.from(new Set(camposFiltrados.map((c) => c.grupo)));

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (!expanded) {
    const ctaLabel =
      essentialCount === 0 ? "Registrar →"
      : essentialCount < 3 ? "Completar →"
      : "Atualizar →";

    const collapsedSubtitle =
      essentialCount === 0
        ? "AVCB, seguro e mandato — registre para monitoramento ativo"
        : essentialCount < 3
        ? `${essentialCount} de 3 essenciais · ${3 - essentialCount} ${3 - essentialCount === 1 ? "faltando" : "faltando"}`
        : manutencaoFilled > 0
        ? `Essenciais completos · ${manutencaoFilled} rotina${manutencaoFilled > 1 ? "s" : ""} registrada${manutencaoFilled > 1 ? "s" : ""}`
        : "Essenciais completos · adicionar manutenções e rotinas?";

    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            setShowManutencoes(essentialCount >= 3 || manutencaoFilled > 0);
            logInteraction("memoria-panel-aberto", "");
          }}
          className="flex w-full items-center gap-2.5 rounded-[18px] border border-cream-200/90 bg-white/78 px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(31,49,71,0.03)] transition-colors hover:bg-white active:bg-navy-50"
        >
          <span
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[13px]"
            aria-hidden="true"
          >
            📋
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-navy-800">
              Vencimentos e manutenções
            </p>
            <p className="text-[11.5px] text-navy-400">
              {collapsedSubtitle}
            </p>
          </div>
          <span className="flex-shrink-0 text-[11.5px] font-semibold text-navy-500">
            {ctaLabel}
          </span>
        </button>
      </section>
    );
  }

  // ── Expanded ───────────────────────────────────────────────────────────────
  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="rounded-[22px] border border-cream-200/90 bg-white/92 p-4 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_14px_30px_-24px_rgba(31,49,71,0.30)]">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-navy-800">
            Vencimentos e manutenções
          </p>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[11.5px] text-navy-400 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        {/* Nota introdutória — visível apenas quando nenhum essencial foi preenchido */}
        {essentialCount === 0 && (
          <div className="mb-4 rounded-xl bg-navy-50/60 px-3.5 py-3">
            <p className="text-[12px] leading-relaxed text-navy-600">
              Comece pelas três datas mais importantes — AVCB, seguro e mandato do síndico. As manutenções e rotinas podem ser adicionadas depois.
            </p>
          </div>
        )}

        {grupos.map((grupo) => {
          const campos = camposFiltrados.filter((c) => c.grupo === grupo);
          const isManutencoes = grupo === "manutencoes";
          const manutencoesFilled = isManutencoes
            ? campos.filter(({ key }) => draft[key] && draft[key] !== "").length
            : 0;

          return (
            <div key={grupo} className="mb-4">
              {isManutencoes ? (
                <button
                  type="button"
                  onClick={() => setShowManutencoes((v) => !v)}
                  className="mb-2 flex w-full items-center justify-between"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">
                    {GRUPO_LABEL[grupo]}
                    {manutencoesFilled > 0 && !showManutencoes && (
                      <span className="ml-1.5 normal-case tracking-normal text-navy-300">
                        · {manutencoesFilled} preenchido{manutencoesFilled > 1 ? "s" : ""}
                      </span>
                    )}
                  </p>
                  <span className="text-[11px] text-navy-400">
                    {showManutencoes ? "Recolher ↑" : "Expandir ↓"}
                  </span>
                </button>
              ) : grupo === "vencimentos" ? (
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">
                    Essenciais
                  </p>
                  <div className="flex items-center gap-1">
                    {ESSENTIAL_KEYS.map((k) => (
                      <span
                        key={k}
                        className={`h-1.5 w-1.5 rounded-full ${
                          draft[k] && draft[k] !== "" ? "bg-navy-500" : "bg-navy-200"
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-[10px] text-navy-400">{essentialCount}/3</span>
                  </div>
                </div>
              ) : (
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-navy-400">
                  {GRUPO_LABEL[grupo]}
                </p>
              )}

              {(!isManutencoes || showManutencoes) && (
                <div className="flex flex-col gap-3">
                  {campos.map(({ key, label, sublabel, tipo, placeholder, icon }) => (
                    <div key={key} className="flex items-start gap-2.5">
                      <span className="mt-3.5 flex-shrink-0 text-[15px] leading-none" aria-hidden="true">
                        {icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] font-medium text-navy-700 mb-0.5">{label}</p>
                        {sublabel && (
                          <p className="text-[10px] text-navy-400 mb-1 leading-tight">{sublabel}</p>
                        )}
                        {tipo === "data" ? (
                          <input
                            type="date"
                            value={draft[key] as string ?? ""}
                            onChange={(e) => set(key, e.target.value || undefined)}
                            className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
                          />
                        ) : (
                          <input
                            type="text"
                            value={draft[key] as string ?? ""}
                            onChange={(e) => set(key, e.target.value || undefined)}
                            placeholder={placeholder}
                            className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 placeholder-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
                          />
                        )}
                        {/* Lembrar depois — apenas nos essenciais quando o campo está vazio */}
                        {ESSENTIAL_KEYS.includes(key) && !(draft[key] && draft[key] !== "") && (
                          <button
                            type="button"
                            disabled={savedMemoriaIds.has(key)}
                            onClick={() => handleLembrarDepois(key)}
                            className={`mt-1.5 inline-flex items-center gap-1 text-[11px] transition-colors ${
                              savedMemoriaIds.has(key)
                                ? "cursor-default text-navy-400"
                                : "text-navy-400 hover:text-navy-600"
                            }`}
                          >
                            {savedMemoriaIds.has(key) ? "Lembrete salvo ✓" : "Não sei agora — lembrar depois"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-2 border-t border-navy-50 pt-3">
          {saved ? (
            <div className="animate-fade-in">
              <p className="mb-1 text-[12.5px] font-semibold text-navy-700">✓ Memória atualizada</p>
              {savedSummary.length > 0 && (
                <div className="flex flex-col gap-0.5">
                  {savedSummary.map((line) => (
                    <p key={line} className="text-[11.5px] text-navy-500">{line}</p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={salvar}
                className="min-h-10 rounded-xl bg-navy-700 px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.98]"
              >
                Salvar
              </button>
              <p className="text-[11px] text-navy-400">Todos os campos são opcionais</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
