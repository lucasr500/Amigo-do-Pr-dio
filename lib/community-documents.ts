// ─── Documentos públicos — biblioteca do condomínio ──────────────────────────
import { safeRead, safeWrite } from "./session-core";
import type { PublicDocument, PublicDocumentCategory } from "./community-types";
import { addAuditEntry } from "./community-posts";
import { mirrorUpsertDocument, mirrorDeleteDocument } from "@/lib/tenant/communityDocumentsRemote";

export type { PublicDocument };

const KEY = "amigo_community_documents";

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getPublicDocuments(): PublicDocument[] {
  return safeRead<PublicDocument[]>(KEY, []);
}

export function savePublicDocuments(docs: PublicDocument[]): void {
  safeWrite(KEY, docs);
}

export function addPublicDocument(
  data: Omit<PublicDocument, "id" | "createdAt" | "updatedAt">
): PublicDocument {
  const now = new Date().toISOString();
  const doc: PublicDocument = { ...data, id: uid(), createdAt: now, updatedAt: now };
  savePublicDocuments([doc, ...getPublicDocuments()]);
  addAuditEntry("document_published", "public_document", doc.id, "manager", `Documento publicado: ${doc.title}`);
  void mirrorUpsertDocument(doc); // dual-write PUSH best-effort (no-op se flag off)
  return doc;
}

export function updatePublicDocument(id: string, patch: Partial<PublicDocument>): void {
  savePublicDocuments(
    getPublicDocuments().map((d) =>
      d.id === id ? { ...d, ...patch, updatedAt: new Date().toISOString() } : d
    )
  );
  addAuditEntry("document_updated", "public_document", id, "manager", "Documento atualizado");
  const updated = getPublicDocuments().find((d) => d.id === id);
  if (updated) void mirrorUpsertDocument(updated); // dual-write PUSH best-effort (no-op se flag off)
}

export function removePublicDocument(id: string): void {
  savePublicDocuments(getPublicDocuments().filter((d) => d.id !== id));
  addAuditEntry("document_removed", "public_document", id, "manager", "Documento removido");
  void mirrorDeleteDocument(id); // dual-write PUSH best-effort (no-op se flag off)
}

export function getDocumentsByCategory(category: PublicDocumentCategory): PublicDocument[] {
  return getPublicDocuments()
    .filter((d) => d.category === category)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

// ─── Seed de exemplo ──────────────────────────────────────────────────────────

export function seedDemoDocuments(): void {
  if (getPublicDocuments().length > 0) return;
  const now = new Date().toISOString();

  const demo: PublicDocument[] = [
    {
      id: `demo-doc-${Date.now()}-1`,
      title: "Convenção do Condomínio",
      category: "convencao",
      description: "Documento base que rege o condomínio. Aprovado em assembleia.",
      visibility: "moradores",
      version: "v3 (revisada em 2022)",
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `demo-doc-${Date.now()}-2`,
      title: "Regimento Interno",
      category: "regimento_interno",
      description: "Normas de convivência, uso de áreas comuns e condutas esperadas.",
      visibility: "moradores",
      version: "v2 (revisada em 2023)",
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `demo-doc-${Date.now()}-3`,
      title: "Ata da AGO — Março 2025",
      category: "ata",
      description: "Ata da Assembleia Geral Ordinária com aprovação do orçamento anual.",
      visibility: "moradores",
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: `demo-doc-${Date.now()}-4`,
      title: "Prestação de Contas — 1º Trimestre",
      category: "prestacao_de_contas",
      description: "Resumo financeiro do 1º trimestre com receitas, despesas e saldo.",
      visibility: "conselho",
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    },
  ];
  savePublicDocuments(demo);
}
