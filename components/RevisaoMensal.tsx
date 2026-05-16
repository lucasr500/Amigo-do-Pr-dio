"use client";

import { useEffect, useState } from "react";
import {
  getSessionMeta,
  recordRevisaoMensal,
  getMemoriaOperacional,
  getProfile,
  logInteraction,
  MemoriaOperacional,
  CondominioProfile,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

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
  ok:      "bg-sage-50 text-sage-700 ring-1 ring-sage-200",
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
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const meta = getSessionMeta();
    const m = getMemoriaOperacional();
    const profile = getProfile();
    const built = buildStatusItems(m, profile);

    if (built.length === 0) return;

    const daysSinceLast = meta.lastRevisaoMensalAt
      ? Math.floor((Date.now() - new Date(meta.lastRevisaoMensalAt).getTime()) / 86400000)
      : null;

    const shouldShow = daysSinceLast === null || daysSinceLast >= 25;

    if (shouldShow) {
      setItems(built);
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
              <p className="text-[11px] font-medium text-sage-600">Tudo em dia</p>
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
