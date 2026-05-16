"use client";

import { useEffect, useState } from "react";
import {
  getMemoriaOperacional,
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

const GRUPO_LABEL: Record<string, string> = {
  vencimentos:  "Vencimentos",
  manutencoes:  "Manutenções realizadas",
  fornecedores: "Fornecedores",
};

export default function MemoriaPanel({ onSaved, autoExpand }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<MemoriaOperacional>({});
  const [hasElevador, setHasElevador] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedSummary, setSavedSummary] = useState<string[]>([]);
  const [showManutencoes, setShowManutencoes] = useState(false);

  useEffect(() => {
    const memoria = getMemoriaOperacional();
    const profile = getProfile();
    setDraft(memoria);
    setHasElevador(profile?.hasElevador === true);
    const manutencaoKeys: Array<keyof MemoriaOperacional> = [
      "ultimaAGO", "ultimaDedetizacao", "ultimaLimpezaCaixaDAgua",
      "ultimaManutencaoElevador", "ultimaInspecaoExtintores",
      "ultimaVistoriaSPDA", "ultimaVistoriaEletrica",
    ];
    const hasManutencoesData = manutencaoKeys.some((k) => memoria[k]);
    setShowManutencoes(hasManutencoesData);
    setHydrated(true);
  }, []);

  // Autoexpand quando solicitado pelo pai (após salvar perfil)
  useEffect(() => {
    if (autoExpand && hydrated && !expanded) {
      setExpanded(true);
      setShowManutencoes(true);
    }
  }, [autoExpand, hydrated, expanded]);

  if (!hydrated) return null;

  const set = <K extends keyof MemoriaOperacional>(key: K, value: MemoriaOperacional[K]) => {
    setSaved(false);
    setDraft((prev) => ({ ...prev, [key]: value }));
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

  const filledCount = Object.values(draft).filter((v) => v && v !== "").length;

  const camposFiltrados = CAMPOS.filter((c) => {
    if ((c.key === "ultimaManutencaoElevador" || c.key === "prestadoraElevador") && !hasElevador) return false;
    return true;
  });

  const grupos = Array.from(new Set(camposFiltrados.map((c) => c.grupo)));

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            setShowManutencoes(true);
            logInteraction("memoria-panel-aberto", "");
          }}
          className="flex w-full items-center gap-2.5 rounded-xl border border-navy-100 bg-white/70 px-4 py-3 text-left transition-colors hover:bg-white active:bg-navy-50"
        >
          <span
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[13px]"
            aria-hidden="true"
          >
            📋
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-navy-800">
              Datas e manutenções do prédio
            </p>
            <p className="text-[11.5px] text-navy-400">
              {filledCount > 0
                ? `${filledCount} item${filledCount > 1 ? "s" : ""} registrado${filledCount > 1 ? "s" : ""} · manter atualizado`
                : "Ativa o monitoramento inteligente do condomínio"}
            </p>
          </div>
          <span className="flex-shrink-0 text-[11.5px] font-semibold text-navy-500">
            {filledCount > 0 ? "Atualizar →" : "Registrar →"}
          </span>
        </button>
      </section>
    );
  }

  // ── Expanded ───────────────────────────────────────────────────────────────
  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="rounded-2xl border border-navy-100 bg-white/90 p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-navy-800">
            Datas e manutenções
          </p>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[11.5px] text-navy-400 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        {/* Nota introdutória — visível apenas quando filledCount === 0 */}
        {filledCount === 0 && (
          <div className="mb-4 rounded-xl bg-navy-50/60 px-3.5 py-3">
            <p className="text-[12px] leading-relaxed text-navy-600">
              Preencha o que souber. Cada data registrada ativa um item de
              monitoramento na aba Início. Você pode completar o restante depois.
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
                            className="w-full rounded-lg border border-navy-100 bg-navy-50/30 px-2.5 py-1.5 text-[12.5px] text-navy-800 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-200"
                          />
                        ) : (
                          <input
                            type="text"
                            value={draft[key] as string ?? ""}
                            onChange={(e) => set(key, e.target.value || undefined)}
                            placeholder={placeholder}
                            className="w-full rounded-lg border border-navy-100 bg-navy-50/30 px-2.5 py-1.5 text-[12.5px] text-navy-800 placeholder-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-200"
                          />
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
              <p className="mb-1 text-[12.5px] font-semibold text-sage-700">✓ Memória atualizada</p>
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
                className="rounded-xl bg-navy-700 px-5 py-1.5 text-[12.5px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-95"
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
