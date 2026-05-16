"use client";

import { useEffect, useState } from "react";
import {
  getChecklistStorage,
  getRecentQueries,
  getFavorites,
  getUsageStats,
  logInteraction,
  getProfile,
  CondominioProfile,
} from "@/lib/session";
import { CHECKLISTS } from "@/lib/checklists";

const CHECKLIST_META: Record<string, { title: string; icon: string; total: number }> = {
  assembleia:    { title: "Assembleia",           icon: "👥", total: 10 },
  admissao:      { title: "Admissão de funcionário", icon: "🧹", total: 10 },
  manutencao:    { title: "Manutenção preventiva", icon: "🔨", total: 10 },
  "sindico-novo": { title: "Síndico novo",         icon: "🏛️", total: 10 },
};

// Pergunta representativa por categoria — dispara ao clicar na pill
const CAT_PROMPT: Partial<Record<string, string>> = {
  assembleias:      "Como convocar uma assembleia?",
  financeiro:       "Como calcular o rateio das despesas do condomínio?",
  funcionarios:     "Quais documentos preciso para admitir um funcionário?",
  trabalhista:      "Qual a jornada de trabalho correta do porteiro?",
  gestao:           "Quais são os deveres e responsabilidades do síndico?",
  obras:            "Quais obras precisam de aprovação em assembleia?",
  "areas-comuns":   "O condomínio pode cobrar taxa de reserva do salão de festas?",
  inadimplencia:    "Como cobrar morador inadimplente?",
  cobranca:         "Como negativar morador inadimplente no SPC?",
  locacao:          "Inquilino pode votar em assembleia?",
  convencao:        "Como alterar a convenção do condomínio?",
  responsabilidade: "Vazamento do apartamento de cima: quem paga o conserto?",
  multas:           "Posso aplicar multa sem convocar assembleia?",
  juridico:         "O síndico responde pessoalmente por dívidas do condomínio?",
  lgpd:             "O condomínio pode publicar lista de devedores no mural?",
  manutencao:       "Com que frequência o elevador precisa de manutenção?",
};

const CAT_LABEL: Record<string, string> = {
  assembleias:      "Assembleias",
  financeiro:       "Financeiro",
  funcionarios:     "Funcionários",
  trabalhista:      "Trabalhista",
  gestao:           "Gestão",
  obras:            "Obras",
  "areas-comuns":   "Áreas comuns",
  inadimplencia:    "Inadimplência",
  cobranca:         "Cobrança",
  locacao:          "Locação",
  convencao:        "Convenção",
  responsabilidade: "Responsabilidade",
  multas:           "Multas",
  juridico:         "Jurídico",
  lgpd:             "LGPD",
};

type ProfileSuggestion = { q: string; label: string };

const PROFILE_SUGGESTIONS: Array<{
  condition: (p: CondominioProfile) => boolean;
  q: string;
  label: string;
}> = [
  {
    condition: (p) => p.hasElevador === true,
    q: "Com que frequência o elevador precisa de manutenção?",
    label: "Elevador",
  },
  {
    condition: (p) => p.hasPiscina === true,
    q: "Quais são as normas de segurança para piscina em condomínio?",
    label: "Piscina",
  },
  {
    condition: (p) => p.hasFuncionarios === true,
    q: "Quando entra em vigor o dissídio dos funcionários do condomínio?",
    label: "Dissídio",
  },
  {
    condition: (p) => p.hasFuncionarios === true,
    q: "Quais documentos preciso para admitir um funcionário?",
    label: "Admissão",
  },
  {
    condition: (p) => p.tipoSindico === "profissional",
    q: "Quais são as responsabilidades legais do síndico profissional?",
    label: "Responsabilidade",
  },
  {
    condition: (p) => p.tipoSindico === "morador",
    q: "Quais são os deveres e responsabilidades do síndico?",
    label: "Deveres",
  },
];

type ActiveChecklist = {
  id: string;
  done: number;
  total: number;
  criticalPending: number;
  daysSinceLast: number;
};

type ReviewDueItem = {
  id: string;
  icon: string;
  title: string;
  daysSince: number;
  recurrenceLabel: string;
};

type PainelOperacionalProps = {
  onAsk?: (q: string) => void;
  refreshKey?: number;
};

export default function PainelOperacional({ onAsk, refreshKey }: PainelOperacionalProps) {
  const [hydrated, setHydrated] = useState(false);
  const [activeChecklist, setActiveChecklist] = useState<ActiveChecklist | null>(null);
  const [reviewDue, setReviewDue] = useState<ReviewDueItem[]>([]);
  const [recentCats, setRecentCats] = useState<string[]>([]);
  const [totalQueries, setTotalQueries] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [profileSuggestions, setProfileSuggestions] = useState<ProfileSuggestion[]>([]);

  useEffect(() => {
    const storage = getChecklistStorage();
    const inProgress = Object.entries(storage)
      .filter(([id]) => CHECKLIST_META[id])
      .map(([id, data]) => {
        const total = CHECKLIST_META[id].total;
        const done = Object.values(data.checked).filter(Boolean).length;
        const clDef = CHECKLISTS.find((c) => c.id === id);
        const criticalPending = clDef
          ? clDef.items.filter((it) => it.critical && !data.checked[it.id]).length
          : 0;
        return { id, done, total, lastUsed: data.lastUsed, criticalPending };
      })
      .filter((e) => e.done > 0 && e.done < e.total)
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());

    const queries = getRecentQueries(20);
    const catSeen = new Set<string>();
    const cats: string[] = [];
    for (const q of queries) {
      if (q.categoria && !catSeen.has(q.categoria)) {
        catSeen.add(q.categoria);
        cats.push(q.categoria);
        if (cats.length >= 4) break;
      }
    }

    const daysSince = (iso: string) =>
      Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

    const first = inProgress[0];
    setActiveChecklist(
      first
        ? {
            id: first.id,
            done: first.done,
            total: first.total,
            criticalPending: first.criticalPending,
            daysSinceLast: daysSince(first.lastUsed),
          }
        : null
    );

    // Checklists concluídos que passaram da janela de recorrência
    const due: ReviewDueItem[] = Object.entries(storage)
      .filter(([id]) => CHECKLIST_META[id])
      .flatMap(([id, data]) => {
        const total = CHECKLIST_META[id].total;
        const done = Object.values(data.checked).filter(Boolean).length;
        if (done < total) return [];
        const clDef = CHECKLISTS.find((c) => c.id === id);
        if (!clDef?.recurrenceDays) return [];
        const ds = daysSince(data.lastUsed);
        if (ds < clDef.recurrenceDays) return [];
        const m = CHECKLIST_META[id];
        return [{ id, icon: m.icon, title: m.title, daysSince: ds, recurrenceLabel: clDef.recurrenceLabel! }];
      });
    setReviewDue(due);

    setRecentCats(cats);
    setTotalQueries(getUsageStats().totalCount);
    setFavCount(getFavorites().length);

    const profile = getProfile();
    if (profile) {
      const suggestions = PROFILE_SUGGESTIONS
        .filter((s) => s.condition(profile))
        .slice(0, 3)
        .map(({ q, label }) => ({ q, label }));
      setProfileSuggestions(suggestions);
    } else {
      setProfileSuggestions([]);
    }

    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated) return null;

  const hasActivity = totalQueries > 0 || activeChecklist !== null || profileSuggestions.length > 0 || reviewDue.length > 0;
  if (!hasActivity) return null;

  const meta = activeChecklist ? CHECKLIST_META[activeChecklist.id] : null;
  const pct = activeChecklist ? Math.round((activeChecklist.done / activeChecklist.total) * 100) : 0;

  const scrollToChecklist = () => {
    document.getElementById("checklist-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="px-5 pb-4 sm:px-6 animate-fade-in-up">
      <div className="rounded-2xl border border-navy-100/70 px-4 py-4">

        {activeChecklist && meta && (
          <button
            type="button"
            onClick={scrollToChecklist}
            className="mb-3 flex w-full items-center gap-3 rounded-xl bg-white/90 px-3 py-3 text-left shadow-[0_1px_2px_rgba(31,49,71,0.04)] transition-colors hover:bg-white active:bg-navy-50"
          >
            <span className="text-[18px] leading-none" aria-hidden="true">
              {meta.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-navy-800">{meta.title}</p>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-navy-100">
                <div
                  className="h-full rounded-full bg-sage-400 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-0.5 text-[10.5px] text-navy-400">
                {activeChecklist.done} de {activeChecklist.total} itens
                {activeChecklist.criticalPending > 0 && (
                  <span className="ml-1.5 font-medium text-amber-500">
                    · {activeChecklist.criticalPending} crítico{activeChecklist.criticalPending > 1 ? "s" : ""} pendente{activeChecklist.criticalPending > 1 ? "s" : ""}
                  </span>
                )}
                {activeChecklist.daysSinceLast > 3 && activeChecklist.criticalPending === 0 && (
                  <span className="ml-1.5 text-navy-300">
                    · parado há {activeChecklist.daysSinceLast} dia{activeChecklist.daysSinceLast > 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>
            <span className="flex-shrink-0 text-[11.5px] font-semibold text-sage-600">
              Continuar →
            </span>
          </button>
        )}

        {profileSuggestions.length > 0 && onAsk && (
          <div className="mb-3">
            <p className="mb-1.5 text-[10.5px] text-navy-400">Relevante para você</p>
            <div className="flex flex-wrap gap-1.5">
              {profileSuggestions.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    logInteraction("profile-suggestion", s.label);
                    onAsk(s.q);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-sage-50 px-2.5 py-1 text-[11px] font-medium text-sage-700 ring-1 ring-sage-200 transition-colors hover:bg-sage-100 hover:ring-sage-300 active:scale-95"
                >
                  {s.label}
                  <span className="text-sage-400" aria-hidden="true">›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {recentCats.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-[10.5px] text-navy-400">Explorar mais</p>
            <div className="flex flex-wrap gap-1.5">
              {recentCats.map((cat) => {
                const prompt = CAT_PROMPT[cat];
                if (prompt && onAsk) {
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        logInteraction("category-pill", cat);
                        onAsk(prompt);
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-medium text-navy-600 ring-1 ring-navy-100 transition-colors hover:bg-navy-100 hover:ring-navy-200 active:scale-95"
                    >
                      {CAT_LABEL[cat] ?? cat}
                      <span className="text-navy-400" aria-hidden="true">›</span>
                    </button>
                  );
                }
                return (
                  <span
                    key={cat}
                    className="rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-medium text-navy-600 ring-1 ring-navy-100"
                  >
                    {CAT_LABEL[cat] ?? cat}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {reviewDue.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-[10.5px] text-navy-400">Manter em dia</p>
            {reviewDue.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  logInteraction("review-due", item.id);
                  scrollToChecklist();
                }}
                className="mb-1.5 flex w-full items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2 text-left transition-colors hover:bg-amber-50 active:bg-amber-100"
              >
                <span className="text-[16px] leading-none" aria-hidden="true">{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-navy-800">{item.title}</p>
                  <p className="text-[10.5px] text-amber-600">
                    Revisado há {item.daysSince} dia{item.daysSince > 1 ? "s" : ""} · recomendado {item.recurrenceLabel}
                  </p>
                </div>
                <span className="flex-shrink-0 text-[11px] font-semibold text-amber-600">Revisar →</span>
              </button>
            ))}
          </div>
        )}

        {totalQueries > 0 && (
          <div className="flex gap-5 pt-1">
            <div>
              <p className="text-[14px] font-semibold tabular-nums text-navy-700">
                {totalQueries}
              </p>
              <p className="text-[10.5px] text-navy-400">
                {totalQueries === 1 ? "consulta" : "consultas"}
              </p>
            </div>
            {favCount > 0 && (
              <div>
                <p className="text-[14px] font-semibold tabular-nums text-navy-700">
                  {favCount}
                </p>
                <p className="text-[10.5px] text-navy-400">
                  {favCount === 1 ? "favorito" : "favoritos"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
