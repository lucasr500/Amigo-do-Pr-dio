import { describe, expect, test } from "vitest";
import { getDemoUserBackup } from "@/lib/demo-data";

describe("demo-data — primeiros 10 minutos", () => {
  test("usa o schema atual do backup", () => {
    const demo = getDemoUserBackup();
    expect(demo.app).toBe("amigo-do-predio");
    expect(demo.version).toBe("11");
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
});
