import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { pullRemotePosts } from "@/lib/tenant/communityPostsSync";
import { addPost, getPosts } from "@/lib/community-posts";
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
afterEach(() => { resetFlag("mural_remote_enabled"); localStorageMock.clear(); });

const data = { title: "t", body: "b", category: "aviso" as const, visibility: "moradores" as const, allowComments: false, pinned: false, archived: false };

describe("pullRemotePosts — cutover de leitura gated (009)", () => {
  test("flag OFF (default) → NO-OP total: store local intocado", async () => {
    addPost({ ...data, title: "Local 1" });
    const antes = getPosts();
    const r = await pullRemotePosts();
    expect(r.merged).toBe(false);
    expect(getPosts()).toHaveLength(antes.length); // nada mudou
    expect(getPosts()[0].title).toBe("Local 1");
  });

  test("flag ON mas sem condomínio ativo → ainda NO-OP (gating em camadas)", async () => {
    setFlag("mural_remote_enabled", true);
    addPost({ ...data, title: "Local 2" });
    const r = await pullRemotePosts(); // sem getActiveCondominioId → listRemote retorna []
    expect(r.merged).toBe(false);
    expect(getPosts()[0].title).toBe("Local 2");
  });
});
