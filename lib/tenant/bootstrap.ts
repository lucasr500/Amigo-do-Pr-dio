// Orquestrador do tenant bootstrap — o elo entre auth e a fundação multi-tenant.
// Chamado pelo AuthContext quando há sessão válida. Centraliza as guardas
// (guest, demo, userId vazio) e o dedupe de chamadas em voo.
//
// Dedupe: getSession() e o evento INITIAL_SESSION do onAuthStateChange podem
// disparar juntos, e o Strict Mode em dev monta efeitos duas vezes. Sem o
// dedupe, ensureDefaultCondominioForUser rodaria em paralelo e as duas
// execuções poderiam ver "nenhum condomínio" e criar dois.
// LIMITAÇÃO CONHECIDA: o dedupe é por aba/processo. Primeiro login simultâneo
// em dois dispositivos ainda pode criar dois condomínios (risco aceito nesta
// sprint — resolver com fluxo de onboarding/constraint em sprint futura).

import { ensureDefaultCondominioForUser } from "./tenantClient";

export type TenantStatus = "idle" | "loading" | "ready" | "error";

export interface TenantState {
  status: TenantStatus;
  condominioId: string | null;
  condominioNome: string | null;
  /** Mensagem amigável para UI — nunca contém detalhes técnicos do Supabase. */
  errorMessage: string | null;
}

export const TENANT_IDLE: TenantState = {
  status: "idle",
  condominioId: null,
  condominioNome: null,
  errorMessage: null,
};

export const TENANT_LOADING: TenantState = {
  status: "loading",
  condominioId: null,
  condominioNome: null,
  errorMessage: null,
};

const TENANT_ERROR_MESSAGE =
  "Não foi possível carregar o condomínio agora. Seus dados locais continuam disponíveis.";

export interface TenantBootstrapDeps {
  /** Detecção de demo mode — injetável para teste. */
  isDemoActive: () => boolean;
  /** Criação/garantia do condomínio padrão — injetável para teste. */
  ensureCondominio: typeof ensureDefaultCondominioForUser;
}

function defaultDeps(): Promise<TenantBootstrapDeps> {
  return import("@/lib/demo").then(({ isDemoActive }) => ({
    isDemoActive,
    ensureCondominio: ensureDefaultCondominioForUser,
  }));
}

// Promises em voo por userId — compartilhadas entre chamadas concorrentes.
const inflight = new Map<string, Promise<TenantState>>();

/** Limpa o dedupe — usado em signOut e em testes. */
export function resetTenantBootstrap(): void {
  inflight.clear();
}

/**
 * Garante o condomínio padrão do usuário autenticado e retorna o estado
 * resultante. Nunca lança: falhas viram status "error" com mensagem amigável.
 * Guest, demo e userId vazio retornam "idle" sem tocar no Supabase.
 */
export async function runTenantBootstrap(
  userId: string,
  deps?: TenantBootstrapDeps
): Promise<TenantState> {
  if (!userId || userId === "guest") return TENANT_IDLE;

  const existing = inflight.get(userId);
  if (existing) return existing;

  const run = (async (): Promise<TenantState> => {
    try {
      const resolved = deps ?? (await defaultDeps());

      // Demo mode nunca cria dados remotos, mesmo com sessão válida.
      if (resolved.isDemoActive()) return TENANT_IDLE;

      const result = await resolved.ensureCondominio({ userId });
      if (!result.ok) {
        return {
          status: "error",
          condominioId: null,
          condominioNome: null,
          errorMessage: TENANT_ERROR_MESSAGE,
        };
      }

      return {
        status: "ready",
        condominioId: result.context.condominioId,
        condominioNome: result.context.condominio.nome,
        errorMessage: null,
      };
    } catch {
      return {
        status: "error",
        condominioId: null,
        condominioNome: null,
        errorMessage: TENANT_ERROR_MESSAGE,
      };
    }
  })();

  inflight.set(userId, run);
  try {
    return await run;
  } finally {
    // Mantém o resultado em cache de voo apenas enquanto a promise roda em
    // concorrência; depois remove para que um retry futuro (ex.: após falha
    // de rede) possa executar de novo. A idempotência real é do servidor.
    inflight.delete(userId);
  }
}

// ─── Texto de status para UI ──────────────────────────────────────────────────
// Mapeamento puro estado → rótulo. Mantido aqui (sem React) para ser testável
// no ambiente node do Vitest.

export interface TenantStatusLabel {
  /** Texto curto exibido no Header. null = não exibir nada além do padrão atual. */
  text: string | null;
  tone: "neutral" | "positive" | "muted" | "warning";
}

export function tenantStatusLabel(
  state: TenantState,
  opts: { isAuthenticated: boolean; isDemo: boolean }
): TenantStatusLabel {
  // Guest e demo nunca exibem estado de conta conectada.
  if (!opts.isAuthenticated || opts.isDemo) {
    return { text: null, tone: "muted" };
  }
  switch (state.status) {
    case "loading":
      return { text: "Preparando seu condomínio…", tone: "neutral" };
    case "ready":
      return {
        text: state.condominioNome
          ? `Conta conectada · ${state.condominioNome}`
          : "Conta conectada",
        tone: "positive",
      };
    case "error":
      return {
        text: state.errorMessage ?? TENANT_ERROR_MESSAGE,
        tone: "warning",
      };
    case "idle":
    default:
      return { text: null, tone: "muted" };
  }
}
