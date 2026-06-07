// ─── Relatório da Central para conselho e moradores ───────────────────────────
import type { CommunityRole } from "./community-types";
import { getActivePosts } from "./community-posts";
import { getRequests, getRequestSummary } from "./community-requests";
import { getPolls, getVotes } from "./community-polls";
import { getPublicDocuments } from "./community-documents";
import { getTimeline } from "./community-timeline";
import { filterByVisibility } from "./community-permissions";

function today(): string {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function header(text: string): string {
  return `\n${"═".repeat(55)}\n${text}\n${"═".repeat(55)}\n`;
}

// ─── Relatório para moradores ─────────────────────────────────────────────────

function buildResidentReport(condoName: string): string {
  const lines: string[] = [
    `INFORMATIVO DO CONDOMÍNIO`,
    condoName.toUpperCase(),
    `Emitido em ${today()}`,
    "",
  ];

  // Posts recentes visíveis
  const posts = filterByVisibility(getActivePosts().slice(0, 5), "resident");
  if (posts.length > 0) {
    lines.push(header("AVISOS OFICIAIS"));
    posts.forEach((p) => {
      lines.push(`📌 ${p.title}`);
      lines.push(`   ${p.body.slice(0, 200)}${p.body.length > 200 ? "..." : ""}`);
      lines.push(`   (${new Date(p.createdAt).toLocaleDateString("pt-BR")})`);
      lines.push("");
    });
  }

  // Solicitações resolvidas
  const resolved = getRequests().filter((r) => r.status === "resolvido").slice(0, 3);
  if (resolved.length > 0) {
    lines.push(header("SOLICITAÇÕES ATENDIDAS"));
    resolved.forEach((r) => {
      lines.push(`✓ ${r.title} — ${new Date(r.updatedAt).toLocaleDateString("pt-BR")}`);
      if (r.resolutionNote) lines.push(`  Resposta: ${r.resolutionNote}`);
    });
    lines.push("");
  }

  // Documentos disponíveis
  const docs = filterByVisibility(getPublicDocuments(), "resident");
  if (docs.length > 0) {
    lines.push(header("DOCUMENTOS DISPONÍVEIS"));
    docs.forEach((d) => lines.push(`• ${d.title}${d.version ? ` (${d.version})` : ""}`));
    lines.push("");
  }

  // Enquetes ativas
  const polls = filterByVisibility(getPolls().filter((p) => p.status === "ativa"), "resident");
  if (polls.length > 0) {
    lines.push(header("ENQUETES CONSULTIVAS ABERTAS"));
    polls.forEach((p) => {
      lines.push(`📊 ${p.title}`);
      if (p.endsAt) lines.push(`   Encerra em: ${new Date(p.endsAt).toLocaleDateString("pt-BR")}`);
    });
    lines.push("");
    lines.push("⚠ Enquetes têm caráter consultivo e não substituem assembleia formal.");
    lines.push("");
  }

  lines.push("─".repeat(55));
  lines.push("Gerado pelo Amigo do Prédio. Para dúvidas, entre em contato com a gestão.");
  return lines.join("\n");
}

// ─── Relatório para conselho ──────────────────────────────────────────────────

function buildCouncilReport(condoName: string): string {
  const lines: string[] = [
    `RELATÓRIO DE GESTÃO — CONSELHO`,
    condoName.toUpperCase(),
    `Emitido em ${today()}`,
    "",
  ];

  // Resumo de solicitações
  const summary = getRequestSummary();
  lines.push(header("SOLICITAÇÕES — VISÃO GERAL"));
  lines.push(`Total de solicitações: ${summary.total}`);
  lines.push(`Em aberto: ${summary.open}`);
  lines.push(`Resolvidas: ${summary.resolved}`);
  if (summary.urgent > 0) lines.push(`⚠ Urgentes em aberto: ${summary.urgent}`);
  lines.push("");

  // Avisos recentes (visão conselho)
  const posts = filterByVisibility(getActivePosts().slice(0, 8), "council");
  if (posts.length > 0) {
    lines.push(header("PUBLICAÇÕES RECENTES"));
    posts.forEach((p) => {
      lines.push(`• [${p.category}] ${p.title} — ${new Date(p.createdAt).toLocaleDateString("pt-BR")}`);
    });
    lines.push("");
  }

  // Documentos (visão conselho)
  const docs = filterByVisibility(getPublicDocuments(), "council");
  if (docs.length > 0) {
    lines.push(header("BIBLIOTECA DE DOCUMENTOS"));
    docs.forEach((d) => {
      const validity = d.validUntil ? ` — válido até ${new Date(d.validUntil).toLocaleDateString("pt-BR")}` : "";
      lines.push(`• [${d.category}] ${d.title}${validity}`);
    });
    lines.push("");
  }

  // Timeline (visão conselho)
  const timeline = filterByVisibility(getTimeline(), "council").slice(0, 15);
  if (timeline.length > 0) {
    lines.push(header("TIMELINE INSTITUCIONAL (últimos eventos)"));
    timeline.forEach((e) => {
      lines.push(`• ${new Date(e.occurredAt).toLocaleDateString("pt-BR")} — ${e.title}`);
    });
    lines.push("");
  }

  // Enquetes e resultados
  const closedPolls = getPolls().filter((p) => p.status === "encerrada").slice(0, 3);
  if (closedPolls.length > 0) {
    lines.push(header("ENQUETES ENCERRADAS"));
    closedPolls.forEach((p) => {
      const votes = getVotes().filter((v) => v.pollId === p.id).length;
      lines.push(`• ${p.title} — ${votes} resposta${votes !== 1 ? "s" : ""}`);
    });
    lines.push("⚠ Enquetes têm caráter consultivo e não substituem assembleia formal.");
    lines.push("");
  }

  lines.push("─".repeat(55));
  lines.push("Relatório gerado pelo Amigo do Prédio.");
  lines.push("Os dados financeiros detalhados constam no relatório da administradora.");
  return lines.join("\n");
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function buildCommunityReport(role: CommunityRole, condoName: string): string {
  if (role === "manager" || role === "council") return buildCouncilReport(condoName);
  return buildResidentReport(condoName);
}
