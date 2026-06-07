"use client";

import { useEffect, useState } from "react";
import {
  getImplantacaoMode,
  getMemoriaAssistida,
  getDocumentos,
  getFuncionarios,
  getMemoriaOperacional,
  getProfile,
  DOCUMENTOS_ESSENCIAIS_IDS,
  type ImplantacaoMode,
} from "@/lib/session";

type ResolveTarget = "condominio" | "ferramentas" | "agenda";

type CheckItem = {
  id: string;
  label: string;
  hint?: string;
  done: boolean;
  resolveTarget?: ResolveTarget;
};

type Section = {
  title: string;
  items: CheckItem[];
};

type Props = {
  onNavigate?: (target: ResolveTarget) => void;
};

function buildChecklist(mode: ImplantacaoMode | null): Section[] {
  const m         = getMemoriaOperacional();
  const profile   = getProfile();
  const assistida = getMemoriaAssistida();
  const docs      = getDocumentos();
  const funcs     = getFuncionarios();

  const avcbOk    = !!(assistida.avcb?.value || m.vencimentoAVCB);
  const seguroOk  = !!(assistida.seguro?.value || m.vencimentoSeguro);
  const mandatoOk = !!(assistida.mandato?.value || m.fimMandatoSindico);

  const docsRegistrados = docs.length;
  const docsConfirmados = docs.filter((d) => d.status === "tenho").length;
  const docsPct = docsRegistrados > 0
    ? Math.round((docsConfirmados / DOCUMENTOS_ESSENCIAIS_IDS.length) * 100)
    : 0;

  const funcsOk = funcs.length > 0
    ? funcs.every((f) => f.status === "em_dia" || f.status === "a_vencer")
    : null;

  const rotinas = [
    m.ultimaDedetizacao, m.ultimaLimpezaCaixaDAgua,
    m.ultimaManutencaoElevador, m.ultimaInspecaoExtintores,
  ];
  const rotinasOk = rotinas.filter(Boolean).length >= 2;

  const sections: Section[] = [
    {
      title: "Documentos e registros",
      items: [
        {
          id: "avcb",
          label: "AVCB ou CLCB registrado",
          hint: "Informe na aba Vencimentos",
          done: avcbOk,
          resolveTarget: "condominio",
        },
        {
          id: "seguro",
          label: "Apólice do seguro predial registrada",
          hint: "Informe na aba Vencimentos",
          done: seguroOk,
          resolveTarget: "condominio",
        },
        {
          id: "mandato",
          label: "Fim do mandato do síndico registrado",
          hint: "Informe na aba Vencimentos",
          done: mandatoOk,
          resolveTarget: "condominio",
        },
        {
          id: "docs_mapeados",
          label: docsRegistrados > 0
            ? `Documentos essenciais mapeados — ${docsPct}% confirmados`
            : "Mapear situação dos documentos essenciais",
          hint: "Acesse Documentação Essencial",
          done: docsRegistrados > 0 && docsPct >= 50,
          resolveTarget: "condominio",
        },
      ],
    },
    {
      title: "Pessoal e contratos",
      items: [
        {
          id: "funcionarios",
          label: funcs.length === 0
            ? "Registrar funcionários e situação de férias"
            : funcsOk === true
              ? `Férias dos funcionários em dia (${funcs.length})`
              : `Férias a regularizar (${funcs.filter((f) => f.status === "vencida" || f.status === "desconhecida").length} funcionário${funcs.filter((f) => f.status === "vencida" || f.status === "desconhecida").length > 1 ? "s" : ""})`,
          hint: "Acesse Pessoal e Contratos",
          done: funcs.length > 0 && funcsOk === true,
          resolveTarget: "condominio",
        },
        {
          id: "contrato_elevador",
          label: "Contrato de manutenção de elevadores localizado",
          done: docs.some((d) => d.id === "contrato_elevador" && d.status === "tenho"),
          resolveTarget: "condominio",
        },
        {
          id: "contrato_limpeza",
          label: "Contrato de limpeza localizado",
          done: docs.some((d) => d.id === "contrato_limpeza" && d.status === "tenho"),
          resolveTarget: "condominio",
        },
      ],
    },
    {
      title: "Rotinas operacionais",
      items: [
        {
          id: "rotinas",
          label: `Manutenções registradas — ${rotinas.filter(Boolean).length} de 4 rotinas-base`,
          hint: "Informe na aba Vencimentos e Rotinas",
          done: rotinasOk,
          resolveTarget: "condominio",
        },
        {
          id: "convencao",
          label: "Convenção condominial localizada",
          done: docs.some((d) => d.id === "convencao" && d.status === "tenho"),
          resolveTarget: "condominio",
        },
        {
          id: "ata_eleicao",
          label: "Ata de eleição do síndico localizada",
          done: docs.some((d) => d.id === "ata_eleicao" && d.status === "tenho"),
          resolveTarget: "condominio",
        },
      ],
    },
  ];

  if (mode === "new_sindico") {
    sections.unshift({
      title: "Primeiros passos",
      items: [
        {
          id: "perfil_preenchido",
          label: "Perfil do condomínio preenchido",
          hint: "Complete na aba Condomínio",
          done: !!(profile?.nomeCondominio || profile?.hasElevador !== undefined),
          resolveTarget: "condominio",
        },
        {
          id: "onboarding_done",
          label: "Plano de implantação de 30 dias iniciado",
          done: true,
        },
      ],
    });
  }

  return sections;
}

export default function ImplantacaoChecklist({ onNavigate }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    const m = getImplantacaoMode();
    setSections(buildChecklist(m));
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const allItems  = sections.flatMap((s) => s.items);
  const doneCount = allItems.filter((i) => i.done).length;
  const total     = allItems.length;
  const pct       = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const pending   = allItems.filter((i) => !i.done);
  const nextGaps  = pending.slice(0, 3);

  const progressColor =
    pct >= 80 ? "#234B63" :
    pct >= 50 ? "#d97706" :
    "#dc6b4a";

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <section className="px-5 pb-3 sm:px-6">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-3 rounded-[18px] border border-navy-100/80 bg-white/80 px-4 py-3.5 text-left shadow-sm transition-colors hover:bg-white active:bg-navy-50"
        >
          {/* Mini ring */}
          <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center">
            <svg className="absolute inset-0 h-10 w-10" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="16" stroke="#e5e7eb" strokeWidth="4" />
              <circle
                cx="20" cy="20" r="16"
                stroke={progressColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 16}`}
                strokeDashoffset={`${2 * Math.PI * 16 * (1 - pct / 100)}`}
                transform="rotate(-90 20 20)"
              />
            </svg>
            <span className="relative text-[9px] font-bold text-navy-700">{pct}%</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-navy-800">
              {pct === 100 ? "Implantação concluída" : "Implantação do prédio"}
            </p>
            <p className="text-[11.5px] text-navy-400">
              {doneCount}/{total} itens · {pct < 100 ? `${pending.length} pendente${pending.length > 1 ? "s" : ""}` : "tudo configurado"}
            </p>
          </div>

          <svg className="h-4 w-4 flex-shrink-0 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {/* Próximas lacunas (quando não expandido) */}
        {nextGaps.length > 0 && pct < 100 && (
          <div className="mt-1.5 space-y-1">
            {nextGaps.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => item.resolveTarget && onNavigate?.(item.resolveTarget)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-amber-100/60 bg-amber-50/40 px-3.5 py-2 text-left hover:bg-amber-50 transition-colors"
              >
                <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-600" aria-hidden="true">!</span>
                <p className="flex-1 min-w-0 text-[12px] text-navy-700 truncate">{item.label}</p>
                {item.resolveTarget && (
                  <span className="flex-shrink-0 text-[10.5px] font-medium text-navy-500">Resolver →</span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  // ── Expanded ───────────────────────────────────────────────────────────────
  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className="rounded-[22px] border border-navy-100/80 bg-white/[0.92] p-4 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_14px_30px_-24px_rgba(31,49,71,0.28)]">

        {/* Cabeçalho */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-navy-800">
              {pct === 100 ? "Implantação concluída" : "Progresso de implantação"}
            </p>
            <p className="text-[11px] text-navy-400">{doneCount} de {total} etapas</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="rounded-full px-2.5 py-1 text-[11.5px] text-navy-400 hover:bg-navy-50 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-2.5 w-full rounded-full bg-navy-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: progressColor }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[10.5px] text-navy-400">Iniciado</span>
            <span className="text-[11px] font-semibold text-navy-700">{pct}% completo</span>
            <span className="text-[10.5px] text-navy-400">Completo</span>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const secDone = section.items.filter((i) => i.done).length;
            return (
              <div key={section.title}>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10.5px] font-semibold uppercase tracking-wide text-navy-500">
                    {section.title}
                  </p>
                  <span className="text-[10px] text-navy-400">{secDone}/{section.items.length}</span>
                </div>
                <div className="space-y-1.5">
                  {section.items.map((item) => (
                    <div key={item.id}>
                      {item.done ? (
                        <div className="flex items-start gap-2.5 rounded-xl bg-navy-50/40 px-3 py-2">
                          <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-teal-500 text-[8px] text-white" aria-hidden="true">✓</span>
                          <p className="text-[12px] leading-snug text-navy-500">{item.label}</p>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => item.resolveTarget && onNavigate?.(item.resolveTarget)}
                          className="flex w-full items-start gap-2.5 rounded-xl border border-amber-100/60 bg-amber-50/40 px-3 py-2 text-left transition-colors hover:bg-amber-50 active:scale-[0.99]"
                        >
                          <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold text-amber-600" aria-hidden="true">!</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] leading-snug text-navy-800">{item.label}</p>
                            {item.hint && (
                              <p className="text-[10.5px] text-navy-400">{item.hint}</p>
                            )}
                          </div>
                          {item.resolveTarget && (
                            <span className="flex-shrink-0 text-[11px] font-semibold text-navy-500 mt-0.5">→</span>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-navy-400">
          Cada etapa concluída melhora o monitoramento do condomínio e eleva a Saúde Operacional.
        </p>
      </div>
    </section>
  );
}
