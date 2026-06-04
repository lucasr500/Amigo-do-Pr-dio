"use client";

import { useEffect, useState } from "react";
import {
  getStorageSizeKB,
  getPendencias,
  getOcorrencias,
  SESSION_SCHEMA_VERSION,
  PENDENCIAS_LIMIT,
  OCORRENCIAS_LIMIT,
} from "@/lib/session";
import { isEnabled } from "@/lib/feature-flags";
import { isPushSupported } from "@/lib/push/pushManager";

const APP_VERSION = "0.1.0";

type FeedbackType = "bug" | "sugestao" | "duvida" | "elogio";
type FeedbackArea = "home" | "condominio" | "agenda" | "assistente" | "backup" | "conta" | "outro";
type FeedbackSeverity = "baixa" | "media" | "alta";

type FeedbackEntry = {
  id: string;
  type: FeedbackType;
  area: FeedbackArea;
  severity?: FeedbackSeverity;
  text: string;
  ts: string;
  diagnostic?: string;
};

const FEEDBACK_KEY = "amigo_feedback_hub";
const MAX_ENTRIES = 20;

function loadFeedback(): FeedbackEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY);
    return raw ? (JSON.parse(raw) as FeedbackEntry[]) : [];
  } catch { return []; }
}

function saveFeedback(entries: FeedbackEntry[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES))); } catch { /* quota */ }
}

function buildDiagnosticText(): string {
  const storage  = getStorageSizeKB();
  const pend     = getPendencias().length;
  const ocorr    = getOcorrencias().length;
  const push     = isPushSupported() ? "suportado" : "não suportado";
  const authOn   = isEnabled("auth_enabled") ? "ativo" : "inativo";
  const cloudOn  = isEnabled("cloud_backup_enabled") ? "ativo" : "inativo";
  const syncOn   = isEnabled("sync_enabled") ? "ativo" : "inativo";
  let authState  = "guest";
  try {
    const raw = localStorage.getItem("amigo_sb_session");
    if (raw) { const s = JSON.parse(raw) as Record<string, unknown>; if (s?.access_token) authState = "autenticado"; }
  } catch { /* noop */ }
  return [
    `Versão: ${APP_VERSION}`,
    `Schema: v${SESSION_SCHEMA_VERSION}`,
    `Storage: ${storage} KB`,
    `Pendências: ${pend}/${PENDENCIAS_LIMIT}`,
    `Ocorrências: ${ocorr}/${OCORRENCIAS_LIMIT}`,
    `Auth: ${authState} (flag ${authOn})`,
    `Cloud backup: ${cloudOn}`,
    `Auto-sync: ${syncOn}`,
    `Push: ${push}`,
  ].join("\n");
}

const TYPE_LABEL: Record<FeedbackType, string> = {
  bug:     "Bug",
  sugestao:"Sugestão",
  duvida:  "Dúvida",
  elogio:  "Elogio",
};

const AREA_LABEL: Record<FeedbackArea, string> = {
  home:       "Home",
  condominio: "Condomínio",
  agenda:     "Agenda",
  assistente: "Assistente",
  backup:     "Backup",
  conta:      "Conta",
  outro:      "Outro",
};

const SEVERITY_LABEL: Record<FeedbackSeverity, string> = {
  baixa: "Baixa",
  media: "Média",
  alta:  "Alta",
};

const PLACEHOLDER: Record<FeedbackType, string> = {
  bug:     "Descreva o problema encontrado — o que você tentou fazer e o que aconteceu?",
  sugestao:"Qual funcionalidade ou melhoria você sugere? Por que seria útil?",
  duvida:  "Qual é sua dúvida?",
  elogio:  "O que está funcionando bem para você?",
};

export default function FeedbackHub() {
  const [expanded,     setExpanded]     = useState(false);
  const [type,         setType]         = useState<FeedbackType>("bug");
  const [area,         setArea]         = useState<FeedbackArea>("outro");
  const [severity,     setSeverity]     = useState<FeedbackSeverity>("media");
  const [text,         setText]         = useState("");
  const [attachDiag,   setAttachDiag]   = useState(false);
  const [sent,         setSent]         = useState(false);
  const [history,      setHistory]      = useState<FeedbackEntry[]>([]);
  const [showHistory,  setShowHistory]  = useState(false);
  const [copyDone,     setCopyDone]     = useState(false);
  const [hydrated,     setHydrated]     = useState(false);

  useEffect(() => {
    setHistory(loadFeedback());
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  function handleSend() {
    if (!text.trim()) return;
    const diagnostic = attachDiag ? buildDiagnosticText() : undefined;
    const entry: FeedbackEntry = {
      id:   `fb_${Date.now()}`,
      type,
      area,
      severity: type === "bug" ? severity : undefined,
      text: text.trim(),
      ts:   new Date().toISOString(),
      diagnostic,
    };
    const updated = [...loadFeedback(), entry];
    saveFeedback(updated);
    setHistory(updated);
    setText("");
    setSent(true);
    setTimeout(() => { setSent(false); setExpanded(false); }, 2500);
  }

  async function handleCopyReport() {
    const lines: string[] = [
      "FEEDBACK — Amigo do Prédio",
      `Data: ${new Date().toLocaleDateString("pt-BR")}`,
      "",
    ];
    [...history].reverse().slice(0, 5).forEach((h, i) => {
      lines.push(`--- Feedback ${i + 1} ---`);
      lines.push(`Tipo: ${TYPE_LABEL[h.type]}`);
      lines.push(`Área: ${AREA_LABEL[h.area]}`);
      if (h.severity) lines.push(`Severidade: ${SEVERITY_LABEL[h.severity]}`);
      lines.push(`Data: ${new Date(h.ts).toLocaleString("pt-BR")}`);
      lines.push(`Relato: ${h.text}`);
      if (h.diagnostic) { lines.push(""); lines.push("Diagnóstico:"); lines.push(h.diagnostic); }
      lines.push("");
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <div className="px-5 pb-3 sm:px-6">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-2.5 rounded-[16px] border border-navy-100/70 bg-white/80 px-4 py-3 text-left shadow-sm transition-colors hover:bg-white active:bg-navy-50"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-navy-50 text-[13px]" aria-hidden="true">
            💬
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-navy-800">Feedback para o desenvolvedor</p>
            <p className="text-[11px] text-navy-400">Bug, sugestão, dúvida ou elogio</p>
          </div>
          {history.length > 0 && (
            <span className="flex-shrink-0 rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-semibold text-navy-500">
              {history.length}
            </span>
          )}
        </button>
      ) : (
        <div className="rounded-[18px] border border-navy-100/80 bg-white/90 px-4 py-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[13px] font-semibold text-navy-800">Feedback</p>
            <button
              type="button"
              onClick={() => { setExpanded(false); setText(""); setSent(false); }}
              className="text-[11.5px] text-navy-400 hover:text-navy-600"
            >
              Fechar
            </button>
          </div>

          {sent ? (
            <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-3">
              <svg className="h-4 w-4 flex-shrink-0 text-teal-600" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[12.5px] font-medium text-teal-700">Feedback registrado. Obrigado!</p>
            </div>
          ) : (
            <>
              {/* Tipo */}
              <div className="mb-3">
                <p className="mb-1.5 text-[11px] font-medium text-navy-500">Tipo</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(["bug", "sugestao", "duvida", "elogio"] as FeedbackType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`rounded-full px-3 py-1 text-[11.5px] font-medium ring-1 transition-all active:scale-95 ${
                        type === t
                          ? "bg-navy-700 text-white ring-navy-700"
                          : "bg-white text-navy-600 ring-navy-200 hover:ring-navy-300"
                      }`}
                    >
                      {TYPE_LABEL[t]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Área */}
              <div className="mb-3">
                <p className="mb-1.5 text-[11px] font-medium text-navy-500">Área afetada</p>
                <div className="flex gap-1.5 flex-wrap">
                  {(["home", "condominio", "agenda", "assistente", "backup", "conta", "outro"] as FeedbackArea[]).map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setArea(a)}
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 transition-all active:scale-95 ${
                        area === a
                          ? "bg-navy-600 text-white ring-navy-600"
                          : "bg-white text-navy-500 ring-navy-200 hover:ring-navy-300"
                      }`}
                    >
                      {AREA_LABEL[a]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severidade — apenas para bugs */}
              {type === "bug" && (
                <div className="mb-3">
                  <p className="mb-1.5 text-[11px] font-medium text-navy-500">Severidade</p>
                  <div className="flex gap-2">
                    {(["baixa", "media", "alta"] as FeedbackSeverity[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSeverity(s)}
                        className={`flex-1 rounded-xl py-1.5 text-[11px] font-medium ring-1 transition-all active:scale-95 ${
                          severity === s
                            ? s === "alta" ? "bg-terracotta-600 text-white ring-terracotta-600"
                            : s === "media" ? "bg-amber-600 text-white ring-amber-600"
                            : "bg-navy-700 text-white ring-navy-700"
                            : "bg-white text-navy-600 ring-navy-200 hover:ring-navy-300"
                        }`}
                      >
                        {SEVERITY_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Texto */}
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={PLACEHOLDER[type]}
                rows={3}
                maxLength={500}
                className="mb-3 min-h-[80px] w-full resize-none rounded-xl border border-navy-100 bg-cream-50/40 px-3 py-2.5 text-[13px] leading-relaxed text-navy-800 placeholder:text-navy-300 focus:border-navy-300 focus:outline-none"
              />

              {/* Diagnóstico opcional */}
              <label className="mb-3 flex items-center gap-2 rounded-xl bg-navy-50/60 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={attachDiag}
                  onChange={(e) => setAttachDiag(e.target.checked)}
                  className="h-4 w-4 rounded border-navy-200 text-navy-700"
                />
                <span className="text-[11.5px] leading-relaxed text-navy-600">
                  Incluir diagnóstico técnico anônimo <span className="text-navy-400">(sem dados pessoais)</span>
                </span>
              </label>

              {attachDiag && (
                <div className="mb-3 rounded-xl bg-navy-50/40 px-3 py-2.5">
                  <p className="text-[10.5px] font-mono leading-relaxed text-navy-500 whitespace-pre">
                    {buildDiagnosticText()}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!text.trim()}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-navy-700 px-4 py-2 text-[12px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.97] disabled:bg-navy-200 disabled:text-navy-400"
                >
                  Enviar feedback
                </button>
                {history.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowHistory((v) => !v)}
                      className="text-[11px] text-navy-400 hover:text-navy-600"
                    >
                      {showHistory ? "Ocultar histórico" : `Ver ${history.length} anterior${history.length > 1 ? "es" : ""}`}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="ml-auto text-[11px] font-medium text-navy-500 hover:text-navy-700"
                    >
                      {copyDone ? "Copiado!" : "Copiar relatório"}
                    </button>
                  </>
                )}
              </div>

              {showHistory && history.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-navy-50 pt-3">
                  {[...history].reverse().slice(0, 5).map((h) => (
                    <div key={h.id} className="rounded-xl bg-navy-50/50 px-3 py-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">
                          {TYPE_LABEL[h.type]}
                        </span>
                        <span className="text-[10px] text-navy-300">·</span>
                        <span className="text-[10px] text-navy-400">{AREA_LABEL[h.area]}</span>
                        {h.severity && (
                          <>
                            <span className="text-[10px] text-navy-300">·</span>
                            <span className={`text-[10px] font-medium ${h.severity === "alta" ? "text-terracotta-600" : h.severity === "media" ? "text-amber-600" : "text-navy-400"}`}>
                              {SEVERITY_LABEL[h.severity]}
                            </span>
                          </>
                        )}
                        <span className="ml-auto text-[10px] text-navy-300">
                          {new Date(h.ts).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] leading-snug text-navy-700">{h.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
