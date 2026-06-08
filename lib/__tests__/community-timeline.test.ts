import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { getTimeline, emitBackupExported, emitSupplierRegistered, emitReservationApproved, emitReservationCancelled } from "@/lib/community-timeline";
import { addPendencia, completePendencia } from "@/lib/session-pendencias";
import { upsertDocumento, type DocumentoEssencial } from "@/lib/session-documentos";

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
});

afterEach(() => { localStorageMock.clear(); });

function makeDoc(dataVencimento = "2026-12-31"): DocumentoEssencial {
  return {
    id: "avcb_clcb",
    status: "tenho",
    dataVencimento,
    updatedAt: "2026-06-01T00:00:00.000Z",
  };
}

describe("community timeline — emits operacionais", () => {
  test("emitBackupExported registra backup exportado sem duplicar clique recente", () => {
    emitBackupExported();
    emitBackupExported();
    const events = getTimeline().filter((e) => e.type === "backup_exportado");
    expect(events).toHaveLength(1);
  });

  test("emitSupplierRegistered registra fornecedor cadastrado", () => {
    emitSupplierRegistered("sup_1", "Elevadores Alfa", "Elevador");
    const [event] = getTimeline();
    expect(event.type).toBe("fornecedor_cadastrado");
    expect(event.title).toContain("Elevadores Alfa");
  });

  test("completePendencia emite pendência concluída automaticamente", () => {
    const p = addPendencia({ titulo: "Verificar bomba", categoria: "operacional", origem: "manual" });
    completePendencia(p.id);
    const [event] = getTimeline();
    expect(event.type).toBe("pendencia_concluida");
    expect(event.sourceId).toBe(p.id);
    expect(event.title).toContain("Verificar bomba");
  });

  test("completePendencia não duplica se a pendência já estava concluída", () => {
    const p = addPendencia({ titulo: "Conferir contrato", categoria: "operacional", origem: "manual" });
    completePendencia(p.id);
    completePendencia(p.id);
    const events = getTimeline().filter((e) => e.type === "pendencia_concluida" && e.sourceId === p.id);
    expect(events).toHaveLength(1);
  });

  test("upsertDocumento emite documento renovado quando vencimento muda", () => {
    upsertDocumento(makeDoc("2026-10-01"));
    upsertDocumento(makeDoc("2027-10-01"));
    const events = getTimeline().filter((e) => e.type === "documento_renovado" && e.sourceId === "avcb_clcb");
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0].description).toContain("2027-10-01");
  });

  test("upsertDocumento não emite novo evento ao salvar vencimento idêntico", () => {
    upsertDocumento(makeDoc("2026-10-01"));
    upsertDocumento(makeDoc("2026-10-01"));
    const events = getTimeline().filter((e) => e.type === "documento_renovado" && e.sourceId === "avcb_clcb");
    expect(events).toHaveLength(1);
  });
});

// ── emitReservationApproved ───────────────────────────────────────────────────

describe("emitReservationApproved", () => {
  test("emite evento na timeline com type outro", () => {
    emitReservationApproved("res-001", "Salão de Festas", "302");
    const [event] = getTimeline();
    expect(event.type).toBe("outro");
    expect(event.title).toContain("Salão de Festas");
    expect(event.description).toContain("302");
  });

  test("registra sourceModule reservas e sourceId correto", () => {
    emitReservationApproved("res-xyz", "Churrasqueira", "101");
    const [event] = getTimeline();
    expect(event.sourceModule).toBe("reservas");
    expect(event.sourceId).toBe("res-xyz");
  });

  test("visibility é moradores", () => {
    emitReservationApproved("res-002", "Academia", "201");
    const [event] = getTimeline();
    expect(event.visibility).toBe("moradores");
  });
});

// ── emitReservationCancelled ──────────────────────────────────────────────────

describe("emitReservationCancelled", () => {
  test("emite evento na timeline com type outro", () => {
    emitReservationCancelled("res-003", "Quadra", "501");
    const [event] = getTimeline();
    expect(event.type).toBe("outro");
    expect(event.title).toContain("cancelada");
    expect(event.description).toContain("501");
  });

  test("visibility é gestao", () => {
    emitReservationCancelled("res-004", "Sauna", "302");
    const [event] = getTimeline();
    expect(event.visibility).toBe("gestao");
  });
});
