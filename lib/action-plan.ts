// Gerador de plano de ação determinístico — sem IA, sem backend.
// Regras baseadas nos dados do usuário para produzir próximos passos priorizados.

import {
  getMemoriaOperacional,
  getMemoriaAssistida,
  getDocumentos,
  getFuncionarios,
  getPendenciasAbertas,
  getProfile,
  DOCUMENTOS_ESSENCIAIS_IDS,
} from "./session";
import { buildGuidanceItems } from "./guidance";

export type ActionPriority = "urgente" | "este_mes" | "proximos_90_dias" | "quando_possivel";

export type ActionItem = {
  id: string;
  titulo: string;
  descricao?: string;
  prioridade: ActionPriority;
  categoria: "legal" | "financeiro" | "trabalhista" | "operacional" | "gestao";
};

export type ActionPlan = {
  generatedAt: string;
  items: ActionItem[];
};

const PRIORITY_ORDER: Record<ActionPriority, number> = {
  urgente:          0,
  este_mes:         1,
  proximos_90_dias: 2,
  quando_possivel:  3,
};

function daysSince(isoDate: string | undefined): number | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function daysUntil(isoDate: string | undefined): number | null {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return null;
  return Math.floor((d.getTime() - Date.now()) / 86_400_000);
}

export function buildActionPlan(): ActionPlan {
  const m         = getMemoriaOperacional();
  const assistida = getMemoriaAssistida();
  const docs      = getDocumentos();
  const funcs     = getFuncionarios();
  const pendencias = getPendenciasAbertas();
  const profile   = getProfile();
  const guidance  = buildGuidanceItems(m, profile);

  const items: ActionItem[] = [];
  const ids = new Set<string>();

  const add = (item: ActionItem) => {
    if (!ids.has(item.id)) {
      ids.add(item.id);
      items.push(item);
    }
  };

  // ── AVCB ──────────────────────────────────────────────────────────────────
  const avcbStatus = assistida.avcb?.status;
  const avcbDays   = daysUntil(m.vencimentoAVCB);
  if (!m.vencimentoAVCB && !assistida.avcb?.value) {
    add({
      id: "avcb_missing",
      titulo: "Localizar e registrar o AVCB do condomínio",
      descricao: "O Auto de Vistoria do Corpo de Bombeiros é obrigatório e precisa estar vigente.",
      prioridade: "este_mes",
      categoria: "legal",
    });
  } else if (avcbDays !== null && avcbDays <= 0) {
    add({
      id: "avcb_vencido",
      titulo: "AVCB vencido — renovar com urgência",
      descricao: "O AVCB está vencido. Contate a empresa de proteção contra incêndio.",
      prioridade: "urgente",
      categoria: "legal",
    });
  } else if (avcbDays !== null && avcbDays <= 60) {
    add({
      id: "avcb_vencendo",
      titulo: `AVCB vence em ${avcbDays} dias — iniciar renovação`,
      prioridade: "este_mes",
      categoria: "legal",
    });
  } else if (avcbStatus === "to_discover") {
    add({
      id: "avcb_discover",
      titulo: "Descobrir data de vencimento do AVCB",
      prioridade: "este_mes",
      categoria: "legal",
    });
  }

  // ── Seguro predial ────────────────────────────────────────────────────────
  const seguroDays = daysUntil(m.vencimentoSeguro);
  if (!m.vencimentoSeguro && !assistida.seguro?.value) {
    add({
      id: "seguro_missing",
      titulo: "Localizar e registrar a apólice do seguro predial",
      descricao: "O seguro predial é obrigatório em condomínios com mais de 2 pavimentos.",
      prioridade: "este_mes",
      categoria: "legal",
    });
  } else if (seguroDays !== null && seguroDays <= 0) {
    add({
      id: "seguro_vencido",
      titulo: "Seguro predial vencido — renovar com urgência",
      prioridade: "urgente",
      categoria: "legal",
    });
  } else if (seguroDays !== null && seguroDays <= 30) {
    add({
      id: "seguro_vencendo",
      titulo: `Seguro predial vence em ${seguroDays} dias`,
      prioridade: "este_mes",
      categoria: "legal",
    });
  }

  // ── Mandato síndico ───────────────────────────────────────────────────────
  const mandatoDays = daysUntil(m.fimMandatoSindico);
  if (!m.fimMandatoSindico && !assistida.mandato?.value) {
    add({
      id: "mandato_missing",
      titulo: "Registrar a data de fim do mandato do síndico",
      prioridade: "quando_possivel",
      categoria: "gestao",
    });
  } else if (mandatoDays !== null && mandatoDays <= 60) {
    add({
      id: "mandato_vencendo",
      titulo: `Mandato do síndico vence em ${mandatoDays} dias — convocar assembleia`,
      prioridade: mandatoDays <= 30 ? "urgente" : "este_mes",
      categoria: "gestao",
    });
  }

  // ── Funcionários / férias ─────────────────────────────────────────────────
  const funcsVencidas = funcs.filter((f) => f.status === "vencida");
  const funcsDesc     = funcs.filter((f) => f.status === "desconhecida");

  if (funcsVencidas.length > 0) {
    add({
      id: "ferias_vencidas",
      titulo: `Regularizar férias vencidas (${funcsVencidas.length} funcionário${funcsVencidas.length > 1 ? "s" : ""})`,
      descricao: "Férias vencidas geram passivo trabalhista. Conceder ou pagar em dobro.",
      prioridade: "urgente",
      categoria: "trabalhista",
    });
  }
  if (funcsDesc.length > 0) {
    add({
      id: "ferias_desconhecida",
      titulo: `Verificar situação de férias (${funcsDesc.length} funcionário${funcsDesc.length > 1 ? "s" : ""} sem informação)`,
      prioridade: "este_mes",
      categoria: "trabalhista",
    });
  }
  if (funcs.length === 0) {
    add({
      id: "funcionarios_nao_registrados",
      titulo: "Registrar funcionários e situação de férias",
      descricao: "Sem registro, não é possível monitorar riscos trabalhistas.",
      prioridade: "quando_possivel",
      categoria: "trabalhista",
    });
  }

  // ── Documentos essenciais ─────────────────────────────────────────────────
  const docsRegistrados = docs.length;
  if (docsRegistrados === 0) {
    add({
      id: "docs_nao_mapeados",
      titulo: "Mapear situação dos documentos essenciais",
      descricao: "Convenção, regimento, AVCB, seguro, contratos e laudos técnicos.",
      prioridade: "proximos_90_dias",
      categoria: "gestao",
    });
  } else {
    const naoTenho = docs.filter((d) => d.status === "nao_tenho");
    const aLocalizar = docs.filter((d) => d.status === "precisa_localizar");
    if (naoTenho.length > 0) {
      add({
        id: "docs_ausentes",
        titulo: `${naoTenho.length} documento${naoTenho.length > 1 ? "s" : ""} essencial${naoTenho.length > 1 ? "is" : ""} ausente${naoTenho.length > 1 ? "s" : ""}`,
        descricao: naoTenho.map((d) => d.id).join(", "),
        prioridade: "proximos_90_dias",
        categoria: "gestao",
      });
    }
    if (aLocalizar.length > 0) {
      add({
        id: "docs_localizar",
        titulo: `Localizar ${aLocalizar.length} documento${aLocalizar.length > 1 ? "s" : ""} marcado${aLocalizar.length > 1 ? "s" : ""} para busca`,
        prioridade: "este_mes",
        categoria: "gestao",
      });
    }
  }

  // ── Rotinas com atraso ────────────────────────────────────────────────────
  const routineChecks: Array<{ key: keyof typeof m; label: string; maxDays: number }> = [
    { key: "ultimaDedetizacao",         label: "Dedetização atrasada — reagendar",              maxDays: 180 },
    { key: "ultimaLimpezaCaixaDAgua",   label: "Limpeza da caixa d'água atrasada",               maxDays: 365 },
    { key: "ultimaManutencaoElevador",  label: "Manutenção de elevador atrasada (>30 dias)",      maxDays: 35  },
    { key: "ultimaInspecaoExtintores",  label: "Inspeção de extintores atrasada",                maxDays: 365 },
    { key: "ultimaVistoriaEletrica",    label: "Vistoria elétrica a realizar",                   maxDays: 730 },
    { key: "ultimaVistoriaSPDA",        label: "Vistoria do SPDA (para-raios) a realizar",       maxDays: 365 },
  ];

  for (const { key, label, maxDays } of routineChecks) {
    const val = m[key] as string | undefined;
    const days = daysSince(val);
    if (days === null || days > maxDays) {
      add({
        id: `rotina_${key}`,
        titulo: label,
        prioridade: days === null ? "quando_possivel" : "este_mes",
        categoria: "operacional",
      });
    }
  }

  // ── Alertas críticos ──────────────────────────────────────────────────────
  const criticals = guidance.filter((g) => g.priority === "critico");
  for (const c of criticals.slice(0, 3)) {
    add({
      id: `guidance_${c.id}`,
      titulo: c.label,
      descricao: c.context,
      prioridade: "urgente",
      categoria: "operacional",
    });
  }

  // ── Próximos passos parados ───────────────────────────────────────────────
  const staleMs = 21 * 86_400_000;
  const stale = pendencias.filter(
    (p) => Date.now() - new Date(p.createdAt).getTime() > staleMs
  );
  if (stale.length > 0) {
    add({
      id: "pendencias_paradas",
      titulo: `${stale.length} próximo${stale.length > 1 ? "s" : ""} passo${stale.length > 1 ? "s" : ""} parado${stale.length > 1 ? "s" : ""} há mais de 3 semanas`,
      descricao: "Revisar e concluir ou remover os itens desatualizados.",
      prioridade: "este_mes",
      categoria: "gestao",
    });
  }

  items.sort((a, b) => PRIORITY_ORDER[a.prioridade] - PRIORITY_ORDER[b.prioridade]);

  return { generatedAt: new Date().toISOString(), items };
}
