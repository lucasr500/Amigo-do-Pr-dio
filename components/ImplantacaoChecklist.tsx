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

type CheckItem = {
  id: string;
  label: string;
  done: boolean;
  cta?: string;
  ctaTarget?: string;
};

type Section = {
  title: string;
  items: CheckItem[];
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
    : null; // null = não registrou ainda

  const rotinas = [
    m.ultimaDedetizacao,
    m.ultimaLimpezaCaixaDAgua,
    m.ultimaManutencaoElevador,
    m.ultimaInspecaoExtintores,
  ];
  const rotinasOk = rotinas.filter(Boolean).length >= 2;

  const sections: Section[] = [
    {
      title: "Documentos e registros essenciais",
      items: [
        {
          id: "avcb",
          label: "AVCB ou CLCB registrado",
          done: avcbOk,
        },
        {
          id: "seguro",
          label: "Apólice do seguro predial registrada",
          done: seguroOk,
        },
        {
          id: "mandato",
          label: "Fim do mandato do síndico registrado",
          done: mandatoOk,
        },
        {
          id: "docs_mapeados",
          label: `Documentos essenciais mapeados (${docsRegistrados > 0 ? `${docsPct}% confirmados` : "nenhum ainda"})`,
          done: docsRegistrados > 0 && docsPct >= 50,
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
            : `Férias a verificar (${funcs.filter((f) => f.status === "vencida" || f.status === "desconhecida").length} funcionário(s))`,
          done: funcs.length > 0 && funcsOk === true,
        },
        {
          id: "contrato_elevador",
          label: "Contrato de manutenção de elevadores localizado",
          done: docs.some((d) => d.id === "contrato_elevador" && d.status === "tenho"),
        },
        {
          id: "contrato_limpeza",
          label: "Contrato de limpeza localizado",
          done: docs.some((d) => d.id === "contrato_limpeza" && d.status === "tenho"),
        },
      ],
    },
    {
      title: "Rotinas operacionais",
      items: [
        {
          id: "rotinas",
          label: `Manutenções registradas (${rotinas.filter(Boolean).length} de 4 rotinas-base)`,
          done: rotinasOk,
        },
        {
          id: "convencao",
          label: "Convenção condominial localizada",
          done: docs.some((d) => d.id === "convencao" && d.status === "tenho"),
        },
        {
          id: "ata_eleicao",
          label: "Ata de eleição do síndico localizada",
          done: docs.some((d) => d.id === "ata_eleicao" && d.status === "tenho"),
        },
      ],
    },
  ];

  if (mode === "new_sindico") {
    sections.unshift({
      title: "Primeiros passos — Novo síndico",
      items: [
        {
          id: "perfil_preenchido",
          label: "Perfil do condomínio preenchido",
          done: !!(profile?.nomeCondominio || profile?.hasElevador !== undefined),
        },
        {
          id: "onboarding_done",
          label: "Plano de implantação de 30 dias iniciado",
          done: true, // se chegou aqui, já passou pelo onboarding
        },
      ],
    });
  }

  return sections;
}

export default function ImplantacaoChecklist() {
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<ImplantacaoMode | null>(null);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    const m = getImplantacaoMode();
    setMode(m);
    setSections(buildChecklist(m));
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const allItems  = sections.flatMap((s) => s.items);
  const doneCount = allItems.filter((i) => i.done).length;
  const total     = allItems.length;
  const pct       = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (!expanded) {
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-2.5 rounded-[18px] border border-cream-200/90 bg-white/78 px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(31,49,71,0.03)] transition-colors hover:bg-white active:bg-navy-50"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[13px]" aria-hidden="true">
            ✅
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-navy-800">Checklist de implantação</p>
            <p className="text-[11.5px] text-navy-400">
              {doneCount}/{total} itens concluídos · {pct}% completo
            </p>
          </div>

          {/* Mini progress bar */}
          <div className="shrink-0 flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-navy-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-navy-600 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11.5px] font-semibold text-navy-500">Ver →</span>
          </div>
        </button>
      </section>
    );
  }

  // ── Expanded ───────────────────────────────────────────────────────────────
  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="rounded-[22px] border border-cream-200/90 bg-white/92 p-4 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_14px_30px_-24px_rgba(31,49,71,0.30)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-navy-800">Checklist de implantação</p>
            <p className="text-[11px] text-navy-400">{doneCount}/{total} concluídos</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[11.5px] text-navy-400 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10.5px] text-navy-500">Progresso geral</span>
            <span className="text-[11px] font-semibold text-navy-700">{pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-navy-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: pct >= 80
                  ? "rgb(var(--color-navy-600, 31 49 71))"
                  : pct >= 50
                  ? "#d97706"
                  : "#dc6b4a",
              }}
            />
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const sectionDone = section.items.filter((i) => i.done).length;
            return (
              <div key={section.title}>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-navy-600 uppercase tracking-wide">
                    {section.title}
                  </p>
                  <span className="text-[10px] text-navy-400">
                    {sectionDone}/{section.items.length}
                  </span>
                </div>
                <div className="space-y-1.5">
                  {section.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-2.5 rounded-xl px-3 py-2 ${
                        item.done
                          ? "bg-navy-50/40"
                          : "bg-amber-50/40 border border-amber-100/60"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${
                          item.done
                            ? "bg-navy-200 text-navy-600"
                            : "bg-amber-100 text-amber-600"
                        }`}
                        aria-hidden="true"
                      >
                        {item.done ? "✓" : "!"}
                      </span>
                      <p
                        className={`text-[12px] leading-snug ${
                          item.done ? "text-navy-500 line-through" : "text-navy-800"
                        }`}
                      >
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[10px] leading-relaxed text-navy-400">
          O checklist reflete os dados já cadastrados no app. Complete as seções de Memória, Documentos e Funcionários para avançar.
        </p>
      </div>
    </section>
  );
}
