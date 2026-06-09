import { describe, test, expect } from "vitest";
import { compareSnapshots, hasSignificantData } from "@/lib/sync/syncConflict";
import type { UserBackup } from "@/lib/session";
import type { RemoteSnapshotMeta } from "@/lib/sync/syncEngine";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeBackup(overrides: Partial<UserBackup> = {}): UserBackup {
  return {
    version: "12",
    app: "amigo-do-predio",
    exportedAt: "2026-06-01T10:00:00Z",
    profile: null,
    memoria: {},
    favorites: [],
    checklists: {},
    ...overrides,
  } as UserBackup;
}

function makeRemote(updatedAt: string, version = 12): RemoteSnapshotMeta {
  return { exists: true, version, updatedAt };
}

const PAST  = "2026-05-01T08:00:00Z"; // mais antigo
const MID   = "2026-06-01T10:00:00Z"; // igual ao backup default
const NOW   = "2026-06-08T12:00:00Z"; // mais recente

// ── compareSnapshots — sem remoto ─────────────────────────────────────────────

describe("compareSnapshots — sem remoto", () => {
  test("remoteMeta null → no_remote", () => {
    const result = compareSnapshots(makeBackup(), null, null);
    expect(result.status).toBe("no_remote");
  });

  test("remoteMeta.exists false → no_remote", () => {
    const result = compareSnapshots(makeBackup(), { exists: false, version: null, updatedAt: null }, null);
    expect(result.status).toBe("no_remote");
  });

  test("remoteMeta undefined → no_remote", () => {
    const result = compareSnapshots(makeBackup(), undefined as unknown as null, null);
    expect(result.status).toBe("no_remote");
  });
});

// ── compareSnapshots — sem histórico de sync local ───────────────────────────

describe("compareSnapshots — sem lastLocalSyncAt", () => {
  test("remoto existe e local vazio → remote_newer", () => {
    const result = compareSnapshots(makeBackup(), makeRemote(NOW), null);
    expect(result.status).toBe("remote_newer");
  });

  test("remoto existe e local tem pendencias → conflict", () => {
    const backup = makeBackup({ pendencias: [{ id: "p1", titulo: "X", status: "pendente", createdAt: MID } as never] });
    const result = compareSnapshots(backup, makeRemote(NOW), null);
    expect(result.status).toBe("conflict");
  });

  test("remoto existe e local tem nomeCondominio → conflict", () => {
    const backup = makeBackup({ profile: { nomeCondominio: "Residencial ABC" } as never });
    const result = compareSnapshots(backup, makeRemote(NOW), null);
    expect(result.status).toBe("conflict");
    if (result.status === "conflict") {
      expect(result.reason).toBeTruthy();
    }
  });

  test("remoto existe e local tem ocorrencias → conflict", () => {
    const backup = makeBackup({ ocorrencias: [{ id: "o1" } as never] });
    const result = compareSnapshots(backup, makeRemote(NOW), null);
    expect(result.status).toBe("conflict");
  });
});

// ── compareSnapshots — com histórico de sync ─────────────────────────────────

describe("compareSnapshots — com lastLocalSyncAt", () => {
  test("remoto atualizado ANTES do último sync → local_newer", () => {
    const result = compareSnapshots(makeBackup(), makeRemote(PAST), NOW);
    expect(result.status).toBe("local_newer");
  });

  test("remoto atualizado IGUAL ao último sync → local_newer (dentro da tolerância)", () => {
    const result = compareSnapshots(makeBackup(), makeRemote(NOW), NOW);
    expect(result.status).toBe("local_newer");
  });

  test("remoto mais novo e local vazio → remote_newer", () => {
    const result = compareSnapshots(makeBackup(), makeRemote(NOW), PAST);
    expect(result.status).toBe("remote_newer");
  });

  test("remoto mais novo e local tem dados → conflict", () => {
    const backup = makeBackup({ agenda: [{ id: "a1" } as never] });
    const result = compareSnapshots(backup, makeRemote(NOW), PAST);
    expect(result.status).toBe("conflict");
    if (result.status === "conflict") {
      expect(result.reason).toContain("outro dispositivo");
    }
  });

  test("remoto mais novo e local tem communityPosts → conflict", () => {
    const backup = makeBackup({ communityPosts: [{ id: "post1" } as never] });
    const result = compareSnapshots(backup, makeRemote(NOW), PAST);
    expect(result.status).toBe("conflict");
  });
});

// ── compareSnapshots — timestamps inválidos ───────────────────────────────────

describe("compareSnapshots — timestamps inválidos", () => {
  test("remoteMeta.updatedAt null e lastLocalSyncAt null e local vazio → remote_newer", () => {
    const result = compareSnapshots(makeBackup(), { exists: true, version: 12, updatedAt: null }, null);
    expect(result.status).toBe("remote_newer");
  });

  test("lastLocalSyncAt string inválida → trata como 0 (timestamp 0)", () => {
    const result = compareSnapshots(makeBackup(), makeRemote(NOW), "invalid-date");
    // remote.updatedAt > lastLocalSyncAt(NaN→0), local vazio → remote_newer
    expect(result.status).toBe("remote_newer");
  });
});

// ── hasSignificantData ────────────────────────────────────────────────────────

describe("hasSignificantData", () => {
  test("backup vazio → false", () => {
    expect(hasSignificantData(makeBackup())).toBe(false);
  });

  test("com nomeCondominio → true", () => {
    expect(hasSignificantData(makeBackup({ profile: { nomeCondominio: "Edifício X" } as never }))).toBe(true);
  });

  test("com pendencias[] não vazio → true", () => {
    expect(hasSignificantData(makeBackup({ pendencias: [{ id: "p1" } as never] }))).toBe(true);
  });

  test("com ocorrencias[] não vazio → true", () => {
    expect(hasSignificantData(makeBackup({ ocorrencias: [{ id: "o1" } as never] }))).toBe(true);
  });

  test("com agenda[] não vazio → true", () => {
    expect(hasSignificantData(makeBackup({ agenda: [{ id: "a1" } as never] }))).toBe(true);
  });

  test("com manutencoes[] não vazio → true", () => {
    expect(hasSignificantData(makeBackup({ manutencoes: [{ id: "m1" } as never] }))).toBe(true);
  });

  test("com communityPosts[] não vazio → true", () => {
    expect(hasSignificantData(makeBackup({ communityPosts: [{ id: "cp1" } as never] }))).toBe(true);
  });

  test("com communityRequests[] não vazio → true", () => {
    expect(hasSignificantData(makeBackup({ communityRequests: [{ id: "cr1" } as never] }))).toBe(true);
  });

  test("arrays vazios → false", () => {
    expect(hasSignificantData(makeBackup({
      pendencias: [],
      ocorrencias: [],
      agenda: [],
      manutencoes: [],
      communityPosts: [],
    }))).toBe(false);
  });
});
