// ─── Registro de fornecedores — memória institucional ────────────────────────
// Cadastro de fornecedores com histórico de serviços prestados.
// Cada síndico que usa gera um ativo de conhecimento que o próximo herda.

import { safeRead, safeWrite, KEYS } from "./session-core";

export type SupplierCategory =
  | "elevador"
  | "limpeza"
  | "portaria"
  | "administradora"
  | "manutencao_geral"
  | "eletrica"
  | "hidraulica"
  | "pintura"
  | "jardinagem"
  | "seguranca"
  | "dedetizacao"
  | "caixa_dagua"
  | "extintor"
  | "spda"
  | "seguro"
  | "juridico"
  | "contabilidade"
  | "obra"
  | "outro";

export type SupplierRating = 1 | 2 | 3 | 4 | 5;

export type SupplierServiceRecord = {
  id: string;
  date: string;          // YYYY-MM-DD
  description: string;
  amount?: number;
  rating?: SupplierRating;
  notes?: string;
  createdAt: string;
};

export type Supplier = {
  id: string;
  name: string;
  category: SupplierCategory;
  contact?: string;         // telefone ou email
  cnpj?: string;
  responsible?: string;     // nome do responsável/vendedor
  notes?: string;
  active: boolean;
  contractStart?: string;   // YYYY-MM-DD
  contractEnd?: string;     // YYYY-MM-DD — para contratos com prazo
  monthlyAmount?: number;   // valor mensal contratado
  serviceHistory: SupplierServiceRecord[];
  rating?: SupplierRating;  // avaliação geral do fornecedor
  createdAt: string;
  updatedAt: string;
};

export const SUPPLIER_CATEGORY_LABELS: Record<SupplierCategory, string> = {
  elevador:          "Elevador",
  limpeza:           "Limpeza",
  portaria:          "Portaria",
  administradora:    "Administradora",
  manutencao_geral:  "Manutenção geral",
  eletrica:          "Elétrica",
  hidraulica:        "Hidráulica",
  pintura:           "Pintura",
  jardinagem:        "Jardinagem",
  seguranca:         "Segurança",
  dedetizacao:       "Dedetização",
  caixa_dagua:       "Caixa d'água",
  extintor:          "Extintores",
  spda:              "SPDA / Para-raios",
  seguro:            "Seguro",
  juridico:          "Jurídico",
  contabilidade:     "Contabilidade",
  obra:              "Obra / Reforma",
  outro:             "Outro",
};

function genId(): string {
  return `sup_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function getSuppliers(): Supplier[] {
  return safeRead<Supplier[]>(KEYS.SUPPLIERS, []);
}

export function saveSuppliers(list: Supplier[]): void {
  safeWrite(KEYS.SUPPLIERS, list);
}

export function addSupplier(data: Omit<Supplier, "id" | "createdAt" | "updatedAt" | "serviceHistory">): Supplier {
  const now = new Date().toISOString();
  const supplier: Supplier = { ...data, id: genId(), serviceHistory: [], createdAt: now, updatedAt: now };
  saveSuppliers([...getSuppliers(), supplier]);
  return supplier;
}

export function updateSupplier(id: string, patch: Partial<Omit<Supplier, "id" | "createdAt" | "serviceHistory">>): void {
  saveSuppliers(
    getSuppliers().map((s) => s.id === id ? { ...s, ...patch, updatedAt: new Date().toISOString() } : s)
  );
}

export function deleteSupplier(id: string): void {
  saveSuppliers(getSuppliers().filter((s) => s.id !== id));
}

export function addServiceRecord(supplierId: string, record: Omit<SupplierServiceRecord, "id" | "createdAt">): void {
  const now = new Date().toISOString();
  saveSuppliers(
    getSuppliers().map((s) => {
      if (s.id !== supplierId) return s;
      const newRecord: SupplierServiceRecord = { ...record, id: genId(), createdAt: now };
      return { ...s, serviceHistory: [...s.serviceHistory, newRecord], updatedAt: now };
    })
  );
}

export function getSuppliersByCategory(category: SupplierCategory): Supplier[] {
  return getSuppliers().filter((s) => s.category === category && s.active);
}

export function getActiveSuppliers(): Supplier[] {
  return getSuppliers().filter((s) => s.active);
}

export function getSuppliersSummary(): {
  total: number;
  active: number;
  withContracts: number;
  expiringContracts: Supplier[];
} {
  const all = getSuppliers();
  const today = new Date().toISOString().slice(0, 10);
  const in60 = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  return {
    total: all.length,
    active: all.filter((s) => s.active).length,
    withContracts: all.filter((s) => s.contractEnd).length,
    expiringContracts: all.filter((s) => s.contractEnd && s.contractEnd >= today && s.contractEnd <= in60),
  };
}

export function buildSuppliersReport(suppliers: Supplier[]): string {
  const active = suppliers.filter((s) => s.active);
  const inactive = suppliers.filter((s) => !s.active);

  const lines: string[] = [
    "RELAÇÃO DE FORNECEDORES DO CONDOMÍNIO",
    `Gerado em: ${new Date().toLocaleDateString("pt-BR")}`,
    `Total: ${active.length} ativos${inactive.length > 0 ? ` + ${inactive.length} inativos` : ""}`,
    "",
  ];

  const byCategory = new Map<SupplierCategory, Supplier[]>();
  for (const s of active) {
    if (!byCategory.has(s.category)) byCategory.set(s.category, []);
    byCategory.get(s.category)!.push(s);
  }

  for (const [cat, list] of byCategory) {
    lines.push(`▸ ${SUPPLIER_CATEGORY_LABELS[cat]}`);
    for (const s of list) {
      lines.push(`  ${s.name}`);
      if (s.contact)       lines.push(`    Contato: ${s.contact}`);
      if (s.responsible)   lines.push(`    Responsável: ${s.responsible}`);
      if (s.contractEnd)   lines.push(`    Contrato até: ${s.contractEnd}`);
      if (s.monthlyAmount) lines.push(`    Valor mensal: R$ ${s.monthlyAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);
      if (s.rating)        lines.push(`    Avaliação: ${"★".repeat(s.rating)}${"☆".repeat(5 - s.rating)}`);
      if (s.notes)         lines.push(`    Obs: ${s.notes}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
