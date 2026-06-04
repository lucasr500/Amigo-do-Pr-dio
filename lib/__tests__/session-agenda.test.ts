import { describe, test, expect } from "vitest";
import { getNextOccurrenceDate, normalizeAgendaEvent } from "@/lib/session";

// ─── getNextOccurrenceDate — edge cases de meses curtos ──────────────────────
// Estes testes protegem a correção do bug de overflow de data (31/jan + mensal
// apontava para 3/mar com setMonth, agora usa clampToMonth).

describe("getNextOccurrenceDate — meses curtos (regressão de bug)", () => {
  test("31/jan + mensal → 28/fev (não 03/mar)", () => {
    expect(getNextOccurrenceDate("2026-01-31", "mensal")).toBe("2026-02-28");
  });

  test("31/jan + trimestral → 30/abr", () => {
    expect(getNextOccurrenceDate("2026-01-31", "trimestral")).toBe("2026-04-30");
  });

  test("31/ago + mensal → 30/set", () => {
    expect(getNextOccurrenceDate("2026-08-31", "mensal")).toBe("2026-09-30");
  });

  test("29/fev/2024 + anual → 28/fev/2025 (ano não-bissexto)", () => {
    expect(getNextOccurrenceDate("2024-02-29", "anual")).toBe("2025-02-28");
  });

  test("31/mar + mensal → 30/abr", () => {
    expect(getNextOccurrenceDate("2026-03-31", "mensal")).toBe("2026-04-30");
  });

  test("31/out + mensal → 30/nov", () => {
    expect(getNextOccurrenceDate("2026-10-31", "mensal")).toBe("2026-11-30");
  });

  test("30/nov + trimestral → 28/fev/2027 (fev não-bissexto)", () => {
    expect(getNextOccurrenceDate("2026-11-30", "trimestral")).toBe("2027-02-28");
  });

  test("31/jan + semestral → 31/jul (julho tem 31 dias)", () => {
    expect(getNextOccurrenceDate("2026-01-31", "semestral")).toBe("2026-07-31");
  });
});

// ─── getNextOccurrenceDate — casos normais ────────────────────────────────────

describe("getNextOccurrenceDate — casos normais", () => {
  test("semanal adiciona exatamente 7 dias", () => {
    expect(getNextOccurrenceDate("2026-06-01", "semanal")).toBe("2026-06-08");
  });

  test("semanal cruza mês corretamente", () => {
    expect(getNextOccurrenceDate("2026-06-28", "semanal")).toBe("2026-07-05");
  });

  test("mensal em data que existe no próximo mês → preserva o dia", () => {
    expect(getNextOccurrenceDate("2026-06-15", "mensal")).toBe("2026-07-15");
  });

  test("mensal cruzando ano: dez → jan", () => {
    expect(getNextOccurrenceDate("2026-12-01", "mensal")).toBe("2027-01-01");
  });

  test("trimestral normal: jan → abr", () => {
    expect(getNextOccurrenceDate("2026-01-01", "trimestral")).toBe("2026-04-01");
  });

  test("semestral: jan → jul", () => {
    expect(getNextOccurrenceDate("2026-01-01", "semestral")).toBe("2026-07-01");
  });

  test("anual preserva dia e mês", () => {
    expect(getNextOccurrenceDate("2026-06-04", "anual")).toBe("2027-06-04");
  });

  test("anual cruzando bissexto para não-bissexto: 2024 → 2025 em dia normal", () => {
    expect(getNextOccurrenceDate("2024-06-15", "anual")).toBe("2025-06-15");
  });

  test("recorrência 'nenhuma' retorna a própria data sem alteração", () => {
    expect(getNextOccurrenceDate("2026-06-01", "nenhuma")).toBe("2026-06-01");
  });
});

// ─── normalizeAgendaEvent ─────────────────────────────────────────────────────

describe("normalizeAgendaEvent", () => {
  test("objeto vazio recebe todos os defaults seguros", () => {
    const ev = normalizeAgendaEvent({});
    expect(ev.id).toBeTruthy();
    expect(ev.title).toBe("Evento sem título");
    expect(ev.type).toBe("outro");
    expect(ev.recurrence).toBe("nenhuma");
    expect(ev.prioridade).toBe("media");
    expect(ev.createdAt).toBeTruthy();
  });

  test("título vazio → 'Evento sem título'", () => {
    const ev = normalizeAgendaEvent({ title: "" });
    expect(ev.title).toBe("Evento sem título");
  });

  test("recorrência inválida → 'nenhuma'", () => {
    const ev = normalizeAgendaEvent({ recurrence: "quinzenal" as never });
    expect(ev.recurrence).toBe("nenhuma");
  });

  test("recorrência válida 'mensal' é preservada", () => {
    const ev = normalizeAgendaEvent({ recurrence: "mensal" });
    expect(ev.recurrence).toBe("mensal");
  });

  test("data válida é preservada", () => {
    const ev = normalizeAgendaEvent({ date: "2026-07-15" });
    expect(ev.date).toBe("2026-07-15");
  });

  test("data inválida recebe algum valor de fallback sem lançar exceção", () => {
    expect(() => normalizeAgendaEvent({ date: "data-invalida" })).not.toThrow();
    const ev = normalizeAgendaEvent({ date: "data-invalida" });
    expect(ev.date).toBeTruthy();
  });

  test("linkedPendenciaId é preservado", () => {
    const ev = normalizeAgendaEvent({ linkedPendenciaId: "pend-abc-123" });
    expect(ev.linkedPendenciaId).toBe("pend-abc-123");
  });

  test("prioridade 'critica' é preservada", () => {
    const ev = normalizeAgendaEvent({ prioridade: "critica" });
    expect(ev.prioridade).toBe("critica");
  });

  test("source 'template' é preservado", () => {
    const ev = normalizeAgendaEvent({ source: "template" });
    expect(ev.source).toBe("template");
  });

  test("id fornecido externamente é preservado", () => {
    const ev = normalizeAgendaEvent({ id: "meu-id-fixo" });
    expect(ev.id).toBe("meu-id-fixo");
  });
});
