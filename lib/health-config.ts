// Configurações visuais e textuais do Health Score — fonte única de verdade.
// Importar aqui ao invés de duplicar em cada componente.

import type { HealthStatusKey } from "@/lib/health-score";

export const HEALTH_RING_COLOR: Record<HealthStatusKey, string> = {
  critico:           "#ef4444",
  atencao:           "#f59e0b",
  "em-evolucao":     "#60a5fa",
  "bem-acompanhado": "#22c55e",
  "tudo-em-ordem":   "#22c55e",
};

export const HEALTH_CARD_BG: Record<HealthStatusKey, string> = {
  critico:           "bg-red-50 border-red-100/60",
  atencao:           "bg-amber-50 border-amber-100/60",
  "em-evolucao":     "bg-navy-50/50 border-navy-100/50",
  "bem-acompanhado": "bg-green-50 border-green-100/60",
  "tudo-em-ordem":   "bg-green-50 border-green-100/60",
};

export const HEALTH_BADGE_STYLE: Record<HealthStatusKey, string> = {
  critico:           "bg-red-100 text-red-700",
  atencao:           "bg-amber-100 text-amber-700",
  "em-evolucao":     "bg-blue-100 text-blue-700",
  "bem-acompanhado": "bg-green-100 text-green-700",
  "tudo-em-ordem":   "bg-green-100 text-green-700",
};

export const HEALTH_STATUS_LABEL: Record<HealthStatusKey, string> = {
  critico:           "Crítico",
  atencao:           "Atenção",
  "em-evolucao":     "Em evolução",
  "bem-acompanhado": "Bom",
  "tudo-em-ordem":   "Bom",
};

export const HEALTH_STATUS_TITLE: Record<HealthStatusKey, string> = {
  critico:           "Requer atenção",
  atencao:           "Atenção necessária",
  "em-evolucao":     "Em evolução",
  "bem-acompanhado": "Condomínio saudável",
  "tudo-em-ordem":   "Condomínio saudável",
};

export const HEALTH_SHORT_PHRASE: Record<HealthStatusKey, string> = {
  critico:           "Resolva os alertas prioritários.",
  atencao:           "Há alertas que pedem atenção.",
  "em-evolucao":     "Complete as informações essenciais.",
  "bem-acompanhado": "Seu condomínio está no caminho certo.",
  "tudo-em-ordem":   "Organização operacional em dia.",
};

// Linguagem prática para o upgrade path — usada na SaudeScreen.
export function buildUpgradeText(
  currentPct: number,
  suggestions: string[]
): string {
  if (suggestions.length === 0) return "";
  const targetPct = Math.min(currentPct + 20, 100);
  const top = suggestions.slice(0, 2).join(" e ");
  return `Para subir de ${currentPct}% para ~${targetPct}%, resolva primeiro: ${top}.`;
}

// Verifica se há dados mínimos para calcular o Health Score.
export function hasMinimumHealthData(m: {
  vencimentoAVCB?: string;
  vencimentoSeguro?: string;
  fimMandatoSindico?: string;
  ultimaDedetizacao?: string;
  ultimaLimpezaCaixaDAgua?: string;
  ultimaManutencaoElevador?: string;
  ultimaInspecaoExtintores?: string;
  ultimaVistoriaSPDA?: string;
  ultimaVistoriaEletrica?: string;
  ultimaAGO?: string;
}): boolean {
  return !!(
    m.vencimentoAVCB || m.vencimentoSeguro || m.fimMandatoSindico ||
    m.ultimaDedetizacao || m.ultimaLimpezaCaixaDAgua || m.ultimaManutencaoElevador ||
    m.ultimaInspecaoExtintores || m.ultimaVistoriaSPDA || m.ultimaVistoriaEletrica ||
    m.ultimaAGO
  );
}

// Constantes de negócio compartilhadas
export const STALE_TASK_DAYS = 14;
export const STALE_ACTION_DAYS = 21;
