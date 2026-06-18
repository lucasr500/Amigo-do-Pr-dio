// Camada remota das Enquetes — dual-write PUSH (011, gated-off). DUAS sub-entidades:
// community_polls (a enquete) e poll_votes (os votos). Best-effort: NUNCA lança, NUNCA
// bloqueia a UI. Gating em toda função: sem window, flag off ou sem condomínio → no-op.
// Com `polls_remote_enabled` desligado (default), zero rede.
//
// PRIVACIDADE: a RLS de poll_votes garante que só o próprio voto (voted_by = auth.uid())
// ou a gestão sejam lidos. O push NÃO envia voted_by (DEFAULT auth.uid() preenche).

import { isEnabled } from "@/lib/feature-flags";
import { getActiveCondominioId } from "@/lib/tenant/tenantClient";
import type { Poll, PollVote, PollOption, Visibility, PollStatus } from "@/lib/community-types"; // type-only

type DbError = { message: string } | null;

// ─── Linhas / upserts ─────────────────────────────────────────────────────────

type PollRow = {
  id: string; condominio_id: string;
  title: string | null; description: string | null;
  options: PollOption[] | null;
  visibility: string | null; status: string | null;
  starts_at: string | null; ends_at: string | null;
  created_at?: string | null; updated_at?: string | null;
};
type PollUpsert = Omit<PollRow, "created_at" | "updated_at">;

type VoteRow = {
  id: string; poll_id: string; condominio_id: string;
  voted_by?: string | null;
  option_id: string | null; voter_label: string | null;
  created_at?: string | null;
};
type VoteUpsert = Omit<VoteRow, "voted_by" | "created_at">;

type PollsTable = {
  upsert: (row: PollUpsert, opts: { onConflict: string }) => Promise<{ error: DbError }>;
  delete: () => { eq: (c: string, v: string) => { eq: (c: string, v: string) => Promise<{ error: DbError }> } };
  select: (cols: string) => { eq: (c: string, v: string) => Promise<{ data: PollRow[] | null; error: DbError }> };
};
type VotesTable = {
  upsert: (row: VoteUpsert, opts: { onConflict: string }) => Promise<{ error: DbError }>;
  delete: () => { eq: (c: string, v: string) => { eq: (c: string, v: string) => Promise<{ error: DbError }> } };
  select: (cols: string) => { eq: (c: string, v: string) => Promise<{ data: VoteRow[] | null; error: DbError }> };
};

type SupabaseClient = {
  from: ((t: "community_polls") => PollsTable) & ((t: "poll_votes") => VotesTable);
};

function asClient(client: unknown): SupabaseClient {
  return client as SupabaseClient;
}

// ─── Mapeamento ───────────────────────────────────────────────────────────────

function toPollRow(p: Poll, condominioId: string): PollUpsert {
  return {
    id: p.id, condominio_id: condominioId,
    title: p.title ?? "", description: p.description ?? null,
    options: p.options ?? [],
    visibility: p.visibility ?? "moradores", status: p.status ?? "rascunho",
    starts_at: p.startsAt ?? null, ends_at: p.endsAt ?? null,
  };
}
function fromPollRow(r: PollRow): Poll {
  return {
    id: r.id, title: r.title ?? "", description: r.description ?? "",
    options: (r.options ?? []) as PollOption[],
    visibility: (r.visibility ?? "moradores") as Visibility,
    status: (r.status ?? "rascunho") as PollStatus,
    startsAt: r.starts_at ?? undefined, endsAt: r.ends_at ?? undefined,
    createdAt: r.created_at ?? "", updatedAt: r.updated_at ?? "",
  };
}
function toVoteRow(v: PollVote, condominioId: string): VoteUpsert {
  return {
    id: v.id, poll_id: v.pollId, condominio_id: condominioId,
    option_id: v.optionId ?? "", voter_label: v.voterLabel ?? null,
  };
}
function fromVoteRow(r: VoteRow): PollVote {
  return {
    id: r.id, pollId: r.poll_id, optionId: r.option_id ?? "",
    voterLabel: r.voter_label ?? undefined, createdAt: r.created_at ?? "",
  };
}

// ─── community_polls (best-effort) ────────────────────────────────────────────

export async function mirrorUpsertPoll(poll: Poll): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("polls_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    await asClient(rawClient).from("community_polls").upsert(toPollRow(poll, condId), { onConflict: "id" });
  } catch { /* best-effort */ }
}

export async function mirrorDeletePoll(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("polls_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    // ON DELETE CASCADE em poll_votes remove os votos remotos junto.
    await asClient(rawClient).from("community_polls").delete().eq("condominio_id", condId).eq("id", id);
  } catch { /* best-effort */ }
}

export async function listRemotePolls(condominioId?: string): Promise<Poll[]> {
  if (typeof window === "undefined") return [];
  if (!isEnabled("polls_remote_enabled")) return [];
  const condId = condominioId || getActiveCondominioId();
  if (!condId) return [];
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return [];
    const { data, error } = await asClient(rawClient).from("community_polls").select("*").eq("condominio_id", condId);
    if (error || !data) return [];
    return data.map(fromPollRow);
  } catch { return []; }
}

// ─── poll_votes (best-effort) ─────────────────────────────────────────────────

export async function mirrorUpsertVote(vote: PollVote): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("polls_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    await asClient(rawClient).from("poll_votes").upsert(toVoteRow(vote, condId), { onConflict: "id" });
  } catch { /* best-effort */ }
}

export async function mirrorDeleteVote(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isEnabled("polls_remote_enabled")) return;
  const condId = getActiveCondominioId();
  if (!condId) return;
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return;
    await asClient(rawClient).from("poll_votes").delete().eq("condominio_id", condId).eq("id", id);
  } catch { /* best-effort */ }
}

export async function listRemoteVotes(condominioId?: string): Promise<PollVote[]> {
  if (typeof window === "undefined") return [];
  if (!isEnabled("polls_remote_enabled")) return [];
  const condId = condominioId || getActiveCondominioId();
  if (!condId) return [];
  try {
    const { getSupabaseClient } = await import("@/lib/supabase/client");
    const rawClient = await getSupabaseClient();
    if (!rawClient) return [];
    const { data, error } = await asClient(rawClient).from("poll_votes").select("*").eq("condominio_id", condId);
    if (error || !data) return [];
    return data.map(fromVoteRow);
  } catch { return []; }
}
