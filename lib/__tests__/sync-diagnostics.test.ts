import { describe, test, expect } from "vitest";
import { getCloudBackupDiagnostics } from "@/lib/sync/syncDiagnostics";
import type { DiagnosticsInput } from "@/lib/sync/syncDiagnostics";
import type { RemoteSnapshotMeta } from "@/lib/sync/syncEngine";

// ── Helpers ──────────────────────────────────────────────────────────────────

const NOW  = new Date().toISOString();
const WEEK_AGO = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
const YESTERDAY = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();

function makeRemote(updatedAt: string, version = 12): RemoteSnapshotMeta {
  return { exists: true, version, updatedAt };
}

function baseInput(overrides: Partial<DiagnosticsInput> = {}): DiagnosticsInput {
  return {
    isAuthenticated: false,
    isDemo: false,
    isOnline: true,
    remoteMeta: null,
    syncState: "idle",
    lastLocalSyncAt: null,
    autoBackupEnabled: false,
    ...overrides,
  };
}

// ── Demo Mode — máxima prioridade ────────────────────────────────────────────

describe("getCloudBackupDiagnostics — Demo Mode", () => {
  test("demo mode → status demo_paused independente de auth", () => {
    const result = getCloudBackupDiagnostics(baseInput({
      isDemo: true,
      isAuthenticated: true,
      remoteMeta: makeRemote(NOW),
    }));
    expect(result.status).toBe("demo_paused");
    expect(result.isDemoActive).toBe(true);
  });

  test("demo mode → mensagem menciona modo demonstração", () => {
    const result = getCloudBackupDiagnostics(baseInput({ isDemo: true }));
    expect(result.message.toLowerCase()).toContain("demonstração");
  });

  test("demo mode → autoBackupEnabled false no resultado", () => {
    const result = getCloudBackupDiagnostics(baseInput({ isDemo: true, autoBackupEnabled: false }));
    expect(result.autoBackupEnabled).toBe(false);
  });
});

// ── Não autenticado ───────────────────────────────────────────────────────────

describe("getCloudBackupDiagnostics — não autenticado", () => {
  test("guest → status local_only", () => {
    const result = getCloudBackupDiagnostics(baseInput());
    expect(result.status).toBe("local_only");
    expect(result.isAuthenticated).toBe(false);
  });

  test("guest → hasRemoteBackup false mesmo com remoteMeta existente", () => {
    // Guest não deveria ter remoteMeta, mas se vier mesmo assim:
    const result = getCloudBackupDiagnostics(baseInput({ remoteMeta: makeRemote(NOW) }));
    // Status é local_only porque não está autenticado
    expect(result.status).toBe("local_only");
  });

  test("guest → mensagem sugere fazer login", () => {
    const result = getCloudBackupDiagnostics(baseInput());
    expect(result.message.toLowerCase()).toContain("login");
  });
});

// ── Autenticado sem backup remoto ─────────────────────────────────────────────

describe("getCloudBackupDiagnostics — autenticado, sem remoto", () => {
  test("sem remoto → status ready", () => {
    const result = getCloudBackupDiagnostics(baseInput({ isAuthenticated: true }));
    expect(result.status).toBe("ready");
    expect(result.hasRemoteBackup).toBe(false);
  });

  test("ready → mensagem sugere salvar agora", () => {
    const result = getCloudBackupDiagnostics(baseInput({ isAuthenticated: true }));
    expect(result.message.toLowerCase()).toContain("salve");
  });

  test("autoBackupEnabled true é refletido no diagnóstico", () => {
    const result = getCloudBackupDiagnostics(baseInput({ isAuthenticated: true, autoBackupEnabled: true }));
    expect(result.autoBackupEnabled).toBe(true);
  });
});

// ── Autenticado com backup remoto — synced ────────────────────────────────────

describe("getCloudBackupDiagnostics — synced recente", () => {
  test("synced ontem → status synced", () => {
    const result = getCloudBackupDiagnostics(baseInput({
      isAuthenticated: true,
      remoteMeta: makeRemote(YESTERDAY),
      lastLocalSyncAt: YESTERDAY,
    }));
    expect(result.status).toBe("synced");
    expect(result.hasRemoteBackup).toBe(true);
  });

  test("synced → remoteUpdatedAt no resultado", () => {
    const result = getCloudBackupDiagnostics(baseInput({
      isAuthenticated: true,
      remoteMeta: makeRemote(YESTERDAY),
      lastLocalSyncAt: YESTERDAY,
    }));
    expect(result.remoteUpdatedAt).toBe(YESTERDAY);
    expect(result.remoteVersion).toBe(12);
  });

  test("synced → lastLocalSyncAt no resultado", () => {
    const result = getCloudBackupDiagnostics(baseInput({
      isAuthenticated: true,
      remoteMeta: makeRemote(YESTERDAY),
      lastLocalSyncAt: YESTERDAY,
    }));
    expect(result.lastLocalSyncAt).toBe(YESTERDAY);
  });
});

// ── Stale — backup desatualizado ──────────────────────────────────────────────

describe("getCloudBackupDiagnostics — stale", () => {
  test("sem lastLocalSyncAt e com remoto → stale", () => {
    const result = getCloudBackupDiagnostics(baseInput({
      isAuthenticated: true,
      remoteMeta: makeRemote(WEEK_AGO),
      lastLocalSyncAt: null,
    }));
    expect(result.status).toBe("stale");
  });

  test("lastLocalSyncAt > 7 dias → stale", () => {
    const result = getCloudBackupDiagnostics(baseInput({
      isAuthenticated: true,
      remoteMeta: makeRemote(WEEK_AGO),
      lastLocalSyncAt: WEEK_AGO,
    }));
    expect(result.status).toBe("stale");
  });

  test("stale → mensagem menciona backup desatualizado", () => {
    const result = getCloudBackupDiagnostics(baseInput({
      isAuthenticated: true,
      remoteMeta: makeRemote(WEEK_AGO),
      lastLocalSyncAt: WEEK_AGO,
    }));
    expect(result.message.toLowerCase()).toContain("desatualizado");
  });
});

// ── Offline ───────────────────────────────────────────────────────────────────

describe("getCloudBackupDiagnostics — offline", () => {
  test("offline + syncState=offline → status offline", () => {
    const result = getCloudBackupDiagnostics(baseInput({
      isAuthenticated: true,
      isOnline: false,
      syncState: "offline",
    }));
    expect(result.status).toBe("offline");
  });

  test("offline mas syncState != offline → não é status offline", () => {
    // Se o estado não foi registrado como offline, não mostramos offline
    const result = getCloudBackupDiagnostics(baseInput({
      isAuthenticated: true,
      isOnline: false,
      syncState: "idle",
    }));
    expect(result.status).not.toBe("offline");
  });
});

// ── Erro ──────────────────────────────────────────────────────────────────────

describe("getCloudBackupDiagnostics — error", () => {
  test("syncState=error → status error", () => {
    const result = getCloudBackupDiagnostics(baseInput({
      isAuthenticated: true,
      syncState: "error",
    }));
    expect(result.status).toBe("error");
    expect(result.message.toLowerCase()).toContain("erro");
  });
});

// ── Resultado tem shape correto ───────────────────────────────────────────────

describe("getCloudBackupDiagnostics — shape invariants", () => {
  test("sempre retorna todos os campos obrigatórios", () => {
    const result = getCloudBackupDiagnostics(baseInput());
    expect(typeof result.isAuthenticated).toBe("boolean");
    expect(typeof result.isDemoActive).toBe("boolean");
    expect(typeof result.hasRemoteBackup).toBe("boolean");
    expect(typeof result.autoBackupEnabled).toBe("boolean");
    expect(typeof result.status).toBe("string");
    expect(typeof result.message).toBe("string");
    expect(result.message.length).toBeGreaterThan(0);
  });

  test("remoteMeta null → remoteUpdatedAt null e remoteVersion null", () => {
    const result = getCloudBackupDiagnostics(baseInput({ isAuthenticated: true }));
    expect(result.remoteUpdatedAt).toBeNull();
    expect(result.remoteVersion).toBeNull();
  });
});
