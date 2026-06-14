import { describe, test, expect } from "vitest";
import {
  decideTenantAction,
  tenantSnapshotFromResult,
} from "@/lib/tenant/tenantState";
import type { TenantResult } from "@/lib/tenant/types";

describe("decideTenantAction", () => {
  test("flag desligada → disabled (independe do auth)", () => {
    expect(
      decideTenantAction({ authMode: "authenticated", tenantEnabled: false })
    ).toBe("disabled");
    expect(
      decideTenantAction({ authMode: "guest", tenantEnabled: false })
    ).toBe("disabled");
  });

  test("auth carregando → wait", () => {
    expect(
      decideTenantAction({ authMode: "loading", tenantEnabled: true })
    ).toBe("wait");
  });

  test("autenticado → activate", () => {
    expect(
      decideTenantAction({ authMode: "authenticated", tenantEnabled: true })
    ).toBe("activate");
  });

  test("guest → guest", () => {
    expect(
      decideTenantAction({ authMode: "guest", tenantEnabled: true })
    ).toBe("guest");
  });
});

describe("tenantSnapshotFromResult", () => {
  test("resultado ok → ready com condomínio e papel", () => {
    const result: TenantResult = {
      ok: true,
      context: {
        condominioId: "cond-1",
        condominio: {
          id: "cond-1",
          nome: "Edifício Aurora",
          slug: null,
          ownerId: "user-1",
          archivedAt: null,
        },
        membership: {
          id: "memb-1",
          userId: "user-1",
          condominioId: "cond-1",
          role: "owner",
          status: "active",
        },
        role: "owner",
      },
    };
    const snap = tenantSnapshotFromResult(result);
    expect(snap.status).toBe("ready");
    expect(snap.condominioId).toBe("cond-1");
    expect(snap.role).toBe("owner");
    expect(snap.condominio?.nome).toBe("Edifício Aurora");
    expect(snap.error).toBeNull();
  });

  test("resultado de falha → error sem papel, sem quebrar (local-first)", () => {
    const result: TenantResult = { ok: false, error: "Supabase não configurado." };
    const snap = tenantSnapshotFromResult(result);
    expect(snap.status).toBe("error");
    expect(snap.condominioId).toBeNull();
    expect(snap.role).toBeNull();
    expect(snap.error).toBe("Supabase não configurado.");
  });
});
