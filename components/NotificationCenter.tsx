"use client";

import { useEffect, useState } from "react";
import {
  getNotifications,
  markNotificationRead,
  dismissNotification,
  markAllNotificationsRead,
  type AppNotification,
} from "@/lib/session";
import { isEnabled } from "@/lib/feature-flags";

const SEVERITY_STYLE: Record<AppNotification["severity"], string> = {
  critical: "border-terracotta-200 bg-terracotta-50/60",
  warning:  "border-amber-200 bg-amber-50/60",
  info:     "border-navy-100 bg-navy-50/40",
};

const SEVERITY_DOT: Record<AppNotification["severity"], string> = {
  critical: "bg-terracotta-500",
  warning:  "bg-amber-500",
  info:     "bg-navy-400",
};

const SEVERITY_GROUP_LABEL: Record<AppNotification["severity"], string> = {
  critical: "Crítico",
  warning:  "Atenção",
  info:     "Informativo",
};

const SEVERITY_GROUP_COLOR: Record<AppNotification["severity"], string> = {
  critical: "text-terracotta-700",
  warning:  "text-amber-700",
  info:     "text-navy-500",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const d    = Math.floor(diff / 86400000);
  if (min < 2)   return "agora mesmo";
  if (min < 60)  return `há ${min} min`;
  if (h < 24)    return `há ${h}h`;
  if (d === 1)   return "ontem";
  if (d < 30)    return `há ${d} dias`;
  return "há mais de um mês";
}

type Props = {
  onClose: () => void;
  onAction?: (actionKey: string) => void;
};

export default function NotificationCenter({ onClose, onAction }: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isEnabled("notifications_enabled")) { setHydrated(true); return; }
    // Ordena por severidade (critical first) depois por data
    const severityOrder: Record<AppNotification["severity"], number> = { critical: 0, warning: 1, info: 2 };
    const all = getNotifications()
      .filter((n) => !n.dismissed)
      .sort((a, b) => {
        const sev = severityOrder[a.severity] - severityOrder[b.severity];
        if (sev !== 0) return sev;
        return b.createdAt.localeCompare(a.createdAt);
      });
    setNotifications(all);
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const unread = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDismiss = (id: string) => {
    dismissNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleRead = (n: AppNotification) => {
    if (!n.read) {
      markNotificationRead(n.id);
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
      );
    }
    if (n.actionKey && onAction) {
      onAction(n.actionKey);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-navy-900/20 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-[440px] animate-fade-in-up rounded-t-[28px] bg-[#FAF8F4] pb-safe sm:rounded-[28px] sm:mb-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-[15px] font-semibold text-navy-800">Notificações</p>
            {unread > 0 && (
              <p className="text-[11px] text-navy-400">{unread} não lida{unread > 1 ? "s" : ""}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11.5px] text-navy-500 hover:text-navy-700"
              >
                Marcar todas como lidas
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-100 text-navy-500 hover:bg-navy-200"
              aria-label="Fechar notificações"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none">
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Lista agrupada por severidade */}
        <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">
          {notifications.length === 0 && (
            <div className="rounded-xl bg-navy-50/60 px-4 py-5 text-center">
              <p className="text-[13px] font-medium text-navy-700">Nenhum alerta ativo</p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-navy-400">
                O monitoramento está rodando. Alertas aparecem quando prazos se aproximam ou dados precisam de atenção.
              </p>
            </div>
          )}

          {(["critical", "warning", "info"] as const).map((severity) => {
            const group = notifications.filter((n) => n.severity === severity);
            if (group.length === 0) return null;
            return (
              <div key={severity} className="mb-4">
                <p className={`mb-2 text-[10.5px] font-semibold uppercase tracking-wide ${SEVERITY_GROUP_COLOR[severity]}`}>
                  {SEVERITY_GROUP_LABEL[severity]}
                </p>
                <div className="space-y-2">
                  {group.map((n) => (
                    <div
                      key={n.id}
                      className={`relative rounded-xl border px-3.5 py-3 transition-colors ${SEVERITY_STYLE[n.severity]} ${!n.read ? "ring-1 ring-navy-100" : ""}`}
                    >
                      {!n.read && (
                        <span
                          className={`absolute right-3 top-3 h-1.5 w-1.5 rounded-full ${SEVERITY_DOT[n.severity]}`}
                          aria-hidden="true"
                        />
                      )}
                      <button
                        type="button"
                        className="w-full pr-4 text-left"
                        onClick={() => handleRead(n)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-[12.5px] font-semibold leading-snug ${n.read ? "text-navy-600" : "text-navy-800"}`}>
                            {n.title}
                          </p>
                          <span className="flex-shrink-0 text-[10px] text-navy-300 mt-px">
                            {relativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-navy-500">
                          {n.body}
                        </p>
                        {n.actionKey && (
                          <p className="mt-1 text-[11px] font-medium text-navy-600">
                            Ver →
                          </p>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismiss(n.id)}
                        className="absolute bottom-2.5 right-3 text-[10px] text-navy-300 hover:text-navy-500"
                        aria-label="Dispensar"
                      >
                        Dispensar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
