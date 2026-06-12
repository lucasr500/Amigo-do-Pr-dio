import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

// Simula localStorage em ambiente Node (setActiveCondominioId é chamado pelo
// tenantClient real, mas aqui mockamos ensureCondominio — o stub cobre apenas
// chamadas indiretas defensivas).
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
  length: 0,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  key: (_index: number) => null,
};
vi.stubGlobal("localStorage", localStorageMock);
vi.stubGlobal("window", { localStorage: localStorageMock });

import {
  runTenantBootstrap,
  resetTenantBootstrap,
  tenantStatusLabel,
  TENANT_IDLE,
  TENANT_LOADING,
  type TenantBootstrapDeps,
  type TenantState,
} from "@/lib/tenant/bootstrap";
import type { TenantResult } from "@/lib/tenant/types";

const OK_RESULT: TenantResult = {
  ok: true,
  context: {
    condominioId: "cond-1",
    condominio: { id: "cond-1", nome: "Edifício Aurora", slug: null, ownerId: "user-1", archivedAt: null },
    membership: { id: "memb-1", userId: "user-1", condominioId: "cond-1", role: "owner", status: "active" },
    role: "owner",
  },
};

function makeDeps(overrides?: Partial<TenantBootstrapDeps>): TenantBootstrapDeps {
  return {
    isDemoActive: () => false,
    ensureCondominio: vi.fn().mockResolvedValue(OK_RESULT),
    ...overrides,
  };
}

describe("runTenantBootstrap — guardas", () => {
  beforeEach(() => { resetTenantBootstrap(); store.clear(); });
  afterEach(() => { resetTenantBootstrap(); });

  test("guest não chama Supabase e retorna idle", async () => {
    const deps = makeDeps();
    const state = await runTenantBootstrap("guest", deps);
    expect(state).toEqual(TENANT_IDLE);
    expect(deps.ensureCondominio).not.toHaveBeenCalled();
  });

  test("userId vazio não chama Supabase e retorna idle", async () => {
    const deps = makeDeps();
    const state = await runTenantBootstrap("", deps);
    expect(state).toEqual(TENANT_IDLE);
    expect(deps.ensureCondominio).not.toHaveBeenCalled();
  });

  test("demo mode ativo não cria dados remotos e retorna idle", async () => {
    const deps = makeDeps({ isDemoActive: () => true });
    const state = await runTenantBootstrap("user-1", deps);
    expect(state).toEqual(TENANT_IDLE);
    expect(deps.ensureCondominio).not.toHaveBeenCalled();
  });
});

describe("runTenantBootstrap — fluxo autenticado", () => {
  beforeEach(() => { resetTenantBootstrap(); store.clear(); });
  afterEach(() => { resetTenantBootstrap(); });

  test("usuário autenticado recebe estado ready com condomínio", async () => {
    const deps = makeDeps();
    const state = await runTenantBootstrap("user-1", deps);
    expect(state.status).toBe("ready");
    expect(state.condominioId).toBe("cond-1");
    expect(state.condominioNome).toBe("Edifício Aurora");
    expect(state.errorMessage).toBeNull();
    expect(deps.ensureCondominio).toHaveBeenCalledWith({ userId: "user-1" });
  });

  test("erro do Supabase vira estado error com mensagem amigável (sem detalhes técnicos)", async () => {
    const deps = makeDeps({
      ensureCondominio: vi.fn().mockResolvedValue({ ok: false, error: 'permission denied for table "memberships"' }),
    });
    const state = await runTenantBootstrap("user-1", deps);
    expect(state.status).toBe("error");
    expect(state.condominioId).toBeNull();
    expect(state.errorMessage).toContain("dados locais continuam disponíveis");
    expect(state.errorMessage).not.toContain("permission denied");
  });

  test("exceção inesperada não propaga — vira estado error", async () => {
    const deps = makeDeps({
      ensureCondominio: vi.fn().mockRejectedValue(new Error("network down")),
    });
    const state = await runTenantBootstrap("user-1", deps);
    expect(state.status).toBe("error");
    expect(state.errorMessage).not.toContain("network down");
  });

  test("chamadas concorrentes compartilham uma única execução (dedupe)", async () => {
    let resolveEnsure: (r: TenantResult) => void = () => {};
    const pending = new Promise<TenantResult>((resolve) => { resolveEnsure = resolve; });
    const ensureCondominio = vi.fn().mockReturnValue(pending);
    const deps = makeDeps({ ensureCondominio });

    const p1 = runTenantBootstrap("user-1", deps);
    const p2 = runTenantBootstrap("user-1", deps);
    resolveEnsure(OK_RESULT);
    const [s1, s2] = await Promise.all([p1, p2]);

    expect(ensureCondominio).toHaveBeenCalledTimes(1);
    expect(s1.status).toBe("ready");
    expect(s2).toEqual(s1);
  });

  test("usuários diferentes não compartilham dedupe", async () => {
    const deps = makeDeps();
    await Promise.all([
      runTenantBootstrap("user-1", deps),
      runTenantBootstrap("user-2", deps),
    ]);
    expect(deps.ensureCondominio).toHaveBeenCalledTimes(2);
  });

  test("chamada repetida sequencial é idempotente (re-executa e devolve ready)", async () => {
    const deps = makeDeps();
    const first = await runTenantBootstrap("user-1", deps);
    const second = await runTenantBootstrap("user-1", deps);
    expect(first.status).toBe("ready");
    expect(second.status).toBe("ready");
    // A idempotência de dados é do servidor (ensureDefaultCondominioForUser
    // reaproveita condomínio existente) — aqui garantimos que o retry é seguro.
    expect(deps.ensureCondominio).toHaveBeenCalledTimes(2);
  });

  test("após falha, retry executa de novo (dedupe não congela erro)", async () => {
    const ensureCondominio = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: "boom" })
      .mockResolvedValueOnce(OK_RESULT);
    const deps = makeDeps({ ensureCondominio });

    const first = await runTenantBootstrap("user-1", deps);
    const second = await runTenantBootstrap("user-1", deps);
    expect(first.status).toBe("error");
    expect(second.status).toBe("ready");
  });
});

describe("tenantStatusLabel — texto honesto por estado", () => {
  const READY: TenantState = {
    status: "ready",
    condominioId: "cond-1",
    condominioNome: "Edifício Aurora",
    errorMessage: null,
  };

  test("guest nunca exibe conta conectada", () => {
    const label = tenantStatusLabel(READY, { isAuthenticated: false, isDemo: false });
    expect(label.text).toBeNull();
  });

  test("demo nunca exibe conta conectada, mesmo autenticado", () => {
    const label = tenantStatusLabel(READY, { isAuthenticated: true, isDemo: true });
    expect(label.text).toBeNull();
  });

  test("loading exibe preparação", () => {
    const label = tenantStatusLabel(TENANT_LOADING, { isAuthenticated: true, isDemo: false });
    expect(label.text).toBe("Preparando seu condomínio…");
    expect(label.tone).toBe("neutral");
  });

  test("ready exibe conta conectada com nome do condomínio", () => {
    const label = tenantStatusLabel(READY, { isAuthenticated: true, isDemo: false });
    expect(label.text).toBe("Conta conectada · Edifício Aurora");
    expect(label.tone).toBe("positive");
  });

  test("ready sem nome exibe apenas conta conectada", () => {
    const label = tenantStatusLabel(
      { ...READY, condominioNome: null },
      { isAuthenticated: true, isDemo: false }
    );
    expect(label.text).toBe("Conta conectada");
  });

  test("error exibe mensagem amigável com tom de aviso", () => {
    const label = tenantStatusLabel(
      { status: "error", condominioId: null, condominioNome: null, errorMessage: "Não foi possível carregar o condomínio agora. Seus dados locais continuam disponíveis." },
      { isAuthenticated: true, isDemo: false }
    );
    expect(label.text).toContain("dados locais continuam disponíveis");
    expect(label.tone).toBe("warning");
  });

  test("idle não exibe nada", () => {
    const label = tenantStatusLabel(TENANT_IDLE, { isAuthenticated: true, isDemo: false });
    expect(label.text).toBeNull();
  });
});
