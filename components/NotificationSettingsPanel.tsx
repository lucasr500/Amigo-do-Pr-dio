"use client";

import { useEffect, useState } from "react";
import { setFlag } from "@/lib/feature-flags";
import { isPushSupported, getStoredSubscription, registerPush, unregisterPush } from "@/lib/push/pushManager";

const PREFS_KEY = "amigo_notif_prefs";

interface NotifPrefs {
  internal: boolean;
  deadlines: boolean;
  weeklyReview: boolean;
  healthAlerts: boolean;
  push: boolean;
}

const DEFAULTS: NotifPrefs = {
  internal: true,
  deadlines: true,
  weeklyReview: true,
  healthAlerts: true,
  push: false,
};

function readPrefs(): NotifPrefs {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

function writePrefs(p: NotifPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch { /* quota — ignora */ }
}

export function getNotifPrefs(): NotifPrefs {
  return readPrefs();
}

type ToggleRowProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
};

function ToggleRow({ label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-navy-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-navy-800">{label}</p>
        {description && (
          <p className="text-[11px] text-navy-400 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 flex h-6 w-10 flex-shrink-0 items-center rounded-full transition-colors
          ${checked ? "bg-teal-500" : "bg-navy-200"}
          ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-white shadow transition-transform
            ${checked ? "translate-x-5" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}

export default function NotificationSettingsPanel() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULTS);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushRegistered, setPushRegistered] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    const p = readPrefs();
    setPrefs(p);
    setPushSupported(isPushSupported());
    setPushRegistered(!!getStoredSubscription());
  }, []);

  function updatePref<K extends keyof NotifPrefs>(key: K, value: NotifPrefs[K]) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    writePrefs(next);

    if (key === "internal") {
      setFlag("notifications_enabled", value as boolean);
    }
  }

  async function togglePush(enable: boolean) {
    setPushLoading(true);
    if (enable) {
      const sub = await registerPush();
      setPushRegistered(!!sub);
      updatePref("push", !!sub);
    } else {
      await unregisterPush();
      setPushRegistered(false);
      updatePref("push", false);
    }
    setPushLoading(false);
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-navy-400 mb-1">
          Notificações internas
        </p>

        <ToggleRow
          label="Central de alertas"
          description="Avisos sobre vencimentos, revisões e saúde operacional dentro do app."
          checked={prefs.internal}
          onChange={(v) => updatePref("internal", v)}
        />
        <ToggleRow
          label="Prazos e vencimentos"
          description="AVCB, seguro, férias de funcionários e documentos próximos do vencimento."
          checked={prefs.deadlines}
          onChange={(v) => updatePref("deadlines", v)}
          disabled={!prefs.internal}
        />
        <ToggleRow
          label="Revisão semanal"
          description="Lembrete toda segunda-feira para revisar pendências da semana."
          checked={prefs.weeklyReview}
          onChange={(v) => updatePref("weeklyReview", v)}
          disabled={!prefs.internal}
        />
        <ToggleRow
          label="Alertas de saúde"
          description="Avisa quando o Health Score cair mais de 10 pontos em 7 dias."
          checked={prefs.healthAlerts}
          onChange={(v) => updatePref("healthAlerts", v)}
          disabled={!prefs.internal}
        />
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-navy-100">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-navy-400 mb-1">
          Notificações push
        </p>

        {pushSupported ? (
          <ToggleRow
            label="Push no navegador"
            description={
              pushRegistered
                ? "Push ativo. Você receberá alertas mesmo com o app fechado."
                : "Receba alertas urgentes mesmo com o app em segundo plano."
            }
            checked={prefs.push && pushRegistered}
            onChange={togglePush}
            disabled={pushLoading}
          />
        ) : (
          <div className="py-3 text-[12px] text-navy-400">
            Push não suportado neste navegador. Use Chrome ou Edge para ativar.
          </div>
        )}
      </div>

      <p className="px-1 text-[11px] text-navy-400 leading-relaxed">
        As configurações são salvas neste dispositivo. Notificações push requerem permissão do navegador.
      </p>
    </div>
  );
}
