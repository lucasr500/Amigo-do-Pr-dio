// Gerenciador de Web Push — registro de service worker e subscription.
// Funciona apenas quando push_enabled flag estiver ativa e VAPID key configurada.

const SW_PATH = "/sw.js";
const PUSH_KEY = "amigo_push_subscription";

export interface PushRegistration {
  endpoint: string;
  expirationTime: number | null;
  keys: { p256dh: string; auth: string };
}

function getVapidKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getStoredSubscription(): PushRegistration | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PUSH_KEY);
    return raw ? (JSON.parse(raw) as PushRegistration) : null;
  } catch {
    return null;
  }
}

function storeSubscription(sub: PushRegistration | null): void {
  if (typeof window === "undefined") return;
  try {
    if (sub) {
      localStorage.setItem(PUSH_KEY, JSON.stringify(sub));
    } else {
      localStorage.removeItem(PUSH_KEY);
    }
  } catch { /* quota — ignora */ }
}

// Registra service worker e retorna subscription Push.
// Retorna null se não suportado, permissão negada, ou chave ausente.
export async function registerPush(): Promise<PushRegistration | null> {
  if (!isPushSupported()) return null;

  const vapidKey = getVapidKey();
  if (!vapidKey) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const reg = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
    await navigator.serviceWorker.ready;

    const existing = await reg.pushManager.getSubscription();
    const rawSub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    });

    const json = rawSub.toJSON();
    const sub: PushRegistration = {
      endpoint: rawSub.endpoint,
      expirationTime: rawSub.expirationTime,
      keys: {
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      },
    };

    storeSubscription(sub);
    return sub;
  } catch {
    return null;
  }
}

export async function unregisterPush(): Promise<void> {
  storeSubscription(null);
  if (!isPushSupported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    await sub?.unsubscribe();
  } catch { /* ignora */ }
}

