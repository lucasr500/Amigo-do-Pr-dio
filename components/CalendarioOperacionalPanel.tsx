"use client";

// Calendário Operacional Anual — visão consolidada de vencimentos, manutenções,
// recorrências e férias agrupados por mês. Sem calendário mensal visual pesado.
// 100% client-side, sem IA, sem backend.

import { useEffect, useState, useMemo } from "react";
import {
  getMemoriaOperacional,
  getAgendaEvents,
  getFuncionarios,
  getManutencoes,
  getProfile,
  type ManutencaoCriticidade,
} from "@/lib/session";
import {
  buildEventosCalendario,
  calcularProximaExecucao,
  inicializarManutencoesPadrao,
  type EventoCalendario,
} from "@/lib/recorrencias";
import { ate } from "@/lib/urgency";

type Props = { refreshKey?: number };

type EventoMes = EventoCalendario & { diasRestantes: number };
type GrupoMes = { mesKey: string; mesLabel: string; eventos: EventoMes[] };

const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const TIPO_ICONE: Record<EventoCalendario["tipo"], string> = {
  manutencao:  "🔧",
  vencimento:  "📅",
  ferias:      "🌴",
  assembleia:  "🏛️",
  agenda:      "📌",
};

const CRIT_COR: Record<ManutencaoCriticidade | "info", string> = {
  critica:      "text-terracotta-600 bg-terracotta-50",
  importante:   "text-amber-700 bg-amber-50",
  recomendada:  "text-navy-500 bg-navy-50",
  info:         "text-navy-500 bg-navy-50",
};

function buildVencimentosEstaticos(): EventoCalendario[] {
  const m = getMemoriaOperacional();
  const eventos: EventoCalendario[] = [];

  const add = (data: string | undefined, label: string, origem: string) => {
    if (!data) return;
    eventos.push({ data, label, tipo: "vencimento", criticidade: "critica", origem });
  };

  add(m.vencimentoAVCB, "Vencimento AVCB", "avcb");
  add(m.vencimentoSeguro, "Vencimento do seguro predial", "seguro");
  add(m.fimMandatoSindico, "Fim do mandato do síndico", "mandato");

  return eventos;
}

function buildFeriasEventos(): EventoCalendario[] {
  const funcionarios = getFuncionarios();
  const eventos: EventoCalendario[] = [];

  for (const f of funcionarios) {
    // Estima próximas férias a partir da última fruição + 12 meses
    if (f.ultimasFeriasGozo) {
      const d = new Date(`${f.ultimasFeriasGozo}T00:00:00`);
      d.setFullYear(d.getFullYear() + 1);
      eventos.push({
        data: d.toISOString().slice(0, 10),
        label: `Férias a planejar: ${f.nomeFuncao}`,
        tipo: "ferias",
        criticidade: "importante",
        origem: `ferias_${f.id}`,
      });
    } else if (f.dataAdmissao) {
      // Sem registro de férias — calcular 12 meses após admissão
      const d = new Date(`${f.dataAdmissao}T00:00:00`);
      d.setFullYear(d.getFullYear() + 1);
      const hoje = new Date().toISOString().slice(0, 10);
      if (d.toISOString().slice(0, 10) >= hoje) {
        eventos.push({
          data: d.toISOString().slice(0, 10),
          label: `Férias: ${f.nomeFuncao} (1º período)`,
          tipo: "ferias",
          criticidade: "importante",
          origem: `ferias_${f.id}`,
        });
      }
    }
  }

  return eventos;
}

function buildAgendaEventos(): EventoCalendario[] {
  const hoje = new Date().toISOString().slice(0, 10);
  return getAgendaEvents()
    .filter((e) => !e.completedAt && e.date >= hoje)
    .slice(0, 20)
    .map((e) => ({
      data: e.date,
      label: e.title.slice(0, 50),
      tipo: "agenda" as const,
      criticidade: "info" as const,
      origem: e.id,
    }));
}

export default function CalendarioOperacionalPanel({ refreshKey }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [mesAberto, setMesAberto] = useState<string | null>(null);
  const [totalEventos, setTotalEventos] = useState(0);

  useEffect(() => {
    // Inicializa manutenções padrão se vazio, sem salvar automaticamente
    // (apenas para exibição — usuário salva ao editar via ManutencaoPanel)
    setHydrated(true);
  }, [refreshKey]);

  const grupos = useMemo((): GrupoMes[] => {
    if (!hydrated) return [];

    const hoje = new Date().toISOString().slice(0, 10);
    const profile = getProfile();

    // Garante que manutenções padrão existam para o calendário
    const manutencoesSalvas = getManutencoes();
    if (manutencoesSalvas.length === 0) {
      // Usa templates sem salvar, apenas para a visão do calendário
      const templates = inicializarManutencoesPadrao();
      // Injeta temporariamente para buildEventosCalendario funcionar
      // (se quiser persistir, o usuário deve abrir o painel de manutenções)
      const eventosManut: EventoCalendario[] = templates
        .filter((t) => t.ultimaExecucao)
        .map((t) => {
          const proxima = calcularProximaExecucao(t.ultimaExecucao!, t.frequencia);
          if (!proxima) return null;
          return {
            data: proxima,
            label: t.label,
            tipo: "manutencao" as const,
            criticidade: t.criticidade,
            origem: t.id,
          };
        })
        .filter((e): e is NonNullable<typeof e> => e !== null) as EventoCalendario[];

      return agruparEventos([
        ...eventosManut,
        ...buildVencimentosEstaticos(),
        ...buildFeriasEventos(),
        ...buildAgendaEventos(),
      ], hoje);
    }

    const todos: EventoCalendario[] = [
      ...buildEventosCalendario(),
      ...buildVencimentosEstaticos(),
      ...buildFeriasEventos(),
      ...buildAgendaEventos(),
    ];

    return agruparEventos(todos, hoje);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, refreshKey]);

  useEffect(() => {
    const total = grupos.reduce((sum, g) => sum + g.eventos.length, 0);
    setTotalEventos(total);
  }, [grupos]);

  if (!hydrated) return null;

  function agruparEventos(todos: EventoCalendario[], hoje: string): GrupoMes[] {
    // Filtra próximos 12 meses
    const limite = new Date();
    limite.setFullYear(limite.getFullYear() + 1);
    const limiteStr = limite.toISOString().slice(0, 10);

    const filtrados = todos
      .filter((e) => e.data >= hoje && e.data <= limiteStr)
      .map((e) => ({
        ...e,
        diasRestantes: Math.floor(
          (new Date(`${e.data}T00:00:00`).getTime() - new Date(`${hoje}T00:00:00`).getTime()) / 86400000
        ),
      }))
      .sort((a, b) => a.data.localeCompare(b.data));

    // Agrupa por mês
    const porMes: Record<string, EventoMes[]> = {};
    for (const e of filtrados) {
      const key = e.data.slice(0, 7); // "YYYY-MM"
      if (!porMes[key]) porMes[key] = [];
      porMes[key].push(e);
    }

    return Object.entries(porMes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, eventos]) => {
        const [ano, mes] = key.split("-");
        const mesIdx = parseInt(mes) - 1;
        const anoNum = parseInt(ano);
        const anoAtual = new Date().getFullYear();
        const mesLabel = anoNum === anoAtual
          ? MESES_PT[mesIdx]
          : `${MESES_PT[mesIdx]} ${anoNum}`;
        return { mesKey: key, mesLabel, eventos };
      });
  }

  // ── Collapsed ──────────────────────────────────────────────────────────────
  if (!expanded) {
    const gruposCount = grupos.length;
    const subtitle = totalEventos === 0
      ? "Registre manutenções e vencimentos para ativar a visão anual"
      : `${totalEventos} evento${totalEventos !== 1 ? "s" : ""} nos próximos 12 meses · ${gruposCount} mese${gruposCount !== 1 ? "s" : ""} com atividade`;

    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-2.5 rounded-[18px] border border-cream-200/90 bg-white/78 px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(31,49,71,0.03)] transition-colors hover:bg-white active:bg-navy-50"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[13px]" aria-hidden="true">
            📆
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-navy-800">Calendário operacional</p>
            <p className="text-[11.5px] text-navy-400 truncate">{subtitle}</p>
          </div>
          <span className="shrink-0 text-[11.5px] font-semibold text-navy-500">Ver →</span>
        </button>
      </section>
    );
  }

  // ── Expanded ───────────────────────────────────────────────────────────────
  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="rounded-[22px] border border-cream-200/90 bg-white/92 p-4 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_14px_30px_-24px_rgba(31,49,71,0.30)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-navy-800">Calendário operacional</p>
            <p className="text-[11px] text-navy-400">Próximos 12 meses</p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="text-[11.5px] text-navy-400 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        {grupos.length === 0 ? (
          <div className="rounded-xl bg-navy-50/60 px-4 py-4">
            <p className="text-[12.5px] font-medium text-navy-700">Nenhum evento previsto</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-navy-500">
              O calendário operacional consolida vencimentos de AVCB, seguro e mandato, manutenções recorrentes, férias previstas e eventos da agenda. Registre dados em Vencimentos e rotinas para ativar a visão anual do condomínio.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {grupos.map((grupo) => {
              const aberto = mesAberto === grupo.mesKey;
              const temCritico = grupo.eventos.some((e) => e.criticidade === "critica");
              const temProximo = grupo.eventos.some((e) => e.diasRestantes <= 30);

              return (
                <div key={grupo.mesKey} className="rounded-xl border border-navy-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMesAberto(aberto ? null : grupo.mesKey)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-navy-50/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[12.5px] font-medium text-navy-800">{grupo.mesLabel}</p>
                        {temCritico && (
                          <span className="h-1.5 w-1.5 rounded-full bg-terracotta-400" aria-hidden="true" />
                        )}
                        {temProximo && !temCritico && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
                        )}
                      </div>
                      <p className="text-[11px] text-navy-400">
                        {grupo.eventos.length} evento{grupo.eventos.length !== 1 ? "s" : ""}
                        {grupo.eventos[0]?.diasRestantes !== undefined && grupo.eventos[0].diasRestantes <= 30 && (
                          <span className="ml-1 text-amber-600">— em breve</span>
                        )}
                      </p>
                    </div>
                    <svg
                      className={`h-3.5 w-3.5 text-navy-300 transition-transform ${aberto ? "rotate-90" : ""}`}
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {aberto && (
                    <div className="border-t border-navy-50 bg-navy-50/20 px-3 py-2 space-y-1.5">
                      {grupo.eventos.map((e) => (
                        <div key={`${e.origem}-${e.data}`} className="flex items-start gap-2.5 py-1">
                          <span className="mt-0.5 text-[14px] shrink-0" aria-hidden="true">
                            {TIPO_ICONE[e.tipo]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-medium text-navy-800 leading-snug">{e.label}</p>
                            <p className="text-[10.5px] text-navy-400">
                              {new Date(`${e.data}T00:00:00`).toLocaleDateString("pt-BR", {
                                day: "numeric",
                                month: "long",
                              })}
                              {e.diasRestantes <= 30 && (
                                <span className="ml-1 text-amber-600">
                                  · em {e.diasRestantes === 0 ? "hoje" : `${e.diasRestantes} dias`}
                                </span>
                              )}
                            </p>
                          </div>
                          {e.criticidade !== "info" && (
                            <span className={`shrink-0 text-[10px] rounded-full px-1.5 py-0.5 ${CRIT_COR[e.criticidade]}`}>
                              {e.criticidade === "critica" ? "Crítico" : e.criticidade === "importante" ? "Importante" : ""}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-[10px] leading-relaxed text-navy-400">
          Consolida vencimentos, manutenções recorrentes, férias previstas e agenda. Baseado nos dados cadastrados no app.
        </p>
      </div>
    </section>
  );
}
