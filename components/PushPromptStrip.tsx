"use client";

import { useEffect, useState } from "react";
import { getSessionMeta } from "@/lib/session";
import { isPushSupported } from "@/lib/push/pushManager";

const DISMISSED_KEY = "amigo_push_prompt_dismissed";

function isDismissed(): boolean {
  try { return localStorage.getItem(DISMISSED_KEY) === "1"; } catch { return false; }
}

function dismiss(): void {
  try { localStorage.setItem(DISMISSED_KEY, "1"); } catch { /* noop */ }
}

export default function PushPromptStrip() {
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<"idle" | "granted" | "denied">("idle");

  useEffect(() => {
    if (!isPushSupported()) return;
    if (isDismissed()) return;
    if (typeof Notification !== "undefined" && Notification.permission !== "default") return;
    const { sessionCount } = getSessionMeta();
    if (sessionCount < 2) return;
    setShow(true);
  }, []);

  if (!show) return null;

  const handleActivate = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        setStatus("granted");
        dismiss();
        setTimeout(() => setShow(false), 2200);
      } else {
        setStatus("denied");
        dismiss();
        setTimeout(() => setShow(false), 1800);
      }
    } catch {
      dismiss();
      setShow(false);
    }
  };

  const handleDismiss = () => {
    dismiss();
    setShow(false);
  };

  if (status === "granted") {
    return (
      <div className="mx-5 mb-3 flex items-center gap-2 rounded-[14px] border border-teal-200 bg-teal-50 px-4 py-3 sm:mx-6">
        <span className="text-[13px]" aria-hidden="true">✓</span>
        <p className="text-[12.5px] font-medium text-teal-800">Notificações ativadas.</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="mx-5 mb-3 flex items-center gap-2 rounded-[14px] border border-navy-100 bg-navy-50/60 px-4 py-3 sm:mx-6">
        <p className="text-[12px] text-navy-500">Tudo bem — você pode ativar depois em Configurações.</p>
      </div>
    );
  }

  return (
    <div className="mx-5 mb-3 animate-fade-in sm:mx-6">
      <div className="flex items-start gap-3 rounded-[14px] border border-navy-100/70 bg-white/80 px-4 py-3 shadow-sm">
        <span className="mt-0.5 flex-shrink-0 text-[16px]" aria-hidden="true">🔔</span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-navy-800">Alertas fora do app</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-navy-500">
            Receba alertas de vencimento mesmo com o app fechado.
          </p>
          <div className="mt-2.5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleActivate}
              className="rounded-full bg-navy-700 px-3.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-navy-800 active:scale-95"
            >
              Ativar
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-[11.5px] text-navy-400 hover:text-navy-600"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
