"use client";

import { useEffect, useState } from "react";
import {
  exportTelemetry,
  getUsageStats,
  getRecentQueries,
  getChecklistStorage,
  countMemoriaItens,
  getSessionMeta,
  computeHabitScore,
  HabitTier,
} from "@/lib/session";
import { fetchRecentEvents, telemetryEnabled, RawEvent } from "@/lib/telemetry";
import { auditQuestion, AuditResult, AuditExpectedType } from "@/lib/data";

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function useAdminAuth() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    // Produção sem chave configurada → bloquear sempre (evita exposição acidental)
    if (!ADMIN_KEY && process.env.NODE_ENV === "production") {
      setAuthed(false); return;
    }
    const stored = sessionStorage.getItem("amigo_admin_auth");
    if (stored === "ok" || !ADMIN_KEY) { setAuthed(true); return; }
    const input = window.prompt("Senha do painel:");
    if (input === ADMIN_KEY) {
      sessionStorage.setItem("amigo_admin_auth", "ok");
      setAuthed(true);
    } else {
      setAuthed(false);
    }
  }, []);

  return authed;
}

// ─── Aggregation helpers ───────────────────────────────────────────────────────

type Aggregated = {
  totalSessions: number;
  totalQueries: number;
  fallbackCount: number;
  fallbackRate: string;
  memoriaAdoption: string;
  checklistsStarted: number;
  topQueries: { q: string; count: number }[];
  topFallbackTokens: { token: string; count: number }[];
  tierDist: Record<HabitTier, number>;
  recentEvents: RawEvent[];
};

function aggregateRemote(events: RawEvent[]): Aggregated {
  const sessions = new Set<string>();
  const queries: Record<string, number> = {};
  const fallbackTokens: Record<string, number> = {};
  let fallbackCount = 0;
  let totalQueries = 0;
  let memoriaCount = 0;
  let checklistsStarted = 0;
  const tierDist: Record<HabitTier, number> = {
    new: 0, exploring: 0, forming: 0, habitual: 0, power: 0,
  };

  for (const e of events) {
    sessions.add(e.session_id);

    if (e.event === "query_submitted" || e.event === "query_fallback") {
      totalQueries++;
      const q = (e.properties.q as string | undefined) ?? "";
      if (q) queries[q] = (queries[q] ?? 0) + 1;
      if (e.event === "query_fallback") {
        fallbackCount++;
        const tokens = q.split(/\s+/).filter((t) => t.length > 2);
        tokens.forEach((t) => { fallbackTokens[t] = (fallbackTokens[t] ?? 0) + 1; });
      }
    }

    if (e.event === "memoria_saved") memoriaCount++;
    if (e.event === "checklist_open") checklistsStarted++;
  }

  const topQueries = Object.entries(queries)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([q, count]) => ({ q, count }));

  const topFallbackTokens = Object.entries(fallbackTokens)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([token, count]) => ({ token, count }));

  const totalSessionCount = sessions.size;

  return {
    totalSessions: totalSessionCount,
    totalQueries,
    fallbackCount,
    fallbackRate: totalQueries > 0
      ? `${Math.round((fallbackCount / totalQueries) * 100)}%`
      : "—",
    memoriaAdoption: totalSessionCount > 0
      ? `${Math.round((memoriaCount / totalSessionCount) * 100)}%`
      : "—",
    checklistsStarted,
    topQueries,
    topFallbackTokens,
    tierDist,
    recentEvents: events.slice(0, 50),
  };
}

function aggregateLocal(): Aggregated {
  const stats = getUsageStats();
  const queries = getRecentQueries(200);
  const checklistStorage = getChecklistStorage();
  const habit = computeHabitScore();

  const qCount: Record<string, number> = {};
  const ftCount: Record<string, number> = {};
  let fallbackCount = 0;

  for (const q of queries) {
    qCount[q.q] = (qCount[q.q] ?? 0) + 1;
    if (q.isDefault) {
      fallbackCount++;
      q.tokens.forEach((t) => { ftCount[t] = (ftCount[t] ?? 0) + 1; });
    }
  }

  const topQueries = Object.entries(qCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([q, count]) => ({ q, count }));

  const topFallbackTokens = Object.entries(ftCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([token, count]) => ({ token, count }));

  const tierDist: Record<HabitTier, number> = {
    new: 0, exploring: 0, forming: 0, habitual: 0, power: 0,
  };
  tierDist[habit.tier] = 1;

  return {
    totalSessions: getSessionMeta().sessionCount,
    totalQueries: stats.totalCount,
    fallbackCount,
    fallbackRate: stats.totalCount > 0
      ? `${Math.round((fallbackCount / stats.totalCount) * 100)}%`
      : "—",
    memoriaAdoption: countMemoriaItens() > 0 ? "sim" : "não",
    checklistsStarted: Object.keys(checklistStorage).length,
    topQueries,
    topFallbackTokens,
    tierDist,
    recentEvents: [],
  };
}

// ─── Components ────────────────────────────────────────────────────────────────

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white px-4 py-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-navy-400">{label}</p>
      <p className="mt-1 text-[22px] font-bold text-navy-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-navy-400">{sub}</p>}
    </div>
  );
}

const TIER_LABELS: Record<HabitTier, string> = {
  new: "Novo",
  exploring: "Explorando",
  forming: "Formando hábito",
  habitual: "Habitual",
  power: "Power user",
};

const TIER_COLORS: Record<HabitTier, string> = {
  new: "bg-navy-100 text-navy-600",
  exploring: "bg-amber-50 text-amber-700",
  forming: "bg-sage-50 text-sage-700",
  habitual: "bg-sage-100 text-sage-800",
  power: "bg-navy-800 text-white",
};

// ─── Audit ─────────────────────────────────────────────────────────────────────

type AuditCase = { q: string; t: AuditExpectedType; cat?: string };

const AUDIT_CASES: AuditCase[] = [
  // Multas
  { q: "Posso aplicar multa sem assembleia?", t: "A", cat: "multas" },
  { q: "Quantas advertências antes de multar?", t: "A", cat: "multas" },
  { q: "Morador fez barulho de madrugada — o que faço?", t: "A", cat: "multas" },
  { q: "Morador reincidente pode ter multa mais alta?", t: "A", cat: "multas" },
  { q: "O que acontece se eu multar sem base legal?", t: "A", cat: "multas" }, // Fase 34 adicionou multa-sem-base-legal-consequencias — motor acerta
  { q: "Vizinho colocou grade na varanda sem avisar — posso multar?", t: "A", cat: "multas" },
  { q: "Morador briga muito com os vizinhos — dá para punir?", t: "A", cat: "multas" },
  { q: "Como documentar uma infração antes de multar?", t: "A", cat: "multas" },
  // Obras
  { q: "Morador precisa avisar antes de fazer obra?", t: "A", cat: "obras" },
  { q: "Em quais horários é permitido fazer reforma?", t: "A", cat: "obras" },
  { q: "Obra no fim de semana — pode?", t: "A", cat: "obras" },
  { q: "Quem paga se obra do vizinho danificou meu apartamento?", t: "A", cat: "obras" },
  { q: "Morador trocou o piso da sacada sem permissão — o que faço?", t: "A", cat: "obras" },
  { q: "Posso exigir ART do profissional que fez a obra?", t: "B", cat: "obras" }, // motor → obras-sem-autorizacao (tangencial)
  { q: "Morador quebrou a parede entre dois cômodos — legal?", t: "A", cat: "obras" },
  { q: "Como regularizar uma obra já feita sem comunicação?", t: "A", cat: "obras" },
  // Inadimplência
  { q: "Como cobrar moradores inadimplentes?", t: "A", cat: "inadimplencia" },
  { q: "Posso cortar a água de quem não paga?", t: "A", cat: "inadimplencia" },
  { q: "Posso negativar o condômino inadimplente?", t: "A", cat: "inadimplencia" },
  { q: "Qual o prazo para prescrição da dívida condominial?", t: "A", cat: "inadimplencia" },
  { q: "Morador deve 4 meses — posso proibir o uso da piscina?", t: "A", cat: "inadimplencia" },
  { q: "Posso cobrar juros de mora? Qual a porcentagem?", t: "A", cat: "inadimplencia" },
  { q: "Inquilino não paga — dono da unidade responde?", t: "A", cat: "locacao" },
  { q: "Morador parcelou a dívida mas não está cumprindo — o que faço?", t: "A", cat: "inadimplencia" },
  { q: "A cota condominial venceu ontem — já posso cobrar juros?", t: "B", cat: "inadimplencia" }, // motor → prescricao (off-topic: prescricao ≠ juros mora)
  // Assembleias
  { q: "Como convocar assembleia extraordinária?", t: "A", cat: "assembleias" },
  { q: "Com quantos dias de antecedência convocar a AGO?", t: "A", cat: "assembleias" },
  { q: "Inquilino pode votar em assembleia?", t: "A", cat: "assembleias" },
  { q: "Qual o quórum para mudar a convenção?", t: "A", cat: "assembleias" },
  { q: "Posso fazer assembleia virtual?", t: "A", cat: "assembleias" },
  { q: "Como registrar a ata da assembleia corretamente?", t: "B", cat: "assembleias" },
  { q: "Um condômino com procuração pode votar por outro?", t: "A", cat: "assembleias" },
  { q: "A votação foi empatada — o síndico tem voto de desempate?", t: "A", cat: "assembleias" },
  // Funcionários/Trabalhista
  { q: "Qual a jornada correta do porteiro?", t: "A", cat: "trabalhista" },
  { q: "Posso contratar zelador como PJ?", t: "A", cat: "funcionarios" },
  { q: "O porteiro faltou — posso descontar?", t: "A", cat: "funcionarios" },
  { q: "Porteiro grávida pode ser dispensada?", t: "A", cat: "trabalhista" },
  { q: "Como calcular o aviso prévio do zelador?", t: "A", cat: "trabalhista" },
  { q: "O faxineiro faz hora extra — como calcular?", t: "A", cat: "trabalhista" }, // Fase 33 corrigiu — motor agora aponta jornada-horas-extras-condominio
  { q: "Funcionário terceirizado — o condomínio responde por acidente?", t: "A", cat: "trabalhista" },
  { q: "Qual a diferença entre CLT e contrato de prestação de serviço?", t: "A", cat: "trabalhista" },
  { q: "Posso demitir o porteiro por justa causa por usar o celular?", t: "A", cat: "trabalhista" }, // Fase 33 adicionou porteiro/celular em justa-causa-funcionario — motor acerta
  // LGPD
  { q: "O condomínio pode publicar lista de devedores?", t: "A", cat: "lgpd" },
  { q: "Posso instalar câmera de segurança no corredor?", t: "A", cat: "lgpd" },
  { q: "Por quanto tempo guardar as imagens das câmeras?", t: "A", cat: "lgpd" },
  { q: "O condomínio pode compartilhar fotos no grupo de WhatsApp?", t: "A", cat: "lgpd" },
  { q: "Posso publicar o nome dos inadimplentes no mural?", t: "B", cat: "lgpd" },
  { q: "Síndico pode gravar reunião de assembleia?", t: "B", cat: "lgpd" },
  { q: "Que dados do morador o condomínio pode guardar?", t: "A", cat: "lgpd" },
  { q: "Morador não quer aparecer nas câmeras — pode exigir isso?", t: "A", cat: "lgpd" },
  // Responsabilidade
  { q: "Vazamento do apartamento de cima: quem paga?", t: "A", cat: "responsabilidade" },
  { q: "Infiltração na garagem — responsabilidade de quem?", t: "A", cat: "responsabilidade" },
  { q: "Goteira no meu apartamento veio do teto — o que faço?", t: "A", cat: "responsabilidade" },
  { q: "Morador vizinho causou dano na minha parede — como cobrar?", t: "A", cat: "responsabilidade" }, // Fase 34 adicionou dano-vizinho-procedimento — motor acerta
  { q: "Furto de bicicleta na garagem — o condomínio responde?", t: "A", cat: "responsabilidade" },
  { q: "Acidente na piscina — quem é responsável?", t: "A", cat: "responsabilidade" },
  { q: "A marquise caiu e danificou um carro — e agora?", t: "B", cat: "responsabilidade" }, // motor → garagem-manobrista (off-topic)
  { q: "Incêndio na unidade do vizinho danificou meu apartamento", t: "A", cat: "responsabilidade" },
  // Locação
  { q: "Quem paga o condomínio: dono ou inquilino?", t: "A", cat: "locacao" },
  { q: "Inquilino fez bagunça na área comum — quem paga a multa?", t: "A", cat: "locacao" },
  { q: "Dono pode ser responsabilizado pelo inquilino inadimplente?", t: "A", cat: "locacao" },
  { q: "Posso proibir o aluguel por temporada no condomínio?", t: "A", cat: "locacao" },
  { q: "Como fazer o despejo de um inquilino que não paga?", t: "B", cat: "locacao" }, // motor → inadimplencia-quem-responde (aspecto diferente)
  { q: "O locatário pode ter animal de estimação mesmo contra a convenção?", t: "A", cat: "locacao" }, // Fase 34 adicionou animal-locatario-convencao — motor acerta
  { q: "Inquilino saiu sem pagar — o que fazer?", t: "A", cat: "inadimplencia" },
  // Finanças/Gestão
  { q: "Quais são os deveres do síndico?", t: "A", cat: "gestao" },
  { q: "Como calcular o rateio das despesas?", t: "A", cat: "financeiro" },
  { q: "O condomínio é obrigado a ter fundo de reserva?", t: "A", cat: "financeiro" },
  { q: "Como apresentar a prestação de contas?", t: "A", cat: "gestao" },
  { q: "Síndico pode ser destituído sem assembleia?", t: "A", cat: "gestao" },
  { q: "Qual o prazo para apresentar o balancete mensal?", t: "A", cat: "financeiro" },
  { q: "Como fazer cotação de fornecedores no condomínio?", t: "A", cat: "gestao" },
  { q: "Posso mudar de administradora sem assembleia?", t: "A", cat: "gestao" },
  { q: "O síndico pode contratar empresa da família?", t: "A", cat: "gestao" },
  // Fora do escopo
  { q: "Qual a receita de bolo de chocolate?", t: "C" },
  { q: "Como faço para renovar minha CNH?", t: "C" },
  { q: "Quem é o presidente do Brasil?", t: "C" },
  { q: "Como calcular o imposto de renda?", t: "C" },
  { q: "Como funciona a herança de um imóvel?", t: "B" },
  { q: "Qual é a diferença entre condomínio edilício e loteamento?", t: "A", cat: "juridico" },
  { q: "Posso instalar placa solar no meu apartamento?", t: "B", cat: "obras" }, // motor → dano-obra-vizinho (off-topic)
  { q: "Como registrar um condomínio em cartório?", t: "A", cat: "gestao" },
  { q: "O que é IPTU e quem paga no condomínio?", t: "B", cat: "financeiro" }, // motor → inadimplencia-quem-responde (off-topic: IPTU ≠ cota condominial)
];

function AuditSection() {
  const [results, setResults] = useState<AuditResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState<"all" | "pass" | "review" | "fail">("all");

  const runAudit = () => {
    setRunning(true);
    setTimeout(() => {
      const res = AUDIT_CASES.map((c) => auditQuestion(c.q, c.t, c.cat));
      setResults(res);
      setRunning(false);
    }, 10);
  };

  const summary = results ? {
    total: results.length,
    pass: results.filter((r) => r.status === "pass").length,
    review: results.filter((r) => r.status === "review").length,
    fail: results.filter((r) => r.status === "fail").length,
    typeAPass: results.filter((r) => r.expectedType === "A" && r.actualType === "A").length,
    typeATotal: results.filter((r) => r.expectedType === "A").length,
    typeBPass: results.filter((r) => r.expectedType === "B" && r.actualType === "B").length,
    typeBTotal: results.filter((r) => r.expectedType === "B").length,
    typeCPass: results.filter((r) => r.expectedType === "C" && r.actualType === "C").length,
    typeCTotal: results.filter((r) => r.expectedType === "C").length,
  } : null;

  const visible = results ? results.filter((r) => filter === "all" || r.status === filter) : [];

  const statusColor = (s: AuditResult["status"]) =>
    s === "pass" ? "text-sage-700 bg-sage-50 border-sage-200"
    : s === "review" ? "text-amber-700 bg-amber-50 border-amber-200"
    : "text-red-700 bg-red-50 border-red-200";

  const typeLabel = (t: string) =>
    t === "A" ? "Resposta" : t === "B" ? "Fallback" : "Bloqueio";

  return (
    <section className="mt-8 border-t border-navy-100 pt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-navy-400">
            Auditoria do Assistente
          </p>
          <p className="mt-0.5 text-[12px] text-navy-500">
            {AUDIT_CASES.length} perguntas internas · Fase 33
          </p>
        </div>
        <button
          type="button"
          onClick={runAudit}
          disabled={running}
          className="rounded-xl bg-navy-700 px-4 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
        >
          {running ? "Rodando..." : results ? "Rodar novamente" : "Rodar auditoria"}
        </button>
      </div>

      {summary && (
        <>
          {/* Summary grid */}
          <div className="mb-4 grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-sage-200 bg-sage-50 p-3 text-center">
              <p className="text-[20px] font-bold text-sage-700">{summary.pass}</p>
              <p className="text-[10px] font-semibold uppercase text-sage-600">Passou</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center">
              <p className="text-[20px] font-bold text-amber-700">{summary.review}</p>
              <p className="text-[10px] font-semibold uppercase text-amber-600">Revisar</p>
            </div>
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center">
              <p className="text-[20px] font-bold text-red-700">{summary.fail}</p>
              <p className="text-[10px] font-semibold uppercase text-red-600">Falhou</p>
            </div>
          </div>
          {/* Type breakdown */}
          <div className="mb-4 rounded-xl border border-navy-100 bg-white p-3 text-[11.5px] text-navy-600">
            <span className="font-semibold">Recall (A→resposta):</span> {summary.typeAPass}/{summary.typeATotal} ({Math.round((summary.typeAPass / (summary.typeATotal || 1)) * 100)}%)
            {" · "}
            <span className="font-semibold">Fallback contextual (B):</span> {summary.typeBPass}/{summary.typeBTotal} ({Math.round((summary.typeBPass / (summary.typeBTotal || 1)) * 100)}%)
            {" · "}
            <span className="font-semibold">Bloqueio (C):</span> {summary.typeCPass}/{summary.typeCTotal}
          </div>
          {/* Filter */}
          <div className="mb-3 flex gap-1.5">
            {(["all", "pass", "review", "fail"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                  filter === f
                    ? "border-navy-700 bg-navy-700 text-white"
                    : "border-navy-100 bg-white text-navy-500 hover:bg-navy-50"
                }`}
              >
                {f === "all" ? "Todos" : f === "pass" ? "Passou" : f === "review" ? "Revisar" : "Falhou"}
              </button>
            ))}
          </div>
          {/* Results list */}
          <div className="divide-y divide-navy-50 rounded-xl border border-navy-100 bg-white">
            {visible.length === 0 ? (
              <p className="px-4 py-3 text-[12px] text-navy-400">Nenhum resultado para esse filtro.</p>
            ) : visible.map((r, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusColor(r.status)}`}>
                    {r.status === "pass" ? "✓" : r.status === "review" ? "~" : "✗"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-navy-800">{r.question}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10.5px] text-navy-400">
                      <span>Esperado: <strong>{typeLabel(r.expectedType)}</strong></span>
                      <span>Obtido: <strong>{typeLabel(r.actualType)}</strong></span>
                      {r.score > 0 && <span>Score: <strong>{r.score}</strong></span>}
                      {r.matchedId && <span className="font-mono">{r.matchedId}</span>}
                      {r.actualCategory && <span>Cat: {r.actualCategory}</span>}
                    </div>
                    {r.note && (
                      <p className="mt-1 text-[11px] text-amber-600">{r.note}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const authed = useAdminAuth();
  const [data, setData] = useState<Aggregated | null>(null);
  const [source, setSource] = useState<"remote" | "local">("local");

  useEffect(() => {
    if (!authed) return;
    (async () => {
      if (telemetryEnabled) {
        const events = await fetchRecentEvents(2000);
        if (events.length > 0) {
          setData(aggregateRemote(events));
          setSource("remote");
          return;
        }
      }
      setData(aggregateLocal());
      setSource("local");
    })();
  }, [authed]);

  if (authed === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream-50">
        <p className="text-[13px] text-navy-400">Verificando acesso...</p>
      </div>
    );
  }

  if (authed === false) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-cream-50">
        <p className="text-[13px] text-navy-500">Acesso negado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-cream-50 to-cream-100/60 px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-[640px]">
        {/* Header */}
        <div className="mb-6">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.15em] text-navy-400">
            Painel do fundador
          </p>
          <h1 className="mt-1 text-[22px] font-bold text-navy-900">Amigo do Prédio</h1>
          <p className="mt-1 text-[12px] text-navy-400">
            Fonte: {source === "remote" ? "Supabase (dados reais)" : "localStorage (dispositivo atual)"}
          </p>
        </div>

        {!data ? (
          <p className="text-[13px] text-navy-400">Carregando...</p>
        ) : (
          <div className="space-y-6">
            {/* KPIs */}
            <section>
              <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Visão geral
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Stat label="Sessões" value={data.totalSessions} />
                <Stat label="Perguntas" value={data.totalQueries} />
                <Stat label="Fallback" value={data.fallbackRate} sub={`${data.fallbackCount} sem resposta`} />
                <Stat label="Adoção memória" value={data.memoriaAdoption} />
                <Stat label="Checklists abertos" value={data.checklistsStarted} />
              </div>
            </section>

            {/* Top queries */}
            {data.topQueries.length > 0 && (
              <section>
                <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                  Top perguntas respondidas
                </p>
                <div className="divide-y divide-navy-50 rounded-xl border border-navy-100 bg-white">
                  {data.topQueries.map(({ q, count }, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="w-5 text-center text-[11px] font-bold text-navy-300">
                        {i + 1}
                      </span>
                      <p className="flex-1 text-[12.5px] text-navy-800">{q}</p>
                      <span className="text-[11px] font-semibold text-navy-400">{count}×</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Top fallback tokens */}
            {data.topFallbackTokens.length > 0 && (
              <section>
                <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                  Tokens sem resposta (gaps editoriais)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {data.topFallbackTokens.map(({ token, count }) => (
                    <span
                      key={token}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11.5px] text-amber-700"
                    >
                      {token} <span className="font-semibold">{count}</span>
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Habit tier distribution */}
            <section>
              <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                Distribuição de engajamento
              </p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(data.tierDist) as [HabitTier, number][]).map(([tier, count]) => (
                  count > 0 && (
                    <span
                      key={tier}
                      className={`rounded-full px-3 py-1 text-[12px] font-medium ${TIER_COLORS[tier]}`}
                    >
                      {TIER_LABELS[tier]}: {count}
                    </span>
                  )
                ))}
              </div>
            </section>

            {/* Recent remote events */}
            {source === "remote" && data.recentEvents.length > 0 && (
              <section>
                <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                  Eventos recentes
                </p>
                <div className="divide-y divide-navy-50 rounded-xl border border-navy-100 bg-white">
                  {data.recentEvents.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2">
                      <span className="w-32 flex-shrink-0 text-[10px] text-navy-300">
                        {new Date(e.ts).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                      </span>
                      <span className="rounded-full border border-navy-100 bg-navy-50 px-2 py-0.5 text-[10.5px] font-mono text-navy-600">
                        {e.event}
                      </span>
                      <span className="truncate text-[11px] text-navy-400">
                        {Object.entries(e.properties).map(([k, v]) => `${k}:${v}`).join(" · ")}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Export */}
            <section className="border-t border-navy-100 pt-4">
              <button
                type="button"
                onClick={exportTelemetry}
                className="rounded-xl bg-navy-700 px-5 py-2 text-[12.5px] font-semibold text-white transition-colors hover:bg-navy-800 active:scale-95"
              >
                Exportar telemetria local (JSON)
              </button>
            </section>

            <AuditSection />
          </div>
        )}
      </div>
    </div>
  );
}
