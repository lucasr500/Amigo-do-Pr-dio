// ─── Enquetes consultivas — CRUD + votos ──────────────────────────────────────
import { safeRead, safeWrite } from "./session-core";
import type { Poll, PollVote } from "./community-types";
import { addAuditEntry } from "./community-posts";

export type { Poll, PollVote };

const KEY_POLLS = "amigo_community_polls";
const KEY_VOTES = "amigo_community_poll_votes";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Polls ────────────────────────────────────────────────────────────────────

export function getPolls(): Poll[] {
  return safeRead<Poll[]>(KEY_POLLS, []);
}

export function savePolls(polls: Poll[]): void {
  safeWrite(KEY_POLLS, polls);
}

export function addPoll(
  data: Omit<Poll, "id" | "createdAt" | "updatedAt">
): Poll {
  const now = new Date().toISOString();
  const poll: Poll = { ...data, id: uid(), createdAt: now, updatedAt: now };
  savePolls([poll, ...getPolls()]);
  addAuditEntry("poll_created", "poll", poll.id, "manager", `Enquete criada: ${poll.title}`);
  return poll;
}

export function updatePoll(id: string, patch: Partial<Poll>): void {
  savePolls(
    getPolls().map((p) =>
      p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
    )
  );
}

export function closePoll(id: string): void {
  updatePoll(id, { status: "encerrada" });
  addAuditEntry("poll_closed", "poll", id, "manager", "Enquete encerrada");
}

export function deletePoll(id: string): void {
  savePolls(getPolls().filter((p) => p.id !== id));
  saveVotes(getVotes().filter((v) => v.pollId !== id));
}

export function getActivePolls(): Poll[] {
  return getPolls()
    .filter((p) => p.status === "ativa")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ─── Votos ────────────────────────────────────────────────────────────────────

export function getVotes(): PollVote[] {
  return safeRead<PollVote[]>(KEY_VOTES, []);
}

export function saveVotes(votes: PollVote[]): void {
  safeWrite(KEY_VOTES, votes);
}

export function vote(pollId: string, optionId: string, voterLabel?: string): PollVote | null {
  const poll = getPolls().find((p) => p.id === pollId);
  if (!poll || poll.status !== "ativa") return null;
  // allow re-vote: remove previous vote from same label
  const existing = getVotes().filter((v) => !(v.pollId === pollId && v.voterLabel === voterLabel));
  const newVote: PollVote = {
    id: uid(), pollId, optionId,
    voterLabel: voterLabel || "Anônimo",
    createdAt: new Date().toISOString(),
  };
  saveVotes([...existing, newVote]);
  return newVote;
}

export function getPollResults(pollId: string): { optionId: string; label: string; count: number; pct: number }[] {
  const poll = getPolls().find((p) => p.id === pollId);
  if (!poll) return [];
  const votes = getVotes().filter((v) => v.pollId === pollId);
  const total = votes.length;
  return poll.options.map((opt) => {
    const count = votes.filter((v) => v.optionId === opt.id).length;
    return { optionId: opt.id, label: opt.label, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
  });
}

export function buildPollReport(poll: Poll): string {
  const results = getPollResults(poll.id);
  const total = results.reduce((s, r) => s + r.count, 0);
  const lines = [
    `RESULTADO DA ENQUETE CONSULTIVA`,
    `"${poll.title}"`,
    poll.description ? poll.description : "",
    ``,
    `Total de respostas: ${total}`,
    ``,
    ...results.map((r) => `  ${r.label}: ${r.count} voto${r.count !== 1 ? "s" : ""} (${r.pct}%)`),
    ``,
    `⚠ Esta enquete possui caráter consultivo e não substitui assembleia, deliberação formal ou quórum previsto em lei, convenção ou regimento interno.`,
    ``,
    `Gerado pelo Amigo do Prédio — ${new Date().toLocaleDateString("pt-BR")}`,
  ].filter(Boolean);
  return lines.join("\n");
}

export const POLL_DISCLAIMER =
  "Esta enquete possui caráter consultivo e não substitui assembleia, deliberação formal ou quórum previsto em lei, convenção ou regimento interno.";

// ─── Seed de exemplo ──────────────────────────────────────────────────────────

export function seedDemoPolls(): void {
  if (getPolls().length > 0) return;
  const now = new Date().toISOString();
  const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const demo: Poll = {
    id: `poll-${Date.now()}-1`,
    title: "Qual o melhor horário para manutenção das áreas comuns?",
    description: "Estamos planejando a manutenção bimestral. Sua opinião ajuda a minimizar o impacto no cotidiano.",
    options: [
      { id: "opt-1", label: "Sábado de manhã (8h–12h)" },
      { id: "opt-2", label: "Domingo de manhã (8h–12h)" },
      { id: "opt-3", label: "Sábado à tarde (14h–18h)" },
      { id: "opt-4", label: "Qualquer dia, tanto faz" },
    ],
    visibility: "moradores",
    status: "ativa",
    endsAt: future,
    createdAt: now,
    updatedAt: now,
  };

  savePolls([demo]);
  // seed some votes
  saveVotes([
    { id: `v1-${Date.now()}`, pollId: demo.id, optionId: "opt-1", voterLabel: "101", createdAt: now },
    { id: `v2-${Date.now()}`, pollId: demo.id, optionId: "opt-1", voterLabel: "201", createdAt: now },
    { id: `v3-${Date.now()}`, pollId: demo.id, optionId: "opt-2", voterLabel: "301", createdAt: now },
    { id: `v4-${Date.now()}`, pollId: demo.id, optionId: "opt-4", voterLabel: "102", createdAt: now },
  ]);
}
