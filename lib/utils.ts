// ─── Knowledge base utilities ─────────────────────────────────────────────────
// Funções de validação e normalização para facilitar a inserção de novas entradas.
// Uso: desenvolvimento / scripts de manutenção — não é importado em runtime pelo app.

import type { KnowledgeEntry } from "./data";

export type ValidationError = {
  field: string;
  message: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: ValidationError[];
};

// Normaliza uma keyword individual: lowercase, sem acento, sem caracteres especiais.
function normalizeKw(kw: string): string {
  return kw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// Retorna a entry com todas as keywords no formato esperado pelo matcher.
// Use antes de inserir uma entrada nova para garantir consistência automática.
export function normalizeKeywords(entry: KnowledgeEntry): KnowledgeEntry {
  return {
    ...entry,
    keywords: entry.keywords.map(normalizeKw).filter((k) => k.length > 0),
  };
}

// Valida uma entrada candidata antes de inserção na base.
// Retorna lista de erros — vazia significa entrada válida.
export function validateKnowledgeEntry(
  candidate: Record<string, unknown>,
  existing: KnowledgeEntry[]
): ValidationResult {
  const errors: ValidationError[] = [];

  // Campos obrigatórios do tipo string não-vazia
  const requiredStrings = ["id", "categoria", "pergunta", "resposta", "contexto"] as const;
  for (const field of requiredStrings) {
    const val = candidate[field];
    if (!val || typeof val !== "string" || !val.trim()) {
      errors.push({
        field,
        message: `"${field}" é obrigatório e deve ser uma string não-vazia`,
      });
    }
  }

  // keywords: deve ser array de strings normalizadas (sem acentos, sem espaços)
  if (!Array.isArray(candidate.keywords)) {
    errors.push({
      field: "keywords",
      message: '"keywords" deve ser um array de strings',
    });
  } else {
    (candidate.keywords as unknown[]).forEach((kw, i) => {
      if (typeof kw !== "string") {
        errors.push({
          field: `keywords[${i}]`,
          message: `Índice ${i} deve ser string, recebeu ${typeof kw}`,
        });
        return;
      }
      if (kw.includes(" ")) {
        errors.push({
          field: `keywords[${i}]`,
          message: `"${kw}" contém espaço — separe em keywords individuais`,
        });
      }
      const normalized = normalizeKw(kw);
      if (normalized !== kw) {
        errors.push({
          field: `keywords[${i}]`,
          message: `"${kw}" não está normalizada — forma correta: "${normalized}"`,
        });
      }
    });
  }

  // ID deve ser único
  const id = typeof candidate.id === "string" ? candidate.id : null;
  if (id && existing.some((e) => e.id === id)) {
    errors.push({
      field: "id",
      message: `ID "${id}" já existe na base`,
    });
  }

  // Pergunta não pode ser duplicata (comparação case-insensitive)
  const pergunta =
    typeof candidate.pergunta === "string" ? candidate.pergunta.trim().toLowerCase() : null;
  if (pergunta) {
    const dup = existing.find((e) => e.pergunta.trim().toLowerCase() === pergunta);
    if (dup) {
      errors.push({
        field: "pergunta",
        message: `Pergunta duplicada — já existe como ID "${dup.id}"`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
