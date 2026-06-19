// PROVAS da trilha de moderação (016) — toda ação gera entrada; flag off = no-op.
// A imutabilidade/isolamento do log é provada no gate de CI (RLS contra Postgres real).

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  condId: { value: "cond-A" as string | null },
  logs: [] as Record<string, unknown>[],
  clientCalls: { count: 0 },
}));

vi.mock("@/lib/tenant/tenantClient", () => ({ getActiveCondominioId: () => h.condId.value }));
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: async () => {
    h.clientCalls.count++;
    return {
      from: (t: string) => t === "moderation_log"
        ? { insert: async (row: Record<string, unknown>) => { h.logs.push(row); return { error: null }; } }
        : {
            upsert: async () => ({ error: null }),
            select: () => ({ eq: async () => ({ data: [], error: null }) }),
          },
    };
  },
}));

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

import { logModerationAction } from "@/lib/tenant/moderationLog";
import { addComment, moderateComment } from "@/lib/community-posts";
import { setFlag, resetFlag } from "@/lib/feature-flags";

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const drain = async () => { await tick(); await tick(); await tick(); };

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.logs.length = 0;
  h.clientCalls.count = 0;
  h.condId.value = "cond-A";
});
afterEach(() => { resetFlag("comments_remote_enabled"); localStorageMock.clear(); });

describe("moderationLog — reversibilidade (flag OFF = no-op total)", () => {
  test("logModerationAction com flag off → zero rede", async () => {
    await logModerationAction({ targetId: "c1", action: "removido" });
    expect(h.clientCalls.count).toBe(0);
    expect(h.logs).toHaveLength(0);
  });
});

describe("moderationLog — toda ação de moderação gera entrada (flag ON)", () => {
  beforeEach(() => setFlag("comments_remote_enabled", true));

  test("addComment comum → entrada 'criado'", async () => {
    const c = addComment("post-1", "Morador", "obrigado", true);
    await drain();
    const entry = h.logs.find((l) => l.target_id === c.id);
    expect(entry?.action).toBe("criado");
  });

  test("addComment sensível → entrada 'marcado_sensivel'", async () => {
    const c = addComment("post-1", "Morador", "o vizinho é inadimplente", true);
    await drain();
    const entry = h.logs.find((l) => l.target_id === c.id);
    expect(entry?.action).toBe("marcado_sensivel");
  });

  test("moderateComment → entradas 'aprovado' / 'ocultado' / 'removido' com snapshot", async () => {
    const c = addComment("post-1", "Morador", "neutro");
    await drain();
    h.logs.length = 0;

    moderateComment(c.id, "publicado"); await drain();
    moderateComment(c.id, "oculto");    await drain();
    moderateComment(c.id, "removido");  await drain();

    const actions = h.logs.filter((l) => l.target_id === c.id).map((l) => l.action);
    expect(actions).toContain("aprovado");
    expect(actions).toContain("ocultado");
    expect(actions).toContain("removido");
    expect(h.logs.find((l) => l.action === "removido")?.snapshot).toBeTruthy();
  });
});
