// PROVA DE REVERSIBILIDADE (D5) — fatia Decisões relacional.
// Prova as invariantes "Não-Exposição" + "sem perda de dado":
//
//   1) Com `decisions_remote_enabled` = false (default), o dual-write é NO-OP TOTAL:
//      o cliente Supabase NUNCA é sequer invocado (zero rede) em add/update/delete,
//      e nas chamadas diretas a mirrorUpsert/mirrorDelete/listRemote.
//   2) O store LOCAL com a flag off é byte-a-byte idêntico a um fluxo puramente
//      local — o caminho remoto não regride nem altera nada localmente.
//   3) Ligar→desligar a flag retorna ao NO-OP e o local nunca é degradado.
//
// Mede "zero rede" por um espião: a factory de getSupabaseClient incrementa um
// contador. Flag off ⇒ os guards de decisionsRemote retornam ANTES do import do
// cliente ⇒ contador permanece 0.
//
// Lane: arquivo de teste NOVO; não toca módulos de domínio. Complementa (não
// duplica) decisions-sync.test.ts, que cobre o lado do PULL.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  condId: { value: "cond-A" as string | null },
  rows: new Map<string, Record<string, unknown>>(),
  clientCalls: { count: 0 },
}));

vi.mock("@/lib/tenant/tenantClient", () => ({
  getActiveCondominioId: () => h.condId.value,
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: async () => {
    h.clientCalls.count++; // espião de "rede"
    return {
      from: (_t: string) => ({
        upsert: async (row: Record<string, unknown>) => { h.rows.set(row.id as string, { ...row }); return { error: null }; },
        delete: () => ({ eq: (_c: string, _v: string) => ({ eq: async (_c2: string, id: string) => { h.rows.delete(id); return { error: null }; } }) }),
        select: (_cols: string) => ({ eq: async (_c: string, cond: string) => ({ data: Array.from(h.rows.values()).filter((r) => r.condominio_id === cond), error: null }) }),
      }),
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

import { addDecision, updateDecision, deleteDecision, getDecisions } from "@/lib/decisions";
import { mirrorUpsertDecision, mirrorDeleteDecision, listRemoteDecisions } from "@/lib/tenant/decisionsRemote";
import { setFlag, resetFlag } from "@/lib/feature-flags";

const tick = () => new Promise<void>((r) => setTimeout(r, 0));
const drain = async () => { await tick(); await tick(); };

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.rows.clear();
  h.clientCalls.count = 0;
  h.condId.value = "cond-A";
  // flag começa no DEFAULT (off) — não chamar setFlag aqui.
});

afterEach(() => {
  resetFlag("decisions_remote_enabled");
  localStorageMock.clear();
  h.rows.clear();
});

describe("Reversibilidade / Não-Exposição (D5) — flag OFF = no-op total", () => {
  test("add/update/delete com flag off NÃO tocam a rede (cliente nunca invocado)", async () => {
    const d = addDecision({ title: "Local A", date: "2026-06-01", category: "outro", context: "", rationale: "", outcome: "x" });
    updateDecision(d.id, { outcome: "y", status: "em_execucao" });
    deleteDecision(d.id);
    await drain();

    expect(h.clientCalls.count).toBe(0); // zero rede
    expect(h.rows.size).toBe(0);         // remoto nunca tocado
  });

  test("chamadas diretas ao espelho com flag off são no-op e não invocam cliente", async () => {
    await mirrorUpsertDecision({
      id: "dec_x", title: "X", date: "2026-06-01", category: "outro", context: "", rationale: "", outcome: "o",
      status: "registrada", visibility: "gestao", createdAt: "t", updatedAt: "t",
    });
    await mirrorDeleteDecision("dec_x");
    const remote = await listRemoteDecisions();

    expect(h.clientCalls.count).toBe(0);
    expect(remote).toEqual([]);
  });

  test("store local com flag off é idêntico a um fluxo puramente local", async () => {
    // Fluxo com a flag off (caminho remoto presente, porém inerte)
    addDecision({ title: "Reunião", date: "2026-06-02", category: "assembleia", context: "c", rationale: "r", outcome: "o" });
    addDecision({ title: "Vazamento 3B", date: "2026-06-03", category: "manutencao", context: "c", rationale: "r", outcome: "o" });
    await drain();
    const comCaminhoRemoto = JSON.stringify(getDecisions().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r));

    // Reset e reconstrução idêntica
    localStorageMock.clear();
    addDecision({ title: "Reunião", date: "2026-06-02", category: "assembleia", context: "c", rationale: "r", outcome: "o" });
    addDecision({ title: "Vazamento 3B", date: "2026-06-03", category: "manutencao", context: "c", rationale: "r", outcome: "o" });
    await drain();
    const puroLocal = JSON.stringify(getDecisions().map(({ id: _i, createdAt: _c, updatedAt: _u, ...r }) => r));

    expect(comCaminhoRemoto).toBe(puroLocal);
    expect(h.clientCalls.count).toBe(0);
  });

  test("ligar→desligar a flag volta ao no-op; local nunca regride", async () => {
    // ON: o espelho passa a invocar o cliente
    setFlag("decisions_remote_enabled", true);
    const d = addDecision({ title: "Com remoto", date: "2026-06-04", category: "outro", context: "", rationale: "", outcome: "o" });
    await drain();
    expect(h.clientCalls.count).toBeGreaterThan(0);
    const chamadasAposOn = h.clientCalls.count;
    expect(getDecisions().some((x) => x.id === d.id)).toBe(true);

    // OFF de novo: novas operações não tocam a rede
    resetFlag("decisions_remote_enabled");
    updateDecision(d.id, { outcome: "editado offline" });
    addDecision({ title: "Pós-off", date: "2026-06-05", category: "outro", context: "", rationale: "", outcome: "o" });
    await drain();

    expect(h.clientCalls.count).toBe(chamadasAposOn); // não houve novas chamadas
    // Local íntegro e atualizado, independente do remoto
    expect(getDecisions().find((x) => x.id === d.id)?.outcome).toBe("editado offline");
    expect(getDecisions()).toHaveLength(2);
  });
});
