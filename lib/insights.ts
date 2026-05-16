// Motor de inteligência contextual silenciosa.
// Transforma dados operacionais em observações humanas — sem IA, sem ML.
// Retorna UM insight (o mais relevante) ou null. Nunca grita. Nunca alarma.
// Complementa o GuidancePanel: enquanto guidance orienta ação urgente,
// insights reconhecem padrões, antecipam ciclos e celebram estabilidade.

import {
  MemoriaOperacional,
  CondominioProfile,
  CondominioHealth,
  ResolutionEvent,
} from "./session";

export type InsightTone = "stable" | "notice" | "positive" | "upcoming";

export type InsightItem = {
  id: string;
  icon?: string;
  text: string;
  subtext?: string;
  tone: InsightTone;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const diasDesde = (iso: string): number =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const mesesDesde = (ds: number): number => Math.floor(ds / 30);

const past = (iso: string): boolean => new Date(iso).getTime() <= Date.now();

// ─── Engine principal ─────────────────────────────────────────────────────────
// Prioridade: positivo > estável > antecipação > ausência.
// Os thresholds de "antecipação" ficam abaixo dos thresholds de GuidancePanel
// para não duplicar o que já é urgente.

export function buildInsight(
  m: MemoriaOperacional,
  profile: CondominioProfile | null,
  health: CondominioHealth,
  resolutionEvents: ResolutionEvent[]
): InsightItem | null {
  if (health.totalMonitored === 0) return null;

  // ─── 1. Múltiplas resoluções este mês ──────────────────────────────────────
  const recentResolutions = resolutionEvents.filter((e) => diasDesde(e.ts) <= 30);

  if (recentResolutions.length >= 2) {
    return {
      id: "multiple-resolutions",
      text: `Você regularizou ${recentResolutions.length} itens este mês. O condomínio está mais organizado.`,
      tone: "positive",
    };
  }

  // ─── 2. Resolução muito recente (< 5 dias) ─────────────────────────────────
  if (recentResolutions.length === 1) {
    const ev = recentResolutions[0];
    const ds = diasDesde(ev.ts);
    if (ds < 5) {
      const when =
        ds === 0 ? "hoje" : ds === 1 ? "ontem" : `há ${ds} dias`;
      return {
        id: "recent-resolution",
        icon: "✓",
        text: `${ev.label} ${when}. Histórico do condomínio atualizado.`,
        tone: "positive",
      };
    }
  }

  // ─── 3. Estabilidade (em-dia, ≥ 3 itens monitorados) ──────────────────────
  if (health.status === "em-dia" && health.totalMonitored >= 3) {
    return {
      id: "stability",
      text: `Nenhuma pendência crítica. ${health.okCount} ${
        health.okCount === 1 ? "item acompanhado" : "itens acompanhados"
      } e em dia.`,
      tone: "stable",
    };
  }

  // ─── 4. Antecipação — dedetização (4 meses, pré-alerta) ───────────────────
  if (m.ultimaDedetizacao && past(m.ultimaDedetizacao)) {
    const ds = diasDesde(m.ultimaDedetizacao);
    const mo = mesesDesde(ds);
    if (ds >= 120 && ds < 150) {
      return {
        id: "dedet-upcoming",
        icon: "⏱",
        text: `Faz ${mo} meses da última dedetização. O prazo semestral está se aproximando.`,
        subtext: "Ciclo semestral recomendado",
        tone: "upcoming",
      };
    }
  }

  // ─── 5. Antecipação — caixa d'água (4 meses, pré-alerta) ──────────────────
  if (m.ultimaLimpezaCaixaDAgua && past(m.ultimaLimpezaCaixaDAgua)) {
    const ds = diasDesde(m.ultimaLimpezaCaixaDAgua);
    const mo = mesesDesde(ds);
    if (ds >= 120 && ds < 150) {
      return {
        id: "caixa-upcoming",
        icon: "⏱",
        text: `Faz ${mo} meses da última limpeza da caixa d'água. O prazo semestral se aproxima.`,
        subtext: "Portaria MS 888/2021",
        tone: "upcoming",
      };
    }
  }

  // ─── 6. Antecipação — extintores (4 meses, pré-alerta) ────────────────────
  if (m.ultimaInspecaoExtintores && past(m.ultimaInspecaoExtintores)) {
    const ds = diasDesde(m.ultimaInspecaoExtintores);
    const mo = mesesDesde(ds);
    if (ds >= 120 && ds < 150) {
      return {
        id: "extintores-upcoming",
        icon: "⏱",
        text: `Os extintores estão há ${mo} meses desde a última inspeção. O prazo anual se aproxima.`,
        subtext: "NBR 12962 — inspeção anual",
        tone: "upcoming",
      };
    }
  }

  // ─── 7. Antecipação — elevador (20–29 dias, pré-alerta) ───────────────────
  if (
    m.ultimaManutencaoElevador &&
    profile?.hasElevador &&
    past(m.ultimaManutencaoElevador)
  ) {
    const ds = diasDesde(m.ultimaManutencaoElevador);
    if (ds >= 20 && ds < 30) {
      return {
        id: "elevador-upcoming",
        icon: "⏱",
        text: `O elevador está há ${ds} dias sem registro de manutenção. Confirme a visita com a prestadora.`,
        subtext: "Manutenção mensal obrigatória",
        tone: "upcoming",
      };
    }
  }

  // ─── 8. Antecipação — AGO (8–9 meses, pré-planejamento) ───────────────────
  if (m.ultimaAGO && past(m.ultimaAGO)) {
    const mo = mesesDesde(diasDesde(m.ultimaAGO));
    if (mo >= 8 && mo < 10) {
      return {
        id: "ago-upcoming",
        text: `A última assembleia ordinária foi há ${mo} meses. Bom momento para planejar a próxima.`,
        subtext: "AGO anual — Lei 4.591/64",
        tone: "upcoming",
      };
    }
  }

  // ─── 9. Ausência — elevador sem registro (perfil com elevador) ─────────────
  if (profile?.hasElevador && !m.ultimaManutencaoElevador) {
    return {
      id: "elevator-no-record",
      text: `O elevador está cadastrado, mas não há data de manutenção registrada. Adicione para acompanhar.`,
      tone: "notice",
    };
  }

  // ─── 10. Ausência — AGO sem registro ───────────────────────────────────────
  if (health.totalMonitored >= 2 && !m.ultimaAGO) {
    return {
      id: "no-ago",
      text: `Ainda não há registro de assembleia ordinária. Adicione a data da última AGO para acompanhar.`,
      tone: "notice",
    };
  }

  return null;
}
