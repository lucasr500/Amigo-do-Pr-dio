// PROVA DE PARIDADE (D4) — fatia Decisoes relacional.
// Prova que o dual-write mantem o remoto identico ao local nos CAMPOS DE NEGOCIO,
// apos add / update / delete.
//
// Honestidade: o PUSH (toRow) NAO envia created_at/updated_at — sao geridos pelo
// servidor. A comparacao exclui createdAt/updatedAt deliberadamente.
//
// Determinismo: o push de dominio e fire-and-forget (`void mirror...`), util em
// producao (best-effort; o pull reconcilia) mas nao-deterministico em teste. Aqui
// o lado REMOTO e dirigido por chamadas mirror* com AWAIT explicito; o seed local
// roda com a flag OFF para nao disparar pushes paralelos. A fiacao real (addDecision
// dispara o push) e provada a parte, em um unico teste tolerante (WIRING).
//
// Lane: arquivo de teste NOVO; nao toca modulos de dominio. Supabase e tenantClient
// mockados em memoria — zero rede.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";

const h = vi.hoisted(() => ({
  condId: { value: "cond-A" as string | null },
  rows: new Map<string, Record<string, unknown>>(),
}));

vi.mock("@/lib/tenant/tenantClient", () => ({
  getActiveCondominioId: () => h.condId.value,
}));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: async () => ({
    from: (_t: string) => ({
      upsert: async (row: Record<string, unknown>) => {
        h.rows.set(row.id as string, { ...row });
        return { error: null };
      },
      delete: () => ({
        eq: (_c: string, _v: string) => ({
          eq: async (_c2: string, id: string) => {
            h.rows.delete(id);
            return { error: null };
          },
        }),
      }),
      select: (_cols: string) => ({
        eq: async (_c: string, cond: string) => ({
          data: Array.from(h.rows.values()).filter((r) => r.condominio_id === cond),
          error: null,
        }),
      }),
    }),
  }),
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

import { addDecision, updateDecision, deleteDecision, getDecisions, type Decision } from "@/lib/decisions";
import { mirrorUpsertDecision, mirrorDeleteDecision, listRemoteDecisions } from "@/lib/tenant/decisionsRemote";
import { setFlag, resetFlag } from "@/lib/feature-flags";

function business(d: Decision) {
  const { createdAt: _c, updatedAt: _u, ...rest } = d;
  return rest;
}
const byId = (a: { id: string }, b: { id: string }) => a.id.localeCompare(b.id);

// Compara local x remoto, ambos ja estabilizados (sem polling).
async function assertParidade() {
  const local = getDecisions().map(business).sort(byId);
  const remote = (await listRemoteDecisions()).map(business).sort(byId);
  expect(remote).toEqual(local);
}
async function remoteCount() {
  return (await listRemoteDecisions()).length;
}

// ── Seeds de DOMINIO com push automatico DESLIGADO (deterministico) ───────────
// Usa o codigo real de dominio (normalizacao, ids), mas sem o void-push paralelo.
function seedAdd(data: Parameters<typeof addDecision>[0]): Decision {
  resetFlag("decisions_remote_enabled");          // OFF: addDecision nao dispara push
  const d = addDecision(data);
  setFlag("decisions_remote_enabled", true);      // ON: para mirror*/listRemote
  return d;
}
function seedUpdate(id: string, patch: Parameters<typeof updateDecision>[1]): Decision {
  resetFlag("decisions_remote_enabled");
  updateDecision(id, patch);
  setFlag("decisions_remote_enabled", true);
  return getDecisions().find((x) => x.id === id)!;
}
function seedDelete(id: string): void {
  resetFlag("decisions_remote_enabled");
  deleteDecision(id);
  setFlag("decisions_remote_enabled", true);
}
// Espelha o estado local inteiro para o remoto, com AWAIT (deterministico).
async function mirrorAllLocal(): Promise<void> {
  for (const d of getDecisions()) await mirrorUpsertDecision(d);
}

let condSeq = 0;
beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
  h.rows.clear();
  h.condId.value = `cond-${++condSeq}`;
  setFlag("decisions_remote_enabled", true);
});
afterEach(() => {
  resetFlag("decisions_remote_enabled");
  localStorageMock.clear();
  h.rows.clear();
});

describe("Paridade local-remoto (D4) — dual-write deterministico", () => {
  test("ADD: cada decisao espelhada aparece identica no remoto", async () => {
    seedAdd({ title: "Troca do portao", date: "2026-06-01", category: "obras", context: "ctx", rationale: "fund", outcome: "aprovado" });
    seedAdd({ title: "Multa barulho", date: "2026-06-02", category: "juridico", context: "ctx2", rationale: "fund2", outcome: "aplicada", riskLevel: "medio" });
    await mirrorAllLocal();

    await assertParidade();
    expect(getDecisions()).toHaveLength(2);
    expect(await remoteCount()).toBe(2);
  });

  test("UPDATE: alteracao de campos e status reflete no remoto", async () => {
    const d = seedAdd({ title: "Contrato limpeza", date: "2026-06-03", category: "fornecedor", context: "c", rationale: "r", outcome: "o" });
    await mirrorAllLocal();
    await assertParidade();

    const u = seedUpdate(d.id, { outcome: "renegociado", status: "em_execucao", nextStep: "assinar aditivo" });
    await mirrorUpsertDecision(u);
    await assertParidade();

    expect(u.outcome).toBe("renegociado");
    expect(u.status).toBe("em_execucao");
  });

  test("DELETE: remocao local some do remoto (sem orfao)", async () => {
    const a = seedAdd({ title: "A", date: "2026-06-04", category: "outro", context: "", rationale: "", outcome: "x" });
    seedAdd({ title: "B", date: "2026-06-05", category: "outro", context: "", rationale: "", outcome: "y" });
    await mirrorAllLocal();
    await assertParidade();
    expect(await remoteCount()).toBe(2);

    seedDelete(a.id);
    await mirrorDeleteDecision(a.id);
    await assertParidade();

    expect((await listRemoteDecisions()).some((x) => x.id === a.id)).toBe(false);
    expect(await remoteCount()).toBe(1);
  });

  test("SEQUENCIA add-update-delete mantem paridade em cada passo", async () => {
    const d1 = seedAdd({ title: "Obra hall", date: "2026-06-06", category: "obras", context: "c", rationale: "r", outcome: "o" });
    const d2 = seedAdd({ title: "Acordo morador", date: "2026-06-07", category: "morador", context: "c", rationale: "r", outcome: "o" });
    await mirrorAllLocal();
    await assertParidade();

    const u = seedUpdate(d1.id, { status: "concluida", outcome: "entregue" });
    await mirrorUpsertDecision(u);
    await assertParidade();

    seedDelete(d2.id);
    await mirrorDeleteDecision(d2.id);
    await assertParidade();

    expect(getDecisions()).toHaveLength(1);
    expect(await remoteCount()).toBe(1);
  });

  // Prova de FIACAO (D1): addDecision com a flag ON dispara o push best-effort,
  // que eventualmente chega ao remoto. Operacao unica + waitFor tolerante.
  test("WIRING: addDecision (flag ON) dispara o push e chega ao remoto", async () => {
    const d = addDecision({ title: "Fiada", date: "2026-06-08", category: "outro", context: "", rationale: "", outcome: "ok" });
    await vi.waitFor(async () => {
      expect((await listRemoteDecisions()).some((x) => x.id === d.id)).toBe(true);
    }, { timeout: 2000, interval: 20 });
  });
});
