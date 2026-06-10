import { describe, test, expect } from "vitest";
import {
  canManage,
  hasElevatedAccess,
  canAccessFeature,
  resolveEffectiveRole,
} from "@/lib/tenant/effectiveRole";
import type { MembershipRole } from "@/lib/tenant/types";

describe("canManage", () => {
  test("owner e manager têm gestão", () => {
    expect(canManage("owner")).toBe(true);
    expect(canManage("manager")).toBe(true);
  });

  test("council, resident, viewer não têm gestão", () => {
    expect(canManage("council")).toBe(false);
    expect(canManage("resident")).toBe(false);
    expect(canManage("viewer")).toBe(false);
  });

  test("null e undefined retornam false", () => {
    expect(canManage(null)).toBe(false);
    expect(canManage(undefined)).toBe(false);
  });
});

describe("hasElevatedAccess", () => {
  test("owner, manager, council têm acesso elevado", () => {
    expect(hasElevatedAccess("owner")).toBe(true);
    expect(hasElevatedAccess("manager")).toBe(true);
    expect(hasElevatedAccess("council")).toBe(true);
  });

  test("resident e viewer não têm acesso elevado", () => {
    expect(hasElevatedAccess("resident")).toBe(false);
    expect(hasElevatedAccess("viewer")).toBe(false);
  });

  test("null retorna false", () => {
    expect(hasElevatedAccess(null)).toBe(false);
  });
});

describe("canAccessFeature", () => {
  test("owner acessa todas as features de gestão", () => {
    expect(canAccessFeature("owner", "manage_members")).toBe(true);
    expect(canAccessFeature("owner", "manage_financial")).toBe(true);
    expect(canAccessFeature("owner", "manage_settings")).toBe(true);
    expect(canAccessFeature("owner", "invite_members")).toBe(true);
  });

  test("manager acessa features de gestão", () => {
    expect(canAccessFeature("manager", "manage_documents")).toBe(true);
    expect(canAccessFeature("manager", "invite_members")).toBe(true);
  });

  test("council pode gerenciar documentos e agenda, não financeiro", () => {
    expect(canAccessFeature("council", "manage_documents")).toBe(true);
    expect(canAccessFeature("council", "manage_agenda")).toBe(true);
    expect(canAccessFeature("council", "manage_financial")).toBe(false);
    expect(canAccessFeature("council", "manage_members")).toBe(false);
  });

  test("resident pode ver relatórios apenas", () => {
    expect(canAccessFeature("resident", "view_reports")).toBe(true);
    expect(canAccessFeature("resident", "manage_documents")).toBe(false);
    expect(canAccessFeature("resident", "manage_financial")).toBe(false);
  });

  test("viewer tem apenas read_only", () => {
    expect(canAccessFeature("viewer", "read_only")).toBe(true);
    expect(canAccessFeature("viewer", "view_reports")).toBe(false);
    expect(canAccessFeature("viewer", "manage_members")).toBe(false);
  });

  test("null role retorna false para qualquer feature", () => {
    expect(canAccessFeature(null, "manage_members")).toBe(false);
    expect(canAccessFeature(undefined, "view_reports")).toBe(false);
  });
});

describe("resolveEffectiveRole", () => {
  test("retorna role para membership ativa", () => {
    const membership = { role: "owner" as MembershipRole, status: "active" };
    expect(resolveEffectiveRole(membership)).toBe("owner");
  });

  test("retorna null para membership não ativa", () => {
    expect(resolveEffectiveRole({ role: "owner", status: "suspended" })).toBeNull();
    expect(resolveEffectiveRole({ role: "manager", status: "invited" })).toBeNull();
    expect(resolveEffectiveRole({ role: "council", status: "removed" })).toBeNull();
  });

  test("retorna null para null/undefined", () => {
    expect(resolveEffectiveRole(null)).toBeNull();
    expect(resolveEffectiveRole(undefined)).toBeNull();
  });

  test("roles corretos são preservados", () => {
    const roles: MembershipRole[] = ["owner", "manager", "council", "resident", "viewer"];
    for (const role of roles) {
      expect(resolveEffectiveRole({ role, status: "active" })).toBe(role);
    }
  });
});
