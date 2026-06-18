import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { pullRemoteDocuments } from "@/lib/tenant/communityDocumentsSync";
import { addPublicDocument, getPublicDocuments } from "@/lib/community-documents";
import { setFlag, resetFlag } from "@/lib/feature-flags";

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
afterEach(() => { resetFlag("documents_remote_enabled"); localStorageMock.clear(); });

const data = { title: "t", category: "ata" as const, visibility: "moradores" as const, publishedAt: "2026-06-01T00:00:00.000Z" };

describe("pullRemoteDocuments — cutover de leitura gated (012)", () => {
  test("flag OFF (default) → NO-OP total: store local intocado", async () => {
    addPublicDocument({ ...data, title: "Local 1" });
    const antes = getPublicDocuments();
    const r = await pullRemoteDocuments();
    expect(r.merged).toBe(false);
    expect(getPublicDocuments()).toHaveLength(antes.length);
    expect(getPublicDocuments()[0].title).toBe("Local 1");
  });

  test("flag ON mas sem condomínio ativo → ainda NO-OP", async () => {
    setFlag("documents_remote_enabled", true);
    addPublicDocument({ ...data, title: "Local 2" });
    const r = await pullRemoteDocuments();
    expect(r.merged).toBe(false);
    expect(getPublicDocuments()[0].title).toBe("Local 2");
  });
});
