"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  addPendencia,
  completePendencia,
  getPendenciasAbertas,
  logInteraction,
  type Pendencia,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

const CAT_LABEL: Record<string, string> = {
  multas:          "Multas",
  obras:           "Obras",
  assembleias:     "Assembleias",
  inadimplencia:   "Inadimplência",
  cobranca:        "Cobrança",
  funcionarios:    "Funcionários",
  trabalhista:     "Trabalhista",
  convencao:       "Convenção",
  locacao:         "Locação",
  lgpd:            "LGPD",
  responsabilidade:"Responsabilidade",
  gestao:          "Gestão",
  financeiro:      "Finanças",
  "areas-comuns":  "Áreas comuns",
  manutencao:      "Manutenção",
};

const ORIGEM_LABEL: Partial<Record<NonNullable<Pendencia["origem"]>, string>> = {
  response: "Assistente",
  guidance: "Alerta",
  memoria: "Memória",
  manual: "Manual",
};

type Props = {
  refreshKey?: number;
};

export default function PendenciasCard({ refreshKey }: Props) {
  const [pendencias, setPendencias] = useState<Pendencia[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [adding, setAdding] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [guidanceFeedback, setGuidanceFeedback] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); };
  }, []);

  useEffect(() => {
    setPendencias(getPendenciasAbertas());
    setHydrated(true);
  }, [refreshKey]);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  if (!hydrated) return null;

  const handleComplete = (id: string) => {
    const p = pendencias.find((x) => x.id === id);
    completePendencia(id);
    setPendencias((prev) => prev.filter((x) => x.id !== id));
    logInteraction("pendencia-concluida", id);
    void trackEvent("pendencia_completed", {
      categoria: p?.categoria ?? null,
      origem: p?.origem ?? null,
      matched_id: p?.matchedId ?? null,
    });
    if (p?.origem === "guidance") {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      setGuidanceFeedback(true);
      feedbackTimer.current = setTimeout(() => setGuidanceFeedback(false), 5000);
    }
  };

  const handleAdd = () => {
    const titulo = novoTitulo.trim();
    if (!titulo) { setAdding(false); return; }
    addPendencia({ titulo, origem: "manual" });
    setPendencias(getPendenciasAbertas());
    setNovoTitulo("");
    setAdding(false);
    logInteraction("pendencia-adicionada-manual", titulo.slice(0, 40));
    void trackEvent("pendencia_created_manual", {});
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") { setAdding(false); setNovoTitulo(""); }
  };

  const openItems = pendencias.slice(0, 5);
  const isStale = (createdAt: string) =>
    Date.now() - new Date(createdAt).getTime() > 14 * 86_400_000;

  return (
    <section className="px-5 pb-2 sm:px-6">
      <div className="animate-fade-in-up rounded-[18px] border border-navy-100/80 bg-white/80 px-4 py-3.5 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_4px_16px_-8px_rgba(31,49,71,0.10)]">

        {/* Cabeçalho */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
              Próximos passos
            </p>
            <p className="mt-0.5 text-[11.5px] leading-snug text-navy-400">
              Ações salvas pelo Assistente, pelos alertas ou adicionadas por você.
            </p>
          </div>
          {!adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-600 active:scale-[0.97]"
              aria-label="Adicionar próximo passo"
            >
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Adicionar
            </button>
          )}
        </div>

        {/* Feedback após concluir pendência de monitoramento */}
        {guidanceFeedback && (
          <p className="mb-2.5 text-[11.5px] leading-relaxed text-navy-500">
            Concluído. Se isso envolvia vencimento, atualize a data no monitoramento.
          </p>
        )}

        {/* Lista de pendências */}
        {openItems.length > 0 && (
          <ul className="mb-2.5 space-y-2">
            {openItems.map((p) => (
              <li key={p.id} className="flex items-start gap-2.5">
                {/* Botão de conclusão */}
                <button
                  type="button"
                  onClick={() => handleComplete(p.id)}
                  className="group mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-navy-200 text-transparent transition-all hover:border-navy-500 hover:bg-navy-100 hover:text-navy-500"
                  aria-label="Marcar como concluído"
                >
                  <svg className="h-2.5 w-2.5" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* Conteúdo */}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[13px] leading-snug text-navy-800">
                    {p.titulo}
                  </p>
                  {(p.origem || (p.categoria && CAT_LABEL[p.categoria])) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.origem && ORIGEM_LABEL[p.origem] && (
                        <span className="inline-block rounded-full bg-navy-50 px-2 py-px text-[10px] font-medium text-navy-500">
                          {ORIGEM_LABEL[p.origem]}
                        </span>
                      )}
                      {p.categoria && CAT_LABEL[p.categoria] && (
                        <span className="inline-block rounded-full bg-white/80 px-2 py-px text-[10px] font-medium text-navy-400 ring-1 ring-navy-100/80">
                          {CAT_LABEL[p.categoria]}
                        </span>
                      )}
                    </div>
                  )}
                  {isStale(p.createdAt) && (
                    <span className="mt-0.5 block text-[10px] text-navy-400">
                      Aberto há mais de 14 dias
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Indicador de overflow — itens além do limite de 5 */}
        {pendencias.length > 5 && (
          <p className="mb-2 text-[11px] text-navy-400">
            +{pendencias.length - 5} próximo{pendencias.length - 5 !== 1 ? "s" : ""} passo{pendencias.length - 5 !== 1 ? "s" : ""} oculto{pendencias.length - 5 !== 1 ? "s" : ""}
          </p>
        )}

        {/* Formulário inline de adição */}
        {adding ? (
          <div className="flex items-center gap-2 pt-0.5">
            <input
              ref={inputRef}
              type="text"
              value={novoTitulo}
              onChange={(e) => setNovoTitulo(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Descreva o próximo passo…"
              maxLength={120}
              className="flex-1 rounded-xl border border-navy-200 bg-navy-50/40 px-3 py-1.5 text-[13px] text-navy-800 placeholder:text-navy-300 focus:border-navy-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!novoTitulo.trim()}
              className="rounded-xl bg-navy-700 px-3 py-1.5 text-[12px] font-semibold text-cream-50 transition-colors hover:bg-navy-800 disabled:bg-navy-200 disabled:text-navy-400"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setNovoTitulo(""); }}
              className="px-1 py-1.5 text-[12px] text-navy-400 hover:text-navy-600"
            >
              ✕
            </button>
          </div>
        ) : openItems.length === 0 ? (
          <p className="text-[12.5px] leading-relaxed text-navy-400">
            Quando uma orientação virar ação, salve aqui para acompanhar depois.
          </p>
        ) : null}

      </div>
    </section>
  );
}
