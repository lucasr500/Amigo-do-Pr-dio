import { beforeEach, afterEach, describe, expect, test } from "vitest";
import {
  getPosts,
  savePosts,
  addPost,
  updatePost,
  archivePost,
  pinPost,
  deletePost,
  getActivePosts,
  getOfficialPosts,
  getResidentPosts,
  getPublishedPosts,
  getPostsByType,
  addComment,
  getCommentsForPost,
  moderateComment,
  getComments,
} from "@/lib/community-posts";

// ── localStorage stub ─────────────────────────────────────────────────────────

const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  length: 0,
  key: () => null,
};

beforeEach(() => {
  Object.defineProperty(global, "window", { value: { localStorage: localStorageMock }, configurable: true, writable: true });
  Object.defineProperty(global, "localStorage", { value: localStorageMock, configurable: true, writable: true });
  localStorageMock.clear();
});

afterEach(() => localStorageMock.clear());

// ── getPosts / savePosts ──────────────────────────────────────────────────────

describe("getPosts", () => {
  test("retorna array vazio quando não há dados", () => {
    expect(getPosts()).toEqual([]);
  });

  test("retorna posts salvos", () => {
    const now = new Date().toISOString();
    savePosts([{ id: "p1", title: "Aviso", body: "Texto", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false, createdAt: now, updatedAt: now }]);
    expect(getPosts()).toHaveLength(1);
    expect(getPosts()[0].title).toBe("Aviso");
  });
});

// ── addPost ───────────────────────────────────────────────────────────────────

describe("addPost", () => {
  test("adiciona post com origem oficial e retorna objeto criado", () => {
    const p = addPost({ title: "Comunicado", body: "Texto oficial", category: "aviso", origin: "oficial", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    expect(p.id).toBeTruthy();
    expect(p.origin).toBe("oficial");
    expect(p.createdAt).toBeTruthy();
  });

  test("adiciona post com origem morador", () => {
    const p = addPost({ title: "Sugestão", body: "Melhorar iluminação", category: "sugestao", origin: "morador", visibility: "gestao", allowComments: false, pinned: false, archived: false });
    expect(p.origin).toBe("morador");
    expect(p.category).toBe("sugestao");
  });

  test("preserva linkUrl no post criado", () => {
    const p = addPost({ title: "Link", body: "Veja o link", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false, linkUrl: "https://example.com" });
    expect(p.linkUrl).toBe("https://example.com");
    expect(getPosts()[0].linkUrl).toBe("https://example.com");
  });

  test("acumula múltiplos posts", () => {
    addPost({ title: "A", body: "x", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    addPost({ title: "B", body: "y", category: "obra",  visibility: "moradores", allowComments: false, pinned: false, archived: false });
    expect(getPosts()).toHaveLength(2);
  });

  test("gera id único por post", () => {
    const p1 = addPost({ title: "X", body: "1", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    const p2 = addPost({ title: "Y", body: "2", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    expect(p1.id).not.toBe(p2.id);
  });
});

// ── updatePost ────────────────────────────────────────────────────────────────

describe("updatePost", () => {
  test("atualiza campos do post", () => {
    const p = addPost({ title: "Antes", body: "x", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    updatePost(p.id, { title: "Depois" });
    expect(getPosts().find(x => x.id === p.id)?.title).toBe("Depois");
  });

  test("não afeta outros posts", () => {
    const p1 = addPost({ title: "A", body: "x", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    const p2 = addPost({ title: "B", body: "y", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    updatePost(p1.id, { title: "A-editado" });
    expect(getPosts().find(x => x.id === p2.id)?.title).toBe("B");
  });
});

// ── archivePost ───────────────────────────────────────────────────────────────

describe("archivePost", () => {
  test("marca post como arquivado", () => {
    const p = addPost({ title: "T", body: "x", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    archivePost(p.id);
    expect(getPosts().find(x => x.id === p.id)?.archived).toBe(true);
  });

  test("post arquivado não aparece em getActivePosts", () => {
    const p = addPost({ title: "T", body: "x", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    archivePost(p.id);
    expect(getActivePosts().find(x => x.id === p.id)).toBeUndefined();
  });
});

// ── pinPost ───────────────────────────────────────────────────────────────────

describe("pinPost", () => {
  test("fixa e desafixa post", () => {
    const p = addPost({ title: "T", body: "x", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    pinPost(p.id, true);
    expect(getPosts().find(x => x.id === p.id)?.pinned).toBe(true);
    pinPost(p.id, false);
    expect(getPosts().find(x => x.id === p.id)?.pinned).toBe(false);
  });
});

// ── deletePost ────────────────────────────────────────────────────────────────

describe("deletePost", () => {
  test("remove o post do array", () => {
    const p = addPost({ title: "T", body: "x", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    deletePost(p.id);
    expect(getPosts().find(x => x.id === p.id)).toBeUndefined();
  });

  test("cascateia e remove comentários do post deletado", () => {
    const p = addPost({ title: "T", body: "x", category: "aviso", visibility: "moradores", allowComments: true, pinned: false, archived: false });
    addComment(p.id, "Morador", "Comentário", true);
    deletePost(p.id);
    expect(getComments().filter(c => c.postId === p.id)).toHaveLength(0);
  });
});

// ── getActivePosts ────────────────────────────────────────────────────────────

describe("getActivePosts", () => {
  test("exclui posts arquivados", () => {
    const p = addPost({ title: "T", body: "x", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    archivePost(p.id);
    expect(getActivePosts()).toHaveLength(0);
  });

  test("posts fixados aparecem primeiro", () => {
    addPost({ title: "Normal", body: "x", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    const pinned = addPost({ title: "Fixado", body: "y", category: "aviso", visibility: "moradores", allowComments: false, pinned: true, archived: false });
    const result = getActivePosts();
    expect(result[0].id).toBe(pinned.id);
  });
});

// ── getOfficialPosts ──────────────────────────────────────────────────────────

describe("getOfficialPosts", () => {
  test("retorna posts com origin oficial ou sem origin", () => {
    addPost({ title: "Oficial", body: "x", category: "aviso", origin: "oficial", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    addPost({ title: "Legado", body: "y", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    expect(getOfficialPosts()).toHaveLength(2);
  });

  test("exclui posts de moradores", () => {
    addPost({ title: "Oficial", body: "x", category: "aviso", origin: "oficial", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    addPost({ title: "Morador", body: "y", category: "sugestao", origin: "morador", visibility: "gestao", allowComments: false, pinned: false, archived: false });
    const official = getOfficialPosts();
    expect(official.every(p => p.origin !== "morador")).toBe(true);
  });

  test("exclui posts arquivados", () => {
    const p = addPost({ title: "T", body: "x", category: "aviso", origin: "oficial", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    archivePost(p.id);
    expect(getOfficialPosts()).toHaveLength(0);
  });
});

// ── getResidentPosts ──────────────────────────────────────────────────────────

describe("getResidentPosts", () => {
  test("retorna apenas posts com origin morador", () => {
    addPost({ title: "Oficial", body: "x", category: "aviso", origin: "oficial", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    addPost({ title: "Sugestão", body: "y", category: "sugestao", origin: "morador", visibility: "gestao", allowComments: false, pinned: false, archived: false });
    const resident = getResidentPosts();
    expect(resident).toHaveLength(1);
    expect(resident[0].title).toBe("Sugestão");
  });

  test("exclui posts arquivados de moradores", () => {
    const p = addPost({ title: "S", body: "y", category: "sugestao", origin: "morador", visibility: "gestao", allowComments: false, pinned: false, archived: false });
    archivePost(p.id);
    expect(getResidentPosts()).toHaveLength(0);
  });
});

// ── getPublishedPosts ─────────────────────────────────────────────────────────

describe("getPublishedPosts", () => {
  test("retorna todos os não-arquivados independente de origem", () => {
    addPost({ title: "Oficial", body: "x", category: "aviso", origin: "oficial", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    addPost({ title: "Morador", body: "y", category: "sugestao", origin: "morador", visibility: "gestao", allowComments: false, pinned: false, archived: false });
    expect(getPublishedPosts()).toHaveLength(2);
  });
});

// ── getPostsByType ────────────────────────────────────────────────────────────

describe("getPostsByType", () => {
  test("filtra posts pela categoria informada", () => {
    addPost({ title: "Obra A", body: "x", category: "obra", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    addPost({ title: "Aviso B", body: "y", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    expect(getPostsByType("obra")).toHaveLength(1);
    expect(getPostsByType("obra")[0].title).toBe("Obra A");
  });

  test("retorna vazio para categoria sem posts", () => {
    addPost({ title: "T", body: "x", category: "aviso", visibility: "moradores", allowComments: false, pinned: false, archived: false });
    expect(getPostsByType("urgencia")).toHaveLength(0);
  });
});

// ── addComment / getCommentsForPost ───────────────────────────────────────────

describe("addComment", () => {
  test("adiciona comentário e persiste", () => {
    const p = addPost({ title: "T", body: "x", category: "aviso", visibility: "moradores", allowComments: true, pinned: false, archived: false });
    const c = addComment(p.id, "João", "Ótimo comunicado", true);
    expect(c.postId).toBe(p.id);
    expect(c.status).toBe("publicado");
    expect(getCommentsForPost(p.id)).toHaveLength(1);
  });

  test("comentário sem auto-aprovação fica como pendente", () => {
    const p = addPost({ title: "T", body: "x", category: "aviso", visibility: "moradores", allowComments: true, pinned: false, archived: false });
    const c = addComment(p.id, "Morador", "Comentário", false);
    expect(c.status).toBe("pendente");
  });

  test("getCommentsForPost filtra pelo postId correto", () => {
    const p1 = addPost({ title: "A", body: "x", category: "aviso", visibility: "moradores", allowComments: true, pinned: false, archived: false });
    const p2 = addPost({ title: "B", body: "y", category: "aviso", visibility: "moradores", allowComments: true, pinned: false, archived: false });
    addComment(p1.id, "X", "comentário no post 1", true);
    addComment(p2.id, "Y", "comentário no post 2", true);
    expect(getCommentsForPost(p1.id)).toHaveLength(1);
    expect(getCommentsForPost(p2.id)).toHaveLength(1);
  });
});

// ── moderateComment ───────────────────────────────────────────────────────────

describe("moderateComment", () => {
  test("muda status para oculto", () => {
    const p = addPost({ title: "T", body: "x", category: "aviso", visibility: "moradores", allowComments: true, pinned: false, archived: false });
    const c = addComment(p.id, "Z", "Comentário", true);
    moderateComment(c.id, "oculto");
    expect(getCommentsForPost(p.id)[0].status).toBe("oculto");
  });

  test("muda status para removido", () => {
    const p = addPost({ title: "T", body: "x", category: "aviso", visibility: "moradores", allowComments: true, pinned: false, archived: false });
    const c = addComment(p.id, "Z", "Texto", true);
    moderateComment(c.id, "removido");
    expect(getCommentsForPost(p.id)[0].status).toBe("removido");
  });
});
