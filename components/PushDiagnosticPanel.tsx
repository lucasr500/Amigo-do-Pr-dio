"use client";

import { useEffect, useState } from "react";
import { isPushSupported, getStoredSubscription } from "@/lib/push/pushManager";

type PushDiagState = {
  supported: boolean;
  permission: string;
  swRegistered: boolean;
  subscription: boolean;
  vapidConfigured: boolean;
};

export default function PushDiagnosticPanel() {
  const [state, setState] = useState<PushDiagState | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    async function load() {
      const supported = isPushSupported();
      const permission =
        supported && "Notification" in window ? Notification.permission : "not_supported";
      const subscription = getStoredSubscription() !== null;
      const vapidConfigured = !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      let swRegistered = false;
      try {
        const reg = await navigator.serviceWorker?.getRegistration("/sw.js");
        swRegistered = !!reg;
      } catch { /* noop */ }

      setState({ supported, permission, swRegistered, subscription, vapidConfigured });
      setHydrated(true);
    }
    void load();
  }, []);

  async function handleTest() {
    if (!state?.supported) {
      setTestResult({ ok: false, msg: "Push não suportado neste dispositivo/navegador." });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setTestResult({ ok: false, msg: "Permissão negada. Habilite notificações nas configurações do navegador ou sistema operacional." });
        setTesting(false);
        return;
      }
      setState((prev) => prev ? { ...prev, permission } : null);

      const swReg = await navigator.serviceWorker?.getRegistration("/sw.js");
      if (swReg) {
        await swReg.showNotification("Amigo do Prédio", {
          body: "Teste de notificação bem-sucedido.",
          icon: "/icons/icon-192.png",
          tag: "push-test",
        });
        setTestResult({ ok: true, msg: "Notificação enviada com sucesso via service worker." });
      } else {
        new Notification("Amigo do Prédio — Teste", {
          body: "Notificações funcionando neste dispositivo.",
          icon: "/icons/icon-192.png",
        });
        setTestResult({ ok: true, msg: "Notificação enviada via API direta (sem SW)." });
      }
    } catch (e) {
      setTestResult({ ok: false, msg: `Erro: ${e instanceof Error ? e.message : "desconhecido"}` });
    } finally {
      setTesting(false);
    }
  }

  if (!hydrated || !state) return null;

  const PERMISSION_LABEL: Record<string, string> = {
    granted: "Concedida",
    denied: "Negada",
    default: "Pendente",
    not_supported: "N/A",
  };

  const checks: Array<{ label: string; ok: boolean; warn?: boolean; text?: string }> = [
    { label: "Push suportado neste dispositivo",  ok: state.supported },
    { label: "Service worker registrado",          ok: state.swRegistered },
    {
      label: "Permissão de notificação",
      ok: state.permission === "granted",
      warn: state.permission === "default",
      text: PERMISSION_LABEL[state.permission] ?? state.permission,
    },
    { label: "Subscription ativa (armazenada)",   ok: state.subscription },
    { label: "Chave VAPID configurada",            ok: state.vapidConfigured },
  ];

  return (
    <div className="px-5 pb-3 sm:px-6">
      <div className="rounded-[18px] border border-navy-100/80 bg-white/90 px-4 py-4 shadow-sm">
        <p className="mb-0.5 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-navy-400">
          Diagnóstico de Push
        </p>
        <p className="mb-3 text-[13px] font-semibold text-navy-800">
          Estado das notificações
        </p>

        <div className="mb-3 space-y-2">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center justify-between gap-2">
              <p className="text-[11.5px] text-navy-600">{c.label}</p>
              <span
                className={`flex-shrink-0 text-[11px] font-semibold ${
                  c.ok ? "text-teal-600" : c.warn ? "text-amber-600" : "text-terracotta-600"
                }`}
              >
                {c.text ?? (c.ok ? "OK" : c.warn ? "Pendente" : "Não")}
              </span>
            </div>
          ))}
        </div>

        {!state.supported && (
          <div className="mb-3 rounded-xl bg-amber-50/80 px-3 py-2.5">
            <p className="text-[11.5px] leading-relaxed text-amber-800">
              Este navegador/dispositivo não suporta push. No iPhone, instale o app na tela inicial (PWA) para ativar notificações.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleTest}
          disabled={testing || !state.supported}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-navy-700 px-4 py-2 text-[12px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.97] disabled:bg-navy-200 disabled:text-navy-400"
        >
          {testing ? "Enviando…" : "Testar notificação"}
        </button>

        {testResult && (
          <p className={`mt-2 text-[11.5px] leading-snug ${testResult.ok ? "text-teal-600" : "text-terracotta-600"}`}>
            {testResult.msg}
          </p>
        )}
      </div>
    </div>
  );
}
