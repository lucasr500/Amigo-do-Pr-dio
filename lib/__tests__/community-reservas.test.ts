import { beforeEach, afterEach, describe, expect, test } from "vitest";
import {
  getReservations,
  saveReservations,
  addReservation,
  updateReservation,
  cancelReservation,
  deleteReservation,
  getReservationsByDate,
  getReservationsBySpace,
  getPendingReservations,
  getApprovedReservations,
  getReservationSummary,
} from "@/lib/community-reservas";

// ── localStorage stub ─────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  length: 0,
  key: () => null,
};

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
});

afterEach(() => localStorageMock.clear());

// ── getReservations ───────────────────────────────────────────────────────────

describe("getReservations", () => {
  test("retorna array vazio quando não há dados", () => {
    expect(getReservations()).toEqual([]);
  });

  test("retorna reservas salvas", () => {
    const reservas = [
      { id: "r1", unit: "201", requesterName: "João", space: "Salão de Festas", date: "2026-06-20", status: "aprovada" as const, createdAt: "2026-06-08T10:00:00Z", updatedAt: "2026-06-08T10:00:00Z" },
    ];
    localStorageMock.setItem("amigo_community_reservations", JSON.stringify(reservas));
    expect(getReservations()).toHaveLength(1);
    expect(getReservations()[0].unit).toBe("201");
  });
});

// ── saveReservations ──────────────────────────────────────────────────────────

describe("saveReservations", () => {
  test("persiste array no localStorage", () => {
    const reservas = [
      { id: "r1", unit: "101", requesterName: "Maria", space: "Churrasqueira", date: "2026-06-15", status: "solicitada" as const, createdAt: "2026-06-08T10:00:00Z", updatedAt: "2026-06-08T10:00:00Z" },
    ];
    saveReservations(reservas);
    expect(getReservations()).toHaveLength(1);
  });

  test("sobrescreve dados anteriores", () => {
    saveReservations([{ id: "r1", unit: "101", requesterName: "A", space: "Salão", date: "2026-06-10", status: "solicitada" as const, createdAt: "2026-06-08T10:00:00Z", updatedAt: "2026-06-08T10:00:00Z" }]);
    saveReservations([]);
    expect(getReservations()).toEqual([]);
  });
});

// ── addReservation ────────────────────────────────────────────────────────────

describe("addReservation", () => {
  test("adiciona reserva e retorna o objeto criado", () => {
    const r = addReservation({
      unit: "302",
      requesterName: "Carlos",
      space: "Salão de Festas",
      date: "2026-06-25",
      status: "solicitada",
    });
    expect(r.id).toBeTruthy();
    expect(r.unit).toBe("302");
    expect(r.createdAt).toBeTruthy();
    expect(r.updatedAt).toBeTruthy();
  });

  test("persiste no localStorage", () => {
    addReservation({ unit: "401", requesterName: "Ana", space: "Academia", date: "2026-07-01", status: "solicitada" });
    expect(getReservations()).toHaveLength(1);
  });

  test("acumula múltiplas reservas", () => {
    addReservation({ unit: "101", requesterName: "A", space: "Salão", date: "2026-06-10", status: "solicitada" });
    addReservation({ unit: "102", requesterName: "B", space: "Churrasqueira", date: "2026-06-11", status: "solicitada" });
    expect(getReservations()).toHaveLength(2);
  });

  test("gera id único por reserva", () => {
    const r1 = addReservation({ unit: "201", requesterName: "X", space: "Salão", date: "2026-06-10", status: "solicitada" });
    const r2 = addReservation({ unit: "202", requesterName: "Y", space: "Salão", date: "2026-06-11", status: "solicitada" });
    expect(r1.id).not.toBe(r2.id);
  });
});

// ── updateReservation ─────────────────────────────────────────────────────────

describe("updateReservation", () => {
  test("atualiza campos da reserva", () => {
    const r = addReservation({ unit: "301", requesterName: "Pedro", space: "Churrasqueira", date: "2026-06-20", status: "solicitada" });
    updateReservation(r.id, { status: "aprovada", approvedBy: "Síndico" });
    const updated = getReservations().find(x => x.id === r.id);
    expect(updated?.status).toBe("aprovada");
    expect(updated?.approvedBy).toBe("Síndico");
  });

  test("persiste campo notes ao modificar", () => {
    const r = addReservation({ unit: "401", requesterName: "Lu", space: "Salão", date: "2026-06-22", status: "solicitada" });
    updateReservation(r.id, { notes: "Confirmado" });
    const updated = getReservations().find(x => x.id === r.id);
    expect(updated?.notes).toBe("Confirmado");
    expect(updated?.updatedAt).toBeTruthy();
  });

  test("não afeta outras reservas", () => {
    const r1 = addReservation({ unit: "101", requesterName: "A", space: "Salão", date: "2026-06-10", status: "solicitada" });
    const r2 = addReservation({ unit: "102", requesterName: "B", space: "Churrasqueira", date: "2026-06-11", status: "solicitada" });
    updateReservation(r1.id, { status: "aprovada" });
    const r2After = getReservations().find(x => x.id === r2.id);
    expect(r2After?.status).toBe("solicitada");
  });
});

// ── cancelReservation ─────────────────────────────────────────────────────────

describe("cancelReservation", () => {
  test("muda status para cancelada", () => {
    const r = addReservation({ unit: "201", requesterName: "A", space: "Salão", date: "2026-06-15", status: "aprovada" });
    cancelReservation(r.id);
    const updated = getReservations().find(x => x.id === r.id);
    expect(updated?.status).toBe("cancelada");
  });
});

// ── deleteReservation ─────────────────────────────────────────────────────────

describe("deleteReservation", () => {
  test("remove a reserva do array", () => {
    const r = addReservation({ unit: "501", requesterName: "Z", space: "Academia", date: "2026-06-28", status: "solicitada" });
    deleteReservation(r.id);
    expect(getReservations().find(x => x.id === r.id)).toBeUndefined();
  });

  test("mantém outras reservas ao deletar uma", () => {
    const r1 = addReservation({ unit: "101", requesterName: "A", space: "Salão", date: "2026-06-10", status: "solicitada" });
    const r2 = addReservation({ unit: "102", requesterName: "B", space: "Churrasqueira", date: "2026-06-11", status: "solicitada" });
    deleteReservation(r1.id);
    expect(getReservations()).toHaveLength(1);
    expect(getReservations()[0].id).toBe(r2.id);
  });
});

// ── getReservationsByDate ─────────────────────────────────────────────────────

describe("getReservationsByDate", () => {
  beforeEach(() => {
    addReservation({ unit: "101", requesterName: "A", space: "Salão", date: "2026-06-20", status: "solicitada" });
    addReservation({ unit: "201", requesterName: "B", space: "Churrasqueira", date: "2026-06-20", status: "aprovada" });
    addReservation({ unit: "301", requesterName: "C", space: "Salão", date: "2026-06-25", status: "solicitada" });
  });

  test("retorna reservas da data informada", () => {
    expect(getReservationsByDate("2026-06-20")).toHaveLength(2);
  });

  test("retorna vazio para data sem reservas", () => {
    expect(getReservationsByDate("2026-07-01")).toHaveLength(0);
  });
});

// ── getReservationsBySpace ────────────────────────────────────────────────────

describe("getReservationsBySpace", () => {
  beforeEach(() => {
    addReservation({ unit: "101", requesterName: "A", space: "Salão de Festas", date: "2026-06-20", status: "solicitada" });
    addReservation({ unit: "201", requesterName: "B", space: "Churrasqueira", date: "2026-06-21", status: "aprovada" });
    addReservation({ unit: "301", requesterName: "C", space: "Salão de Festas", date: "2026-06-25", status: "solicitada" });
  });

  test("retorna reservas do espaço informado", () => {
    expect(getReservationsBySpace("Salão de Festas")).toHaveLength(2);
  });

  test("retorna vazio para espaço inexistente", () => {
    expect(getReservationsBySpace("Academia")).toHaveLength(0);
  });
});

// ── getPendingReservations ────────────────────────────────────────────────────

describe("getPendingReservations", () => {
  beforeEach(() => {
    addReservation({ unit: "101", requesterName: "A", space: "Salão", date: "2026-06-25", status: "solicitada" });
    addReservation({ unit: "201", requesterName: "B", space: "Churrasqueira", date: "2026-06-20", status: "aprovada" });
    addReservation({ unit: "301", requesterName: "C", space: "Academia", date: "2026-06-22", status: "solicitada" });
    addReservation({ unit: "401", requesterName: "D", space: "Salão", date: "2026-06-18", status: "cancelada" });
  });

  test("retorna apenas reservas solicitadas", () => {
    const pending = getPendingReservations();
    expect(pending).toHaveLength(2);
    expect(pending.every((r) => r.status === "solicitada")).toBe(true);
  });

  test("ordena por data crescente", () => {
    const pending = getPendingReservations();
    expect(pending[0].date).toBe("2026-06-22");
    expect(pending[1].date).toBe("2026-06-25");
  });
});

// ── getApprovedReservations ───────────────────────────────────────────────────

describe("getApprovedReservations", () => {
  beforeEach(() => {
    addReservation({ unit: "101", requesterName: "A", space: "Salão", date: "2026-07-01", status: "aprovada" });
    addReservation({ unit: "201", requesterName: "B", space: "Churrasqueira", date: "2026-06-20", status: "aprovada" });
    addReservation({ unit: "301", requesterName: "C", space: "Academia", date: "2026-06-22", status: "solicitada" });
  });

  test("retorna apenas reservas aprovadas", () => {
    const approved = getApprovedReservations();
    expect(approved).toHaveLength(2);
    expect(approved.every((r) => r.status === "aprovada")).toBe(true);
  });

  test("ordena por data crescente", () => {
    const approved = getApprovedReservations();
    expect(approved[0].date).toBe("2026-06-20");
    expect(approved[1].date).toBe("2026-07-01");
  });
});

// ── getReservationSummary ─────────────────────────────────────────────────────

describe("getReservationSummary", () => {
  test("retorna zeros quando não há reservas", () => {
    const s = getReservationSummary();
    expect(s.total).toBe(0);
    expect(s.pending).toBe(0);
    expect(s.approved).toBe(0);
    expect(s.upcoming).toBe(0);
  });

  test("conta corretamente total, pendentes e aprovadas", () => {
    addReservation({ unit: "101", requesterName: "A", space: "Salão", date: "2026-06-20", status: "solicitada" });
    addReservation({ unit: "201", requesterName: "B", space: "Churrasqueira", date: "2099-06-30", status: "aprovada" });
    addReservation({ unit: "301", requesterName: "C", space: "Academia", date: "2024-01-01", status: "cancelada" });
    const s = getReservationSummary();
    expect(s.total).toBe(3);
    expect(s.pending).toBe(1);
    expect(s.approved).toBe(1);
  });

  test("upcoming conta apenas aprovadas com data futura", () => {
    addReservation({ unit: "101", requesterName: "A", space: "Salão", date: "2099-06-30", status: "aprovada" });
    addReservation({ unit: "201", requesterName: "B", space: "Churrasqueira", date: "2020-01-01", status: "aprovada" });
    const s = getReservationSummary();
    expect(s.upcoming).toBe(1);
  });
});
