"use client";

import { useEffect, useState } from "react";
import {
  getPendencias,
  completePendencia,
  logInteraction,
  type Pendencia,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

// ─── Priority helpers ─────────────────────────────────────────────────────────

function getPriority(p: Pendencia): "Alta" | "Média" | null {
  if (p.origem === "guidance") return "Alta";
  if (p.origem === "response" || p.origem === "memoria" || p.origem === "ocorrencia") return "Média";
  return null;
}

const PRIORITY_STYLE: Record<"Alta" | "Média", string> = {
  Alta:  "bg-green-100 text-green-700",
  Média: "bg-amber-100 text-amber-700",
};

// ─── Icon helpers ─────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, string> = {
  multas: "⚖️", obras: "🏗️", assembleias: "👥", inadimplencia: "💰",
  cobranca: "📑", funcionarios: "👤", trabalhista: "📋", convencao: "📖",
  locacao: "🔑", lgpd: "🔒", responsabilidade: "⚠️", gestao: "📊",
  financeiro: "💳", "areas-comuns": "🏢", manutencao: "🔧",
};

function getIcon(p: Pendencia): string {
  if (p.categoria && CATEGORY_ICONS[p.categoria]) return CATEGORY_ICONS[p.categoria];
  if (p.origem === "guidance") return "🔔";
  if (p.origem === "response") return "📝";
  if (p.origem === "agenda") return "📅";
  if (p.origem === "ocorrencia") return "📋";
  return "📌";
}

// ─── Subtitle helpers ─────────────────────────────────────────────────────────

const ORIGEM_SUBTITLE: Partial<Record<NonNullable<Pendencia["origem"]>, string>> = {
  response:  "Gerado pelo assistente",
  guidance:  "Alerta operacional",
  memoria:   "Dado do condomínio",
  ocorrencia:"Vinculado a ocorrência",
  manual:    "Criado por você",
  agenda:    "Vinculado à agenda",
  revisao:   "Da revisão mensal",
};

function getSubtitle(p: Pendencia): string {
  return (p.origem && ORIGEM_SUBTITLE[p.origem]) ?? "Próximo passo";
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = ["Abertas", "Em andamento", "Concluídas"] as const;
type TabKey = (typeof TABS)[number];

// ─── Component ────────────────────────────────────────────────────────────────

type Props = {
  refreshKey?: number;
  onBack?: () => void;
  initialTab?: TabKey;
};

export default function PendenciasScreen({ refreshKey, onBack, initialTab = "Abertas" }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [all, setAll]             = useState<Pendencia[]>([]);
  const [hydrated, setHydrated]   = useState(false);

  useEffect(() => {
    setAll(getPendencias());
    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated) return null;

  const abertas      = all.filter((p) => p.status === "aberta");
  const emAndamento  = abertas.filter(
    (p) => p.origem && ["guidance", "response", "memoria", "ocorrencia"].includes(p.origem)
  );
  const concluidas   = all
    .filter((p) => p.status === "concluida")
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))
    .slice(0, 12);

  const proximosPassos = abertas
    .filter((p) => !p.origem || ["manual", "agenda", "revisao"].includes(p.origem))
    .slice(0, 6);

  const displayItems: Pendencia[] =
    activeTab === "Abertas"       ? abertas :
    activeTab === "Em andamento"  ? emAndamento :
                                    concluidas;

  const tabCounts: Record<TabKey, number> = {
    Abertas:       abertas.length,
    "Em andamento": emAndamento.length,
    Concluídas:    concluidas.length,
  };

  function handleComplete(id: string) {
    const p = all.find((x) => x.id === id);
    completePendencia(id);
    logInteraction("pendencia-concluida", id);
    void trackEvent("pendencia_completed", {
      categoria: p?.categoria ?? null,
      origem: p?.origem ?? null,
      matched_id: p?.matchedId ?? null,
    });
    setAll(getPendencias());
  }

  return (
    <div className="flex w-full max-w-full flex-col overflow-x-hidden">

      {/* ── Cabeçalho ───────────────────────────────────────────────── */}
      <div className="px-5 pb-2 pt-[calc(env(safe-area-inset-top,0px)+1.125rem)] sm:px-6">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-navy-400 transition-colors hover:bg-navy-100/70 hover:text-navy-600 active:scale-[0.97]"
          >
            <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-[11.5px] font-medium">Voltar</span>
          </button>
        )}
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[28px] font-bold leading-tight text-navy-800">
              Pendências
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-navy-500">
              O que precisa da sua atenção.
            </p>
          </div>
          <button
            type="button"
            aria-label="Notificações"
            className="ml-3 mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-navy-300 transition-colors hover:bg-navy-50 hover:text-navy-500"
          >
            <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" aria-hidden="true">
              <path d="M10 2.5A5.5 5.5 0 004.5 8v2.5L3 12.5h14L15.5 10.5V8A5.5 5.5 0 0010 2.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M8 15.5a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="px-5 pb-4 sm:px-6">
        <div className="flex gap-1 rounded-[14px] bg-navy-50/80 p-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-[10px] py-2 text-[12px] font-medium transition-all active:scale-[0.97] ${
                activeTab === tab
                  ? "bg-navy-700 text-white shadow-sm"
                  : "text-navy-500 hover:text-navy-700"
              }`}
            >
              {tab}
              {tabCounts[tab] > 0 && activeTab !== tab && (
                <span className="ml-1 text-[10px] opacity-70">({tabCounts[tab]})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pendências list ─────────────────────────────────────────── */}
      <div className="space-y-3 px-5 pb-4 sm:px-6">
        {displayItems.length === 0 ? (
          <div className="rounded-[18px] border border-navy-100/70 bg-white px-4 py-6 text-center shadow-card">
            <p className="text-[12.5px] text-navy-400">
              {activeTab === "Abertas"        && "Nenhuma pendência aberta."}
              {activeTab === "Em andamento"   && "Nenhuma pendência em andamento."}
              {activeTab === "Concluídas"     && "Nenhuma pendência concluída."}
            </p>
          </div>
        ) : (
          displayItems.map((p) => {
            const priority = getPriority(p);
            const icon     = getIcon(p);
            const subtitle = getSubtitle(p);
            const dateStr  =
              activeTab === "Concluídas"
                ? formatDateFull(p.completedAt ?? p.createdAt)
                : formatDateFull(p.createdAt);

            return (
              <div
                key={p.id}
                className="rounded-[18px] border border-navy-100/70 bg-white px-4 py-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[18px]">
                    {icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13.5px] font-semibold leading-snug text-navy-800">
                        {p.titulo}
                      </p>
                      {priority && (
                        <span
                          className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLE[priority]}`}
                        >
                          {priority}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11.5px] text-navy-400">{subtitle}</p>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-600">
                        {dateStr}
                      </span>
                      <svg className="h-4 w-4 text-navy-200" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Próximos passos ─────────────────────────────────────────── */}
      <section className="px-5 pb-8 sm:px-6">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[14px] font-semibold text-navy-800">Próximos passos</p>
          <span className="text-[12px] text-navy-400">
            {proximosPassos.length > 0 ? `${proximosPassos.length} aberto${proximosPassos.length > 1 ? "s" : ""}` : ""}
          </span>
        </div>

        {proximosPassos.length === 0 ? (
          <div className="rounded-[18px] border border-navy-100/70 bg-white px-4 py-4 shadow-card">
            <p className="text-[12.5px] text-navy-400">
              Defina o que fazer e mantenha o ritmo.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-navy-100/70 bg-white shadow-card">
            {proximosPassos.map((p, idx) => (
              <div key={p.id}>
                {idx > 0 && <div className="mx-4 border-t border-navy-50" />}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <button
                    type="button"
                    onClick={() => handleComplete(p.id)}
                    aria-label="Marcar como concluído"
                    className="group flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-navy-200 transition-all hover:border-green-400 hover:bg-green-50 active:scale-90"
                  >
                    <svg
                      viewBox="0 0 10 10"
                      className="h-2.5 w-2.5 text-transparent transition-colors group-hover:text-green-500"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M2 5l2 2.5L8 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <p className="min-w-0 flex-1 truncate text-[13px] text-navy-700">{p.titulo}</p>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <span className="text-[11px] text-navy-400">{formatDateShort(p.createdAt)}</span>
                    <svg className="h-4 w-4 text-navy-300" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
