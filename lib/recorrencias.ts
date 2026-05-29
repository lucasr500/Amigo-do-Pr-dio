// Engine de recorrência operacional — sem IA, sem backend.
// Calcula próximas datas de manutenções e documentos periódicos.
// Alimenta CalendárioOperacional, CommandCenter e HealthScore.

import {
  getManutencoes,
  getMemoriaOperacional,
  getProfile,
  type ManutencaoFrequencia,
  type ManutencaoRecorrente,
  type ManutencaoCriticidade,
} from "./session";

export type StatusRecorrencia = "em-dia" | "proxima" | "atrasada" | "sem-registro";

export type RecorrenciaComStatus = ManutencaoRecorrente & {
  proximaExecucao?: string; // YYYY-MM-DD calculado
  diasRestantes?: number;   // negativo = atrasada
  statusCalc: StatusRecorrencia;
  statusLabel: string;
};

// Frequência em dias (aproximado) para cálculos
const FREQ_DIAS: Record<ManutencaoFrequencia, number> = {
  mensal:      30,
  bimestral:   60,
  trimestral:  90,
  semestral:   180,
  anual:       365,
  sob_demanda: 0,
};

export function calcularProximaExecucao(
  ultimaExecucao: string,
  frequencia: ManutencaoFrequencia
): string | undefined {
  if (frequencia === "sob_demanda") return undefined;
  const d = new Date(`${ultimaExecucao}T00:00:00`);
  if (isNaN(d.getTime())) return undefined;
  d.setDate(d.getDate() + FREQ_DIAS[frequencia]);
  return d.toISOString().slice(0, 10);
}

export function diasAteData(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${iso}T00:00:00`);
  return Math.floor((target.getTime() - today.getTime()) / 86400000);
}

export function resolverStatusRecorrencia(
  item: ManutencaoRecorrente
): { proxima: string | undefined; dias: number | undefined; status: StatusRecorrencia; label: string } {
  if (!item.ativo) return { proxima: undefined, dias: undefined, status: "sem-registro", label: "Não se aplica" };
  if (!item.ultimaExecucao) return { proxima: undefined, dias: undefined, status: "sem-registro", label: "Sem registro de execução" };

  const proxima = calcularProximaExecucao(item.ultimaExecucao, item.frequencia);
  if (!proxima) return { proxima: undefined, dias: undefined, status: "em-dia", label: "Sob demanda" };

  const dias = diasAteData(proxima);

  if (dias < 0) {
    const abs = Math.abs(dias);
    return {
      proxima,
      dias,
      status: "atrasada",
      label: abs === 1 ? "Atrasada há 1 dia" : `Atrasada há ${abs} dias`,
    };
  }
  if (dias <= 30) {
    return {
      proxima,
      dias,
      status: "proxima",
      label: dias === 0 ? "Vence hoje" : `Vence em ${dias} dia${dias !== 1 ? "s" : ""}`,
    };
  }
  return {
    proxima,
    dias,
    status: "em-dia",
    label: `Próxima em ${dias} dias`,
  };
}

// Retorna todas as manutenções com status calculado
export function buildRecorrenciasComStatus(): RecorrenciaComStatus[] {
  const manutencoes = getManutencoes();
  return manutencoes
    .filter((m) => m.ativo)
    .map((m) => {
      const { proxima, dias, status, label } = resolverStatusRecorrencia(m);
      return {
        ...m,
        proximaExecucao: proxima,
        diasRestantes: dias,
        statusCalc: status,
        statusLabel: label,
      };
    })
    .sort((a, b) => {
      // Atrasadas primeiro, depois por dias restantes
      if (a.statusCalc === "atrasada" && b.statusCalc !== "atrasada") return -1;
      if (b.statusCalc === "atrasada" && a.statusCalc !== "atrasada") return 1;
      if (a.diasRestantes !== undefined && b.diasRestantes !== undefined) {
        return a.diasRestantes - b.diasRestantes;
      }
      return 0;
    });
}

// Manutenções padrão para prédio — usadas como template na inicialização
export type ManutencaoTemplate = {
  id: string;
  label: string;
  frequencia: ManutencaoFrequencia;
  criticidade: ManutencaoCriticidade;
  apenasComElevador?: boolean;
};

export const MANUTENCOES_PADRAO: ManutencaoTemplate[] = [
  { id: "manut_caixa_agua",   label: "Limpeza da caixa d'água",      frequencia: "semestral",   criticidade: "critica" },
  { id: "manut_dedetizacao",  label: "Dedetização",                   frequencia: "semestral",   criticidade: "importante" },
  { id: "manut_extintores",   label: "Manutenção de extintores",       frequencia: "anual",       criticidade: "critica" },
  { id: "manut_spda",         label: "Vistoria SPDA / Para-raio",     frequencia: "anual",       criticidade: "critica" },
  { id: "manut_eletrica",     label: "Vistoria elétrica",             frequencia: "anual",       criticidade: "importante" },
  { id: "manut_portao",       label: "Manutenção de portões",          frequencia: "semestral",   criticidade: "importante" },
  { id: "manut_bombas",       label: "Manutenção de bombas",           frequencia: "trimestral",  criticidade: "critica" },
  { id: "manut_incendio",     label: "Sistema de incêndio (hidrantes, mangueiras)", frequencia: "anual", criticidade: "critica" },
  { id: "manut_elevador",     label: "Manutenção de elevadores",       frequencia: "mensal",      criticidade: "critica", apenasComElevador: true },
  { id: "manut_fachada",      label: "Inspeção de fachada",            frequencia: "anual",       criticidade: "recomendada" },
  { id: "manut_cftv",         label: "Manutenção CFTV / câmeras",     frequencia: "anual",       criticidade: "recomendada" },
];

// Inicializa manutenções padrão se ainda não houver nenhuma cadastrada
export function inicializarManutencoesPadrao(): ManutencaoRecorrente[] {
  const existentes = getManutencoes();
  if (existentes.length > 0) return existentes;

  const profile = getProfile();
  const mem = getMemoriaOperacional();
  const now = new Date().toISOString();

  const lista: ManutencaoRecorrente[] = MANUTENCOES_PADRAO
    .filter((t) => !t.apenasComElevador || profile?.hasElevador)
    .map((t) => {
      // Pré-popula última execução a partir da MemoriaOperacional existente
      let ultimaExecucao: string | undefined;
      if (t.id === "manut_caixa_agua" && mem.ultimaLimpezaCaixaDAgua) ultimaExecucao = mem.ultimaLimpezaCaixaDAgua;
      if (t.id === "manut_dedetizacao" && mem.ultimaDedetizacao) ultimaExecucao = mem.ultimaDedetizacao;
      if (t.id === "manut_extintores" && mem.ultimaInspecaoExtintores) ultimaExecucao = mem.ultimaInspecaoExtintores;
      if (t.id === "manut_spda" && mem.ultimaVistoriaSPDA) ultimaExecucao = mem.ultimaVistoriaSPDA;
      if (t.id === "manut_eletrica" && mem.ultimaVistoriaEletrica) ultimaExecucao = mem.ultimaVistoriaEletrica;
      if (t.id === "manut_elevador" && mem.ultimaManutencaoElevador) ultimaExecucao = mem.ultimaManutencaoElevador;

      return {
        id: t.id,
        label: t.label,
        frequencia: t.frequencia,
        criticidade: t.criticidade,
        ultimaExecucao,
        ativo: true,
        createdAt: now,
        updatedAt: now,
      };
    });

  return lista; // não salva automaticamente — deixa o componente decidir
}

// Conta manutenções atrasadas e próximas para uso no CommandCenter e HealthScore
export function contarStatusManutencoes(): {
  atrasadas: number;
  proximas: number;
  emDia: number;
  semRegistro: number;
  total: number;
} {
  const todas = buildRecorrenciasComStatus();
  return {
    atrasadas:  todas.filter((m) => m.statusCalc === "atrasada").length,
    proximas:   todas.filter((m) => m.statusCalc === "proxima").length,
    emDia:      todas.filter((m) => m.statusCalc === "em-dia").length,
    semRegistro: todas.filter((m) => m.statusCalc === "sem-registro").length,
    total: todas.length,
  };
}

// Verifica se existem manutenções críticas atrasadas
export function temManutencaoCriticaAtrasada(): boolean {
  const todas = buildRecorrenciasComStatus();
  return todas.some((m) => m.statusCalc === "atrasada" && m.criticidade === "critica");
}

// Eventos de manutenção para o Calendário Operacional (próximos 12 meses)
export type EventoCalendario = {
  data: string;         // YYYY-MM-DD
  label: string;
  tipo: "manutencao" | "vencimento" | "ferias" | "assembleia" | "agenda";
  criticidade: ManutencaoCriticidade | "info";
  origem: string;       // ID da fonte
};

export function buildEventosCalendario(): EventoCalendario[] {
  const eventos: EventoCalendario[] = [];
  const todas = buildRecorrenciasComStatus();

  for (const m of todas) {
    if (m.proximaExecucao) {
      eventos.push({
        data: m.proximaExecucao,
        label: m.label,
        tipo: "manutencao",
        criticidade: m.criticidade,
        origem: m.id,
      });
    }
  }

  return eventos.sort((a, b) => a.data.localeCompare(b.data));
}
