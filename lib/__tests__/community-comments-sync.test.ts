import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { pullRemoteComments } from "@/lib/tenant/communityCommentsSync";
import { addComment, getComments } from "@/lib/community-posts";
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
afterEach(() => { resetFlag("comments_remote_enabled"); localStorageMock.clear(); });

describe("pullRemoteComments — cutover de leitura gated (014)", () => {
  test("flag OFF (default) → NO-OP total: store local intocado", async () => {
    addComment("post-1", "Morador", "comentário local");
    const antes = getComments();
    const r = await pullRemoteComments();
    expect(r.merged).toBe(false);
    expect(getComments()).toHaveLength(antes.length);
    expect(getComments()[0].body).toBe("comentário local");
  });

  test("flag ON mas sem condomínio ativo → ainda NO-OP", async () => {
    setFlag("comments_remote_enabled", true);
    addComment("post-1", "Morador", "outro");
    const r = await pullRemoteComments();
    expect(r.merged).toBe(false);
    expect(getComments()[0].body).toBe("outro");
  });
});
