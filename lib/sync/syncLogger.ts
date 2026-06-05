type SyncLogData = Record<string, unknown>;

export function syncDebug(scope: "sync" | "autoSync", msg: string, data?: SyncLogData): void {
  if (process.env.NODE_ENV !== "development") return;
  if (typeof console === "undefined" || typeof console.debug !== "function") return;
  console.debug(`[${scope}] ${msg}`, data ?? "");
}
