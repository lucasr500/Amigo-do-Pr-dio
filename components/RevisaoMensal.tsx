"use client";

import { useEffect, useState } from "react";
import {
  getSessionMeta,
  recordRevisaoMensal,
  getMemoriaOperacional,
  getProfile,
  getPendenciasConcluidas,
  logInteraction,
  MemoriaOperacional,
  CondominioProfile,
  type Pendencia,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";
import { buildGuidanceEngine, type GuidanceEngineItem } from "@/lib/guidance-engine";

type StatusItem = {
  label: string;
  icon: string;
  status: "ok" | "atencao" | "revisar" | "vencido";
};

function diasAte(iso: string): number {
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);
}

function diasDesde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function isFuture(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

function isThisMonth(iso?: string): boolean {
  if (!iso) return false;
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function isDoneThisMonth(lastAt: string | null): boolean {
  if (!lastAt) return false;
  return isThisMonth(lastAt);
}

function shortTitle(title: string): string {
  return title.length > 54 ? `${title.slice(0, 54)}…` : title;
}

function buildStatusItems(m: MemoriaOperacional, profile: CondominioProfile | null): StatusItem[] {
  const items: StatusItem[] = [];

  if (m.vencimentoAVCB) {
    const d = diasAte(m.vencimentoAVCB);
    items.push({ label: "AVCB", icon: "📋", status: d < 0 ? "vencido" : d <= 90 ? "atencao" : "ok" });
  }
  if (m.vencimentoSeguro) {
    const d = diasAte(m.vencimentoSeguro);
    items.push({ label: "Seguro", icon: "🛡️", status: d < 0 ? "vencido" : d <= 30 ? "atencao" : "ok" });
  }
  if (m.ultimaAGO && !isFuture(m.ultimaAGO)) {
    const meses = Math.floor(diasDesde(m.ultimaAGO) / 30);
    items.push({ label: "AGO", icon: "👥", status: meses >= 14 ? "revisar" : meses >= 10 ? "atencao" : "ok" });
  }
  if (m.ultimaDedetizacao && !isFuture(m.ultimaDedetizacao)) {
    const ds = diasDesde(m.ultimaDedetizacao);
    items.push({ label: "Dedetização", icon: "🐛", status: ds > 180 ? "revisar" : ds > 150 ? "atencao" : "ok" });
  }
  if (m.ultimaLimpezaCaixaDAgua && !isFuture(m.ultimaLimpezaCaixaDAgua)) {
    const ds = diasDesde(m.ultimaLimpezaCaixaDAgua);
    items.push({ label: "Caixa d'água", icon: "💧", status: ds > 180 ? "revisar" : ds > 150 ? "atencao" : "ok" });
  }
  if (m.ultimaManutencaoElevador && profile?.hasElevador && !isFuture(m.ultimaManutencaoElevador)) {
    const ds = diasDesde(m.ultimaManutencaoElevador);
    items.push({ label: "Elevador", icon: "🛗", status: ds > 45 ? "revisar" : ds > 30 ? "atencao" : "ok" });
  }
  if (m.ultimaInspecaoExtintores && !isFuture(m.ultimaInspecaoExtintores)) {
    const ds = diasDesde(m.ultimaInspecaoExtintores);
    items.push({ label: "Extintores", icon: "🧯", status: ds > 210 ? "revisar" : ds > 150 ? "atencao" : "ok" });
  }

  return items;
}

const STATUS_STYLE: Record<StatusItem["status"], string> = {
  ok:      "bg-navy-50 text-navy-600 ring-1 ring-navy-100",
  atencao: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  revisar: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  vencido: "bg-amber-100 text-amber-900 ring-1 ring-amber-400 font-semibold",
};

const STATUS_SYMBOL: Record<StatusItem["status"], string> = {
  ok:      "✓",
  atencao: "!",
  revisar: "!!",
  vencido: "✗",
};

type RevisaoMensalProps = {
  refreshKey?: number;
  onDone?: () => void;
};

export default function RevisaoMensal({ refreshKey, onDone }: RevisaoMensalProps) {
  const [hydrated, setHydrated] = useState(false);
  const [show, setShow] = useState(false);
  const [items, setItems] = useState<StatusItem[]>([]);
  const [resolvedThisMonth, setResolvedThisMonth] = useState<Pendencia[]>([]);
  const [topActions, setTopActions] = useState<GuidanceEngineItem[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const meta = getSessionMeta();
    const m = getMemoriaOperacional();
    const profile = getProfile();
    const built = buildStatusItems(m, profile);
    const resolved = getPendenciasConcluidas()
      .filter((p) => isThisMonth(p.completedAt))
      .slice(-4)
      .reverse();

    if (built.length === 0) return;

    const shouldShow = !isDoneThisMonth(meta.lastRevisaoMensalAt);

    if (shouldShow) {
      setItems(built);
      setResolvedThisMonth(resolved);
      const guidance = buildGuidanceEngine();
      setTopActions(guidance.topTresHoje.slice(0, 3));
      setShow(true);
      void trackEvent("revisao_mensal_shown", { item_count: built.length });
      logInteraction("revisao-mensal-exibida", String(built.length));
    }

    setHydrated(true);
  }, [refreshKey]);

  if (!hydrated || !show || dismissed) return null;

  const okCount = items.filter((i) => i.status === "ok").length;
  const attentionCount = items.filter((i) => i.status !== "ok").length;

  const mes = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const handleDone = () => {
    recordRevisaoMensal();
    void trackEvent("revisao_mensal_done", { ok_count: okCount, attention_count: attentionCount });
    setDismissed(true);
    onDone?.();
  };

  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="rounded-2xl border border-navy-100 bg-white/90 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">
              Revisão operacional
            </p>
            <p className="text-[13px] font-semibold text-navy-800">{mes}</p>
          </div>
          <div className="text-right">
            {attentionCount > 0 ? (
              <p className="text-[11px] font-medium text-amber-600">
                {attentionCount} item{attentionCount > 1 ? "s" : ""} para revisar
              </p>
            ) : (
              <p className="text-[11px] font-medium text-navy-600">Tudo em dia</p>
            )}
            <p className="text-[10px] text-navy-400">{okCount} em ordem</p>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item.label}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] ${STATUS_STYLE[item.status]}`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
              <span className="font-bold" aria-hidden="true">{STATUS_SYMBOL[item.status]}</span>
            </span>
          ))}
        </div>

        {topActions.length > 0 && (
          <div className="mb-3 rounded-xl border border-navy-100/60 bg-navy-50/40 px-3 py-2.5">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
              Ações prioritárias para este mês
            </p>
            <ul className="space-y-2">
              {topActions.map((action) => (
                <li key={action.id} className="flex items-start gap-2">
                  <span
                    className={`mt-[1px] flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      action.prioridade === "critico"
                        ? "bg-terracotta-100 text-terracotta-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {action.prioridade === "critico" ? "!" : "→"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium leading-snug text-navy-700">{action.titulo}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-navy-500">{action.proximoPasso}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-3 rounded-lg bg-navy-50/60 px-3 py-2.5">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
            O que foi resolvido neste mês
          </p>
          {resolvedThisMonth.length > 0 ? (
            <ul className="mt-2 space-y-1.5">
              {resolvedThisMonth.map((p) => (
                <li key={p.id} className="flex items-start gap-2 text-[12px] leading-snug text-navy-700">
                  <span className="mt-[1px] text-navy-400" aria-hidden="true">✓</span>
                  <span className="line-clamp-2">{shortTitle(p.titulo)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1.5 text-[12px] leading-relaxed text-navy-500">
              Os próximos passos concluídos neste mês aparecerão aqui.
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-navy-50 pt-3">
          <button
            type="button"
            onClick={handleDone}
            className="rounded-xl bg-navy-700 px-4 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-navy-800 active:scale-95"
          >
            Revisão concluída
          </button>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-[11px] text-navy-400 hover:text-navy-600"
          >
            Agora não
          </button>
        </div>
      </div>
    </section>
  );
}
