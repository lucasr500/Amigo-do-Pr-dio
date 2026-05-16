// Lógica temporal centralizada — importar aqui ao invés de definir
// ate()/desde()/past() localmente em guidance, session ou componentes.

export type UrgencyLevel =
  | "vencido"       // data ultrapassada
  | "hoje"          // vence hoje (0 dias)
  | "urgente"       // 1–7 dias restantes
  | "breve"         // 8–30 dias restantes
  | "planejamento"  // 31–60 dias restantes
  | "acompanhar"    // 61–90 dias restantes
  | "em-dia"        // > 90 dias ou prazo satisfeito
  | "ausente";      // informação não cadastrada

// ─── Helpers de data ─────────────────────────────────────────────────────────

/** Dias restantes até a data ISO. Negativo = vencida. */
export function ate(iso: string): number {
  return Math.floor((new Date(iso).getTime() - Date.now()) / 86400000);
}

/** Dias decorridos desde a data ISO. */
export function desde(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

/** Retorna true se a data ISO já passou. */
export function past(iso: string): boolean {
  return new Date(iso).getTime() <= Date.now();
}

// ─── Avaliação de vencimento ─────────────────────────────────────────────────

/** Avalia urgência de uma data futura de vencimento (AVCB, Seguro, etc.). */
export function urgencyVencimento(iso: string): UrgencyLevel {
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "ausente";
  const d = Math.floor((t - Date.now()) / 86400000);
  if (d < 0)  return "vencido";
  if (d === 0) return "hoje";
  if (d <= 7)  return "urgente";
  if (d <= 30) return "breve";
  if (d <= 60) return "planejamento";
  if (d <= 90) return "acompanhar";
  return "em-dia";
}

// ─── Rótulos de ação ─────────────────────────────────────────────────────────

/**
 * Rótulo curto de ação.
 * Tom: calmo, direto. O app reduz ansiedade — não cria pânico.
 */
export function urgencyActionLabel(level: UrgencyLevel): string {
  switch (level) {
    case "vencido":      return "Atenção imediata";
    case "hoje":         return "Atenção imediata";
    case "urgente":      return "Resolver esta semana";
    case "breve":        return "Planejar em breve";
    case "planejamento": return "Planejar em breve";
    case "acompanhar":   return "Acompanhar";
    case "em-dia":       return "Em dia";
    case "ausente":      return "Complete esta informação";
  }
}

// ─── Mapeamento para prioridade de guidance ──────────────────────────────────

/**
 * Converte UrgencyLevel em prioridade do GuidancePanel.
 * Retorna null quando o item não deve gerar alerta.
 */
export function urgencyToGuidancePriority(
  level: UrgencyLevel
): "critico" | "atencao" | null {
  switch (level) {
    case "vencido":
    case "hoje":
    case "urgente":
    case "breve":        return "critico";
    case "planejamento":
    case "acompanhar":   return "atencao";
    default:             return null;
  }
}
