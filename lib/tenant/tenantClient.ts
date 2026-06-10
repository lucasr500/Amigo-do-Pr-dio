// Camada de tenant — identificação do condomínio ativo.
// Persiste activeCondominioId em localStorage para o usuário autenticado.
// Guest/demo nunca têm condomínio remoto.

import type { Condominio, Membership, MembershipRole, TenantResult } from "./types";

const ACTIVE_COND_KEY = "amigo_active_condominio_id";

// ─── Persistência local do condomínio ativo ──────────────────────────────────

export function getActiveCondominioId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_COND_KEY) || null;
  } catch {
    return null;
  }
}

export function setActiveCondominioId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_COND_KEY, id);
  } catch { /* quota — ignora */ }
}

export function clearActiveCondominioId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACTIVE_COND_KEY);
  } catch { /* empty */ }
}

// ─── Tipos locais para queries Supabase (sem depender do SDK genérico) ───────

type DbError = { message: string } | null;

type CondominioRow = {
  id: string;
  nome: string;
  slug: string | null;
  owner_id: string;
  archived_at: string | null;
};

type MembershipRow = {
  id: string;
  user_id: string;
  condominio_id: string;
  role: string;
  status: string;
};

type MembershipsTable = {
  select: (cols: string) => {
    eq: (col: string, val: string) => {
      data: MembershipRow[] | null;
      error: DbError;
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: MembershipRow | null; error: DbError }>;
      };
    };
  };
  insert: (row: {
    user_id: string;
    condominio_id: string;
    role: string;
    status: string;
  }) => {
    select: () => {
      single: () => Promise<{ data: MembershipRow | null; error: DbError }>;
    };
  };
};

type CondominiosTable = {
  select: (cols: string) => {
    in: (col: string, vals: string[]) => Promise<{ data: CondominioRow[] | null; error: DbError }>;
  };
  insert: (row: { owner_id: string; nome: string }) => {
    select: () => {
      single: () => Promise<{ data: CondominioRow | null; error: DbError }>;
    };
  };
};

type SupabaseClient = {
  from: ((table: "memberships") => MembershipsTable) &
        ((table: "condominios") => CondominiosTable);
};

function asClient(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

// ─── Queries ao Supabase ──────────────────────────────────────────────────────

/** Lista todos os condomínios com membership ativa para o usuário autenticado. */
export async function listUserCondominios(userId: string): Promise<Condominio[]> {
  if (!userId || userId === "guest") return [];
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return [];
    const sb = asClient(rawClient);

    // Duas queries em vez de join (Relationships não mapeado nos tipos locais)
    const membResult = await sb.from("memberships")
      .select("condominio_id, status")
      .eq("user_id", userId);

    if (membResult.error || !membResult.data || membResult.data.length === 0) {
      return [];
    }

    // Apenas memberships ativas — suspended/removed/invited não dão acesso
    const ids = membResult.data
      .filter((r) => r.status === "active")
      .map((r) => r.condominio_id);

    if (ids.length === 0) return [];

    const condResult = await sb.from("condominios")
      .select("id, nome, slug, owner_id, archived_at")
      .in("id", ids);

    if (condResult.error || !condResult.data) return [];

    return condResult.data.map((c) => ({
      id: c.id,
      nome: c.nome,
      slug: c.slug ?? null,
      ownerId: c.owner_id,
      archivedAt: c.archived_at ?? null,
    }));
  } catch {
    return [];
  }
}

/** Retorna a membership do usuário no condomínio especificado. */
export async function getMembership(
  userId: string,
  condominioId: string
): Promise<Membership | null> {
  if (!userId || userId === "guest" || !condominioId) return null;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return null;
    const sb = asClient(rawClient);

    const { data, error } = await sb
      .from("memberships")
      .select("id, user_id, condominio_id, role, status")
      .eq("user_id", userId)
      .eq("condominio_id", condominioId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      condominioId: data.condominio_id,
      role: data.role as MembershipRole,
      status: data.status as "active" | "invited" | "suspended" | "removed",
    };
  } catch {
    return null;
  }
}

// ─── Criação do primeiro condomínio ──────────────────────────────────────────

export interface EnsureCondominioOptions {
  userId: string;
  nomeSugerido?: string;
}

/**
 * Garante que o usuário autenticado tem pelo menos um condomínio.
 * Se não tiver, cria um novo com o nome sugerido (ou "Meu Condomínio").
 * Define o activeCondominioId localmente.
 * Idempotente — seguro chamar múltiplas vezes.
 */
export async function ensureDefaultCondominioForUser(
  opts: EnsureCondominioOptions
): Promise<TenantResult> {
  const { userId, nomeSugerido } = opts;

  if (!userId || userId === "guest") {
    return { ok: false, error: "Usuário não autenticado." };
  }

  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return { ok: false, error: "Supabase não configurado." };
    const sb = asClient(rawClient);

    // 1. Checar se já existe condomínio ativo
    const existentes = await listUserCondominios(userId);
    const ativo = existentes.find((c) => !c.archivedAt);

    if (ativo) {
      const activeId = getActiveCondominioId();
      const condId = activeId && existentes.some((c) => c.id === activeId)
        ? activeId
        : ativo.id;
      setActiveCondominioId(condId);

      const membership = await getMembership(userId, condId);
      if (!membership) return { ok: false, error: "Membership não encontrada." };

      return {
        ok: true,
        context: {
          condominioId: condId,
          condominio: existentes.find((c) => c.id === condId)!,
          membership,
          role: membership.role,
        },
      };
    }

    // 2. Criar novo condomínio
    const nome = nomeSugerido?.trim() || "Meu Condomínio";

    const { data: condData, error: condError } = await sb
      .from("condominios")
      .insert({ owner_id: userId, nome })
      .select()
      .single();

    if (condError || !condData) {
      return { ok: false, error: condError?.message ?? "Erro ao criar condomínio." };
    }

    const condominio: Condominio = {
      id: condData.id,
      nome: condData.nome,
      slug: condData.slug ?? null,
      ownerId: condData.owner_id,
      archivedAt: null,
    };

    // 3. Criar membership inicial como owner
    const { data: memberData, error: memberError } = await sb
      .from("memberships")
      .insert({
        user_id: userId,
        condominio_id: condominio.id,
        role: "owner",
        status: "active",
      })
      .select()
      .single();

    if (memberError || !memberData) {
      return { ok: false, error: memberError?.message ?? "Erro ao criar membership." };
    }

    const membership: Membership = {
      id: memberData.id,
      userId: memberData.user_id,
      condominioId: memberData.condominio_id,
      role: "owner",
      status: "active",
    };

    // 4. Persistir activeCondominioId
    setActiveCondominioId(condominio.id);

    return {
      ok: true,
      context: {
        condominioId: condominio.id,
        condominio,
        membership,
        role: "owner",
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Erro desconhecido." };
  }
}
