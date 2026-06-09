import { describe, expect, test } from "vitest";
import { getDemoUserBackup } from "@/lib/demo-data";

// Helpers para verificar offsets relativos
function daysBetween(isoA: string, isoB: string): number {
  return Math.round(
    (new Date(`${isoB}T12:00:00`).getTime() - new Date(`${isoA}T12:00:00`).getTime()) /
      (1000 * 60 * 60 * 24),
  );
}
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

describe("demo-data — primeiros 10 minutos", () => {
  test("usa o schema atual do backup", () => {
    const demo = getDemoUserBackup();
    expect(demo.app).toBe("amigo-do-predio");
    expect(demo.version).toBe("12");
  });

  test("alimenta a Home preparada do morador", () => {
    const demo = getDemoUserBackup();
    expect(demo.communityPosts?.some((post) => post.visibility === "moradores" && post.pinned)).toBe(true);
    expect(demo.communityRequests?.length).toBeGreaterThanOrEqual(2);
    expect(demo.communityPolls?.some((poll) => poll.status === "ativa")).toBe(true);
  });

  test("inclui documentos públicos e timeline institucional para demo", () => {
    const demo = getDemoUserBackup();
    expect(demo.communityDocuments?.some((doc) => doc.visibility === "moradores")).toBe(true);
    expect(demo.communityTimeline?.some((event) => event.visibility === "moradores")).toBe(true);
  });

  test("inclui snapshots financeiros para demonstrar cockpit recorrente", () => {
    const demo = getDemoUserBackup();
    expect(demo.financialSnapshots?.length).toBeGreaterThanOrEqual(2);
    expect(demo.financialSnapshots?.some((snapshot) => snapshot.delinquencyRate !== undefined)).toBe(true);
    expect(demo.financialSnapshots?.some((snapshot) => snapshot.liquidityReserve !== undefined)).toBe(true);
  });

  test("conta uma narrativa mínima de condomínio em 3 minutos", () => {
    const demo = getDemoUserBackup();

    expect(demo.profile?.nomeCondominio).toBeTruthy();
    expect(demo.profile?.numUnidades).toBeGreaterThanOrEqual(20);
    expect(demo.memoria?.vencimentoAVCB).toBeTruthy();
    expect(demo.pendencias?.length).toBeGreaterThanOrEqual(3);
    expect(demo.pendencias?.some((p) => p.prioridade === "alta")).toBe(true);
    expect(demo.documentos?.length).toBeGreaterThanOrEqual(3);
    expect(demo.communityDocuments?.length).toBeGreaterThanOrEqual(3);
    expect(demo.suppliers?.length).toBeGreaterThanOrEqual(3);
    expect(demo.decisions?.length).toBeGreaterThanOrEqual(3);
    expect(demo.unitEvents?.length).toBeGreaterThanOrEqual(1);
    expect(demo.communityPosts?.filter((post) => post.visibility === "moradores").length).toBeGreaterThanOrEqual(2);
    expect(demo.communityPosts?.some((post) => post.pinned && post.visibility === "moradores")).toBe(true);
    expect(demo.communityRequests?.some((req) => req.type === "aviso_obra")).toBe(true);
    expect(demo.communityRequests?.some((req) => req.type === "sugestao")).toBe(true);
    expect(demo.communityRequests?.some((req) => req.managementResponse)).toBe(true);
    expect(demo.communityReservations?.some((res) => res.status === "aprovada")).toBe(true);
    expect(demo.communityReservations?.some((res) => res.status === "solicitada")).toBe(true);
    expect(demo.communityPolls?.some((poll) => poll.status === "ativa")).toBe(true);
    expect(demo.communityTimeline?.length).toBeGreaterThanOrEqual(4);
    expect(demo.monthlyReviewHistory?.length).toBeGreaterThanOrEqual(2);
    expect(demo.handoffState?.successorName).toBeTruthy();
    expect(demo.financialSnapshots?.some((snapshot) => (snapshot.delinquencyRate ?? 0) > 0)).toBe(true);
  });
});

describe("demo-data — datas dinâmicas (relativas a hoje)", () => {
  test("vencimentoAVCB está ~5 dias à frente de hoje", () => {
    const { memoria } = getDemoUserBackup();
    expect(memoria?.vencimentoAVCB).toBeDefined();
    const diff = daysBetween(todayIso(), memoria!.vencimentoAVCB!);
    expect(diff).toBeGreaterThanOrEqual(4);
    expect(diff).toBeLessThanOrEqual(6);
  });

  test("vencimentoSeguro está ~80 dias à frente de hoje", () => {
    const { memoria } = getDemoUserBackup();
    expect(memoria?.vencimentoSeguro).toBeDefined();
    const diff = daysBetween(todayIso(), memoria!.vencimentoSeguro!);
    expect(diff).toBeGreaterThanOrEqual(79);
    expect(diff).toBeLessThanOrEqual(81);
  });

  test("fimMandatoSindico está ~35 dias à frente de hoje", () => {
    const { memoria } = getDemoUserBackup();
    expect(memoria?.fimMandatoSindico).toBeDefined();
    const diff = daysBetween(todayIso(), memoria!.fimMandatoSindico!);
    expect(diff).toBeGreaterThanOrEqual(34);
    expect(diff).toBeLessThanOrEqual(36);
  });

  test("ultimaAGO está ~450 dias no passado", () => {
    const { memoria } = getDemoUserBackup();
    expect(memoria?.ultimaAGO).toBeDefined();
    const diff = daysBetween(memoria!.ultimaAGO!, todayIso());
    expect(diff).toBeGreaterThanOrEqual(449);
    expect(diff).toBeLessThanOrEqual(451);
  });

  test("ultimaLimpezaCaixaDAgua está ~265 dias no passado (vencida)", () => {
    const { memoria } = getDemoUserBackup();
    expect(memoria?.ultimaLimpezaCaixaDAgua).toBeDefined();
    const diff = daysBetween(memoria!.ultimaLimpezaCaixaDAgua!, todayIso());
    expect(diff).toBeGreaterThanOrEqual(264);
    expect(diff).toBeLessThanOrEqual(266);
  });

  test("snapshots financeiros usam mês atual e anterior (sem ano fixo)", () => {
    const { financialSnapshots } = getDemoUserBackup();
    expect(financialSnapshots?.length).toBeGreaterThanOrEqual(2);
    const currentYear = new Date().getFullYear();
    const allYearsValid = financialSnapshots!.every((s) => {
      const year = parseInt(s.month.slice(0, 4), 10);
      return year === currentYear || year === currentYear - 1;
    });
    expect(allYearsValid).toBe(true);
  });

  test("pendências da demo têm datas de criação no passado recente", () => {
    const { pendencias } = getDemoUserBackup();
    expect(pendencias?.length).toBeGreaterThanOrEqual(3);
    pendencias!.forEach((p) => {
      const created = p.createdAt.slice(0, 10);
      const diff = daysBetween(created, todayIso());
      expect(diff).toBeGreaterThanOrEqual(0);
      expect(diff).toBeLessThanOrEqual(60);
    });
  });

  test("evento AGO na agenda está ~42 dias à frente", () => {
    const { agenda } = getDemoUserBackup();
    const ago = agenda?.find((e) => e.id === "demo-a1");
    expect(ago).toBeDefined();
    const diff = daysBetween(todayIso(), ago!.date);
    expect(diff).toBeGreaterThanOrEqual(41);
    expect(diff).toBeLessThanOrEqual(43);
  });
});

describe("demo-data — memória institucional e handoff", () => {
  test("demo inclui handoffState com itens", () => {
    const { handoffState } = getDemoUserBackup();
    expect(handoffState).toBeDefined();
    expect(handoffState!.items.length).toBeGreaterThan(0);
  });

  test("handoff demo tem sucessor e data futura", () => {
    const { handoffState } = getDemoUserBackup();
    expect(handoffState!.successorName).toBeTruthy();
    expect(handoffState!.handoffDate).toBeDefined();
    const diff = daysBetween(todayIso(), handoffState!.handoffDate!);
    expect(diff).toBeGreaterThan(0);
  });

  test("handoff demo tem mix de itens ok e pendentes", () => {
    const { handoffState } = getDemoUserBackup();
    const okItems = handoffState!.items.filter((i) => i.status === "ok");
    const pendingItems = handoffState!.items.filter((i) => i.status === "pendente");
    expect(okItems.length).toBeGreaterThan(0);
    expect(pendingItems.length).toBeGreaterThan(0);
  });

  test("demo inclui monthlyReviewHistory com 2 meses", () => {
    const { monthlyReviewHistory } = getDemoUserBackup();
    expect(monthlyReviewHistory).toBeDefined();
    expect(monthlyReviewHistory!.length).toBeGreaterThanOrEqual(2);
  });

  test("monthlyReviewHistory demo tem scores entre 0-100", () => {
    const { monthlyReviewHistory } = getDemoUserBackup();
    monthlyReviewHistory!.forEach((r) => {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.status).toBe("concluida");
    });
  });

  test("demo inclui decisions, suppliers e unitEvents", () => {
    const { decisions, suppliers, unitEvents } = getDemoUserBackup();
    expect(decisions?.length).toBeGreaterThan(0);
    expect(suppliers?.length).toBeGreaterThan(0);
    expect(unitEvents?.length).toBeGreaterThan(0);
  });

  test("handoff demo não está completed (passagem em andamento)", () => {
    const { handoffState } = getDemoUserBackup();
    expect(handoffState!.completed).toBe(false);
  });

  test("handoff items têm id, categoria, titulo, descricao, status preenchidos", () => {
    const { handoffState } = getDemoUserBackup();
    handoffState!.items.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.categoria).toBeTruthy();
      expect(item.titulo).toBeTruthy();
      expect(item.descricao).toBeTruthy();
      expect(["ok", "pendente", "em_andamento", "nao_aplicavel"]).toContain(item.status);
    });
  });

  test("handoff demo inclui pelo menos uma categoria documentos e uma financeiro", () => {
    const { handoffState } = getDemoUserBackup();
    const cats = handoffState!.items.map((i) => i.categoria);
    expect(cats).toContain("documentos");
    expect(cats.some((c) => c === "financeiro" || c === "operacao")).toBe(true);
  });

  test("monthlyReviewHistory meses estão no passado", () => {
    const { monthlyReviewHistory } = getDemoUserBackup();
    const thisMonth = new Date().toISOString().slice(0, 7);
    monthlyReviewHistory!.forEach((r) => {
      expect(r.month < thisMonth).toBe(true);
    });
  });

  test("monthlyReviewHistory topItems têm id, title e severity", () => {
    const { monthlyReviewHistory } = getDemoUserBackup();
    const allTopItems = monthlyReviewHistory!.flatMap((r) => r.topItems ?? []);
    expect(allTopItems.length).toBeGreaterThan(0);
    allTopItems.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(["critical", "warning", "info"]).toContain(item.severity);
    });
  });

  test("handoffState.initiatedAt está no passado recente", () => {
    const { handoffState } = getDemoUserBackup();
    expect(handoffState?.iniciatedAt).toBeTruthy();
    const diff = daysBetween(handoffState!.iniciatedAt!.slice(0, 10), todayIso());
    expect(diff).toBeGreaterThan(0);
    expect(diff).toBeLessThan(60);
  });
});
