"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AnswerResult, KnowledgeEntry, ConfidenceLevel } from "@/lib/data";
import { TOPICS, getConfidenceLabel, getRelatedEntries } from "@/lib/data";
import {
  saveFavorite,
  isFavorited,
  logShare,
  logInteraction,
  getMemoriaOperacional,
  getUpcomingAgendaEvents,
  type MemoriaOperacional,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";
import { APP_URL } from "@/lib/config";
import BrandMark from "@/components/BrandMark";

type ToolAnchor =
  | "comunicado"
  | "comunicado-infracao"
  | "comunicado-obra"
  | "comunicado-convocacao"
  | "comunicado-cobranca"
  | "simulador-multa"
  | "simulador-reajuste"
  | "checklists";

// Mapa categoria → checklist operacional relacionado
const CAT_TO_CHECKLIST: Partial<Record<string, { id: string; title: string; icon: string }>> = {
  assembleias: { id: "assembleia",    title: "Assembleia",            icon: "👥" },
  funcionarios: { id: "admissao",    title: "Admissão de funcionário", icon: "🧹" },
  trabalhista:  { id: "admissao",    title: "Admissão de funcionário", icon: "🧹" },
  manutencao:   { id: "manutencao",  title: "Manutenção preventiva",  icon: "🔨" },
};

// Mapa categoria → comunicado sugerido
const CAT_TO_COMUNICADO: Partial<Record<string, { label: string; icon: string; hint: string; anchor: ToolAnchor }>> = {
  multas:           { label: "Gerar notificação de infração", icon: "!", hint: "Documente antes de aplicar sanção", anchor: "comunicado-infracao" },
  obras:            { label: "Gerar comunicado de obra", icon: "Obra", hint: "Informe os moradores com antecedência", anchor: "comunicado-obra" },
  assembleias:      { label: "Preparar convocação", icon: "Ata", hint: "Gere o texto da convocação", anchor: "comunicado-convocacao" },
  inadimplencia:    { label: "Gerar notificação de cobrança", icon: "R$", hint: "Formalize a comunicação ao condômino", anchor: "comunicado-cobranca" },
  cobranca:         { label: "Gerar notificação de cobrança", icon: "R$", hint: "Formalize a comunicação ao condômino", anchor: "comunicado-cobranca" },
  responsabilidade: { label: "Registrar ocorrência formal", icon: "Doc", hint: "Documente o dano antes de acionar responsáveis", anchor: "comunicado" },
  gestao:           { label: "Gerar comunicado interno", icon: "Doc", hint: "Formalize a decisão por escrito", anchor: "comunicado" },
  manutencao:       { label: "Gerar comunicado de serviço", icon: "Serv", hint: "Informe os moradores sobre a manutenção", anchor: "comunicado" },
  financeiro:       { label: "Simular reajuste de cota", icon: "R$", hint: "Calcule o reajuste antes de propor em assembleia", anchor: "simulador-reajuste" },
};

// Próximo passo por categoria — mostrado quando a entrada KB não tem dica específica
const CAT_TO_NEXTACTION: Partial<Record<string, string>> = {
  multas:           "Documente a ocorrência por escrito com data, hora e testemunhas antes de notificar.",
  obras:            "Solicite ao condômino o tipo de obra, cronograma e, se necessário, documentação técnica antes de qualquer decisão.",
  assembleias:      "Verifique na convenção o prazo mínimo de antecedência para convocação e o quórum exigido para o tema da pauta.",
  inadimplencia:    "Acione a administradora para formalizar a cobrança pelos canais adequados. Evite abordagem direta sem respaldo formal.",
  cobranca:         "Formalize o procedimento de cobrança com a administradora antes de qualquer contato direto com o devedor.",
  responsabilidade: "Solicite vistoria imediata do local do dano e documente com fotos antes de acionar qualquer seguro ou responsável.",
  funcionarios:     "Verifique o contrato, a CCT da sua região e as obrigações legais antes de tomar qualquer decisão sobre o funcionário.",
  trabalhista:      "Consulte o histórico funcional, a CCT da sua região e o contrato vigente antes de qualquer ação disciplinar ou rescisória.",
  lgpd:             "Não publique dados pessoais sem verificar os limites da LGPD e da convenção. Prefira comunicação interna por canais adequados.",
  locacao:          "Verifique a convenção para identificar o que compete ao condomínio versus o que é responsabilidade do locador ou locatário.",
  gestao:           "Documente a decisão em ata ou comunicado antes de comunicar aos condôminos.",
  convencao:        "Alterações de convenção geralmente exigem quórum qualificado (2/3 dos condôminos). Consulte os requisitos antes de convocar.",
  financeiro:       "Levante os números de arrecadação e despesa dos últimos 3 meses antes de propor qualquer reajuste de cota em assembleia.",
  "areas-comuns":   "Verifique na convenção e no regulamento interno o que diz sobre uso, responsabilidade e autorização para modificações nessa área.",
  manutencao:       "Registre a data do serviço, o responsável e o laudo (quando exigido) para manter o histórico e proteger o condomínio em caso de questionamento.",
};

const RELATED_QUESTION_PROMPTS: Partial<Record<string, string[]>> = {
  multas: [
    "Como formalizar uma advertência?",
    "Quando a multa precisa de assembleia?",
  ],
  obras: [
    "Quando exigir ART/RRT?",
    "Como comunicar obra aos moradores?",
  ],
  inadimplencia: [
    "Pode expor nome de inadimplente?",
    "Quando iniciar cobrança judicial?",
  ],
  cobranca: [
    "Pode expor nome de inadimplente?",
    "Quando iniciar cobrança judicial?",
  ],
  assembleias: [
    "Como convocar assembleia corretamente?",
    "O que fazer em caso de empate?",
  ],
};

type LocalContextNotice = {
  contextType: "avcb" | "seguro" | "mandato" | "manutencao" | "barulho" | "agenda";
  text: string;
};

const MANUTENCAO_MEMORIA_FIELDS: Array<keyof MemoriaOperacional> = [
  "ultimaDedetizacao",
  "ultimaLimpezaCaixaDAgua",
  "ultimaManutencaoElevador",
  "ultimaInspecaoExtintores",
  "ultimaVistoriaSPDA",
  "ultimaVistoriaEletrica",
];

function daysUntil(dateValue?: string): number | null {
  if (!dateValue) return null;
  const target = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function formatDueText(label: string, dateValue?: string): string | null {
  const days = daysUntil(dateValue);
  if (days === null) return null;
  if (days < 0) return `${label} registrado no app já passou do vencimento.`;
  if (days === 0) return `${label} registrado no app vence hoje.`;
  if (days === 1) return `${label} registrado no app vence em 1 dia.`;
  return `${label} registrado no app vence em ${days} dias.`;
}

function entryHasAny(entry: KnowledgeEntry, terms: string[]): boolean {
  const haystack = `${entry.id} ${entry.categoria} ${entry.pergunta} ${entry.resposta} ${entry.contexto} ${entry.keywords.join(" ")}`.toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

function hasMaintenanceMemory(memoria: MemoriaOperacional): boolean {
  return MANUTENCAO_MEMORIA_FIELDS.some((field) => Boolean(memoria[field]));
}

function getLocalContextNotice(entry: KnowledgeEntry): LocalContextNotice | null {
  const memoria = getMemoriaOperacional();

  if (entryHasAny(entry, ["seguro", "apólice", "apolice", "sinistro"]) && memoria.vencimentoSeguro) {
    const dueText = formatDueText("O seguro", memoria.vencimentoSeguro);
    return {
      contextType: "seguro",
      text: dueText
        ? `${dueText} Aproveite para revisar cobertura contra incêndio, danos elétricos e responsabilidade civil.`
        : "Como o seguro do prédio está registrado no app, vale conferir a renovação antes do vencimento.",
    };
  }

  if (entryHasAny(entry, ["avcb", "bombeiros", "incêndio", "incendio"]) && memoria.vencimentoAVCB) {
    const dueText = formatDueText("O AVCB", memoria.vencimentoAVCB);
    return {
      contextType: "avcb",
      text: dueText
        ? `${dueText} Se estiver perto do vencimento, trate a renovação como prioridade operacional.`
        : "O AVCB já está cadastrado no monitoramento do prédio. Se estiver perto do vencimento, priorize a renovação.",
    };
  }

  if ((entry.categoria === "assembleias" || entryHasAny(entry, ["mandato", "eleição", "eleicao", "síndico", "sindico"])) && memoria.fimMandatoSindico) {
    return {
      contextType: "mandato",
      text: "Como o fim do mandato está cadastrado, verifique se há tempo suficiente para convocação da assembleia.",
    };
  }

  if (entry.categoria === "manutencao" && hasMaintenanceMemory(memoria)) {
    return {
      contextType: "manutencao",
      text: "Use as datas cadastradas no monitoramento para conferir se essa manutenção está dentro do prazo.",
    };
  }

  // Agenda — manutenção/rotina: só mostrar se houver eventos futuros relevantes
  const isManuTema =
    entry.categoria === "manutencao" ||
    entryHasAny(entry, ["dedetizacao", "dedetização", "extintor", "elevador", "spda", "vistoria"]);
  if (isManuTema) {
    const agendaManu = getUpcomingAgendaEvents(90).filter((e) =>
      ["manutencao", "dedetizacao", "caixa_agua", "extintores", "vistoria"].includes(e.type)
    );
    if (agendaManu.length > 0) {
      return {
        contextType: "agenda",
        text: "Há itens futuros na Agenda do Prédio relacionados à rotina do condomínio. Confira a agenda para acompanhar os próximos compromissos.",
      };
    }
  }

  // Agenda — assembleia: só mostrar se houver evento futuro do tipo
  const isAssembleiaTema =
    entry.categoria === "assembleias" ||
    entryHasAny(entry, ["assembleia", "eleicao", "eleição", "reuniao", "reunião"]);
  if (isAssembleiaTema) {
    const agendaAsm = getUpcomingAgendaEvents(90).filter((e) =>
      ["assembleia", "reuniao"].includes(e.type)
    );
    if (agendaAsm.length > 0) {
      return {
        contextType: "agenda",
        text: "Há compromisso futuro registrado na Agenda do Prédio. Confira a agenda antes de tomar próximos passos sobre assembleia.",
      };
    }
  }

  // Barulho/ocorrência: sugestão de registro, sem dados locais
  if (entryHasAny(entry, ["barulho", "reclamacao", "reclamação", "perturbacao", "perturbação", "vizinho", "morador"])) {
    return {
      contextType: "barulho",
      text: "Se esta situação precisar de acompanhamento, registre como ocorrência e crie um próximo passo para não perder o histórico.",
    };
  }

  return null;
}

// Aviso jurídico específico por categoria sensível — aparece antes do disclaimer geral
const SENSITIVE_CATEGORY_NOTICE: Partial<Record<string, string>> = {
  lgpd:        "As informações acima são orientativas. Em situações que envolvam dados pessoais, imagens, câmeras ou exposição de moradores, vale validar o caso concreto com orientação especializada.",
  trabalhista: "As informações acima são orientativas. Em decisões sobre funcionários, jornada, advertência, dispensa ou encargos, confirme a regra aplicável com a administradora, contador ou profissional especializado.",
  financeiro:  "As informações acima são orientativas. Antes de deliberações sobre cobrança, reajuste, taxa extra ou orçamento, valide os números e procedimentos com a administradora ou contador responsável.",
};

// Rótulos em português para o chip "Tema identificado"
const CATEGORY_LABELS_PT: Record<string, string> = {
  multas: "Multas e advertências",
  obras: "Obras e reformas",
  assembleias: "Assembleias",
  inadimplencia: "Inadimplência",
  cobranca: "Cobrança",
  funcionarios: "Funcionários",
  trabalhista: "Direitos trabalhistas",
  convencao: "Convenção e regimento",
  locacao: "Locação e inquilinos",
  lgpd: "Dados e privacidade",
  responsabilidade: "Danos e responsabilidade",
  gestao: "Gestão condominial",
  financeiro: "Finanças e rateio",
  "areas-comuns": "Áreas comuns",
  manutencao: "Manutenção",
  juridico: "Aspectos jurídicos",
};

// Ícone por categoria — aparece nos cards de sugestão do fallback
const CATEGORIA_ICONS: Record<string, string> = {
  multas: "⚖️",
  obras: "🔨",
  assembleias: "👥",
  inadimplencia: "💰",
  funcionarios: "🧹",
  convencao: "📜",
  financeiro: "💼",
  gestao: "🏛️",
  trabalhista: "📋",
  "areas-comuns": "🏘️",
  lgpd: "🔒",
  juridico: "📄",
  locacao: "🏠",
  responsabilidade: "🛡️",
  cobranca: "💳",
};

// Mensagens fixas exibidas em sequência durante o carregamento
const LOADING_MESSAGES = [
  "Consultando a base...",
  "Preparando a orientação...",
];

function openWhatsAppShare(url: string, isStandalone: boolean) {
  if (isStandalone) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  const opened = window.open(
    url,
    "_blank",
    "noopener,noreferrer,width=480,height=720"
  );

  if (!opened) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

type ResponseProps = {
  question: string;
  answerResult: AnswerResult | null;
  isLoading: boolean;
  onRetry: () => void;
  onSuggestionSelect?: (q: string) => void;
  onFavorite?: () => void;
  onNewQuestion?: () => void;
  onNavigateToChecklist?: (checklistId: string) => void;
  onNavigateToFerramentas?: (anchor?: ToolAnchor) => void;
  onSavePendencia?: (titulo: string, categoria: string, matchedId: string) => void;
};

export default function Response({
  question,
  answerResult,
  isLoading,
  onRetry,
  onSuggestionSelect,
  onFavorite,
  onNewQuestion,
  onNavigateToChecklist,
  onNavigateToFerramentas,
  onSavePendencia,
}: ResponseProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [savedPendenciaId, setSavedPendenciaId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const localContextTrackedRef = useRef<string | null>(null);

  const entry: KnowledgeEntry | null = answerResult?.matched ?? null;
  const isDefault = answerResult?.isDefault ?? false;
  const score = answerResult?.score ?? 0;
  const suggestions = answerResult?.suggestions ?? [];
  const related = entry ? getRelatedEntries(entry.categoria, entry.id, 2) : [];
  const relatedPrompts = entry ? (RELATED_QUESTION_PROMPTS[entry.categoria] ?? []) : [];
  const localContextNotice = useMemo(
    () => (entry && !isDefault ? getLocalContextNotice(entry) : null),
    [entry, isDefault],
  );
  const detectedCategory = answerResult?.detectedCategory ?? null;
  const contextualFallback = answerResult?.contextualFallback ?? null;
  // Para o fallback com categoria detectada, exibe mensagem contextual em vez do texto genérico
  const answer = (isDefault && contextualFallback) ? contextualFallback : (answerResult?.text ?? "");

  // Exibe texto completo imediatamente — elimina percepção de truncamento no mobile
  useEffect(() => {
    if (isLoading || !answer) {
      setDisplayedText("");
      return;
    }

    setDisplayedText(answer);
    setCopied(false);
    setLiked(entry ? isFavorited(entry.id) : false);
    setShowToast(false);
    setSavedPendenciaId(null);
  }, [answer, isLoading]);

  // Scroll suave até a resposta quando ela aparece
  useEffect(() => {
    if ((isLoading || answer) && containerRef.current) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [isLoading, answer]);

  useEffect(() => {
    if (!entry || !localContextNotice) return;
    const trackingKey = `${entry.id}:${localContextNotice.contextType}`;
    if (localContextTrackedRef.current === trackingKey) return;
    localContextTrackedRef.current = trackingKey;
    void trackEvent("local_context_notice_shown", {
      categoria: entry.categoria,
      context_type: localContextNotice.contextType,
      has_memoria: true,
    });
  }, [entry, localContextNotice?.contextType]);

  const handleCopy = async () => {
    if (!answer) return;
    try {
      await navigator.clipboard.writeText(answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard indisponível (contexto não-seguro ou permissão negada)
    }
  };

  const handleLike = () => {
    if (liked || !entry) return;
    setLiked(true);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
    saveFavorite({ q: question, matchedId: entry.id, categoria: entry.categoria, resposta: entry.resposta });
    onFavorite?.();
  };

  const handleShare = async () => {
    if (!answer) return;
    const linkLine = APP_URL ? `\n${APP_URL}` : "";
    const text = `Amigo do Prédio\nOrientação condominial\n\nPergunta: ${question}\n\n${answer}\n\nOrientação informativa. Não substitui análise da administradora ou assessoria especializada.${linkLine}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Amigo do Prédio",
          text,
        });
      } else {
        openWhatsAppShare(whatsappUrl, isStandalone);
      }
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") return;
      openWhatsAppShare(whatsappUrl, isStandalone);
    }

    logShare({ q: question, matchedId: entry?.id ?? null, categoria: entry?.categoria ?? null });
    void trackEvent("whatsapp_shared", { matched_id: entry?.id ?? null });
  };

  if (!isLoading && !answerResult) return null;

  const confidence = getConfidenceLabel(score, isDefault);

  const renderRelated = (className = "") => {
    if (related.length === 0) return null;

    return (
      <div className={className}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
          Veja também
        </p>
        <div className="space-y-1.5">
          {related.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                logInteraction("veja-tambem", r.id);
                onSuggestionSelect?.(r.pergunta);
              }}
              className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-left text-[12.5px] leading-snug text-navy-700 transition-all duration-150 hover:border-navy-200 hover:bg-navy-50 active:scale-[0.99]"
            >
              <span className="min-w-0 flex-1">{r.pergunta}</span>
              <svg
                className="h-3.5 w-3.5 flex-shrink-0 text-navy-300"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <section
        ref={containerRef}
        className="px-5 pb-8 sm:px-6 sm:pb-8 animate-fade-in-up"
        aria-live="polite"
      >
        {/* Pergunta do usuário */}
        {question && (
          <div className="mb-3 flex justify-end">
            <div className="max-w-[88%] rounded-2xl rounded-tr-md bg-navy-800 px-4 py-2.5 text-[14px] text-cream-50 shadow-sm sm:text-[14.5px]">
              {question}
            </div>
          </div>
        )}

        {/* Resposta do assistente */}
        <div className="flex gap-2.5">
          {/* Avatar */}
          <BrandMark className="mt-0.5 h-8 w-8 flex-shrink-0 shadow-sm" rounded="rounded-[10px]" />

          <div className="flex-1">
            {/* Cabeçalho: nome + badge de confiança */}
            <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[12px] font-semibold text-navy-700">
                Amigo do Prédio
              </span>
              {!isLoading && (
                <>
                  <span className="text-[10.5px] text-navy-400">respondeu</span>
                  <ConfidenceBadge level={confidence.level} label={confidence.label} />
                </>
              )}
            </div>

            {/* Card principal */}
            <div className="rounded-[20px] rounded-tl-md border border-cream-200/90 bg-white/94 px-4 py-3.5 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_14px_28px_-24px_rgba(31,49,71,0.28)]">
              {isLoading ? (
                <TypingIndicator />
              ) : (
                <>
                  {/* Texto da resposta principal */}
                  <p
                    className={`animate-fade-in text-[15px] leading-[1.7] sm:text-[15.5px] ${
                      isDefault ? "text-navy-500" : "font-medium text-navy-900"
                    }`}
                  >
                    {displayedText}
                  </p>

                  {/* Blocos auxiliares — contexto, base legal, próximo passo */}
                  {!isDefault && entry && (
                    <div className="mt-5 border-t border-navy-100/60 pt-4 animate-fade-in space-y-3">
                      {/* Próximo passo — ação imediata antes do contexto jurídico */}
                      {CAT_TO_NEXTACTION[entry.categoria] && (
                        <div className="rounded-r-lg border-l-[2.5px] border-navy-500 bg-navy-100/40 py-2.5 pl-3 pr-3">
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <NextStepIcon />
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-600">
                              Próximo passo
                            </p>
                          </div>
                          <p className="text-[14px] leading-relaxed text-navy-700">
                            {CAT_TO_NEXTACTION[entry.categoria]}
                          </p>
                          {onSavePendencia && (
                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                disabled={savedPendenciaId === entry.id}
                                onClick={() => {
                                  if (savedPendenciaId === entry.id) return;
                                  setSavedPendenciaId(entry.id);
                                  onSavePendencia(
                                    CAT_TO_NEXTACTION[entry.categoria]!,
                                    entry.categoria,
                                    entry.id,
                                  );
                                }}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                                  savedPendenciaId === entry.id
                                    ? "cursor-default text-navy-400"
                                    : "text-navy-500 hover:bg-navy-200/60 hover:text-navy-700"
                                }`}
                              >
                                {savedPendenciaId === entry.id ? "Salvo ✓" : "Salvar nos próximos passos"}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Contexto local — usa apenas dados já cadastrados no app */}
                      {localContextNotice && (
                        <div className="rounded-r-lg border-l-[2.5px] border-navy-300 bg-navy-50/70 py-2.5 pl-3 pr-3">
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <InfoIcon className="text-navy-500" />
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-500">
                              Contexto do prédio
                            </p>
                          </div>
                          <p className="text-[14px] leading-relaxed text-navy-700">
                            {localContextNotice.text}
                          </p>
                        </div>
                      )}

                      {/* Base legal */}
                      <div className="rounded-r-lg border-l-[2.5px] border-navy-200 bg-navy-50/60 py-2.5 pl-3 pr-3">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <BookIcon />
                          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                            Base legal
                          </p>
                        </div>
                        <p className="text-[14px] leading-relaxed text-navy-600">
                          {entry.contexto}
                        </p>
                      </div>

                      {/* Dica prática */}
                      {entry.dica && (
                        <div className="rounded-r-lg border-l-[2.5px] border-terracotta-200 bg-terracotta-50/60 py-2.5 pl-3 pr-3">
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <LightbulbIcon />
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-terracotta-600">
                              Dica prática
                            </p>
                          </div>
                          <p className="text-[14px] leading-relaxed text-navy-700">
                            {entry.dica}
                          </p>
                        </div>
                      )}

                      {/* Veja também — entradas relacionadas da mesma categoria */}
                      {renderRelated("")}

                      {relatedPrompts.length > 0 && (
                        <div>
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                            Perguntas relacionadas
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {relatedPrompts.map((prompt) => (
                              <button
                                key={prompt}
                                type="button"
                                onClick={() => onSuggestionSelect?.(prompt)}
                                className="rounded-full border border-navy-100 bg-white px-3 py-1.5 text-left text-[12px] font-medium text-navy-600 transition-colors hover:border-navy-200 hover:bg-navy-50 active:bg-navy-100"
                              >
                                {prompt}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Checklist operacional recomendado — ponte entre Q&A e ferramentas */}
                      {(() => {
                        const cl = CAT_TO_CHECKLIST[entry.categoria];
                        if (!cl) return null;
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              logInteraction("checklist-cta", cl.id);
                              onNavigateToChecklist?.(cl.id);
                            }}
                            className="flex w-full items-center gap-3 rounded-xl border border-navy-100 bg-navy-50/50 px-3 py-2.5 text-left transition-colors hover:bg-navy-50 active:bg-navy-100"
                          >
                            <span className="text-[17px] leading-none" aria-hidden="true">{cl.icon}</span>
                            <div className="flex-1">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-500">
                                Checklist operacional
                              </p>
                              <p className="text-[12.5px] font-medium text-navy-800">{cl.title}</p>
                            </div>
                            <span className="flex-shrink-0 text-[11.5px] font-semibold text-navy-500">
                              Abrir →
                            </span>
                          </button>
                        );
                      })()}

                      {/* CTA de comunicado — ponte entre orientação e documento */}
                      {(() => {
                        const cm = CAT_TO_COMUNICADO[entry.categoria];
                        if (!cm || !onNavigateToFerramentas) return null;
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              logInteraction("comunicado-cta", entry.categoria);
                              onNavigateToFerramentas(cm.anchor);
                            }}
                            className="flex w-full items-center gap-3 rounded-xl border border-navy-100 bg-navy-50/40 px-3 py-2.5 text-left transition-colors hover:bg-navy-50 active:bg-navy-100"
                          >
                            <span className="text-[17px] leading-none" aria-hidden="true">{cm.icon}</span>
                            <div className="flex-1">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-navy-400">
                                {cm.hint}
                              </p>
                              <p className="text-[12.5px] font-medium text-navy-800">{cm.label}</p>
                            </div>
                            <span className="flex-shrink-0 text-[11.5px] font-semibold text-navy-500">
                              Abrir →
                            </span>
                          </button>
                        );
                      })()}

                      {/* Aviso regional CCT — entradas de qualquer categoria baseadas na CCT SECOVI-Rio */}
                      {entry.contexto.toLowerCase().includes("cct") && (
                        <div className="rounded-r-lg border-l-[2.5px] border-amber-300 bg-amber-50/80 py-2.5 pl-3 pr-3">
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <InfoIcon className="text-amber-500" />
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-600">
                              Aviso regional
                            </p>
                          </div>
                          <p className="text-[14px] leading-relaxed text-amber-700">
                            Os valores trabalhistas citados seguem a CCT SECOVI-Rio (Rio de Janeiro). Se o seu condomínio está em outro estado, consulte a CCT local — salários e benefícios variam por região.
                          </p>
                        </div>
                      )}

                      {/* Aviso de categoria sensível — lgpd, trabalhista, financeiro */}
                      {SENSITIVE_CATEGORY_NOTICE[entry.categoria] && (
                        <div className="rounded-lg bg-navy-50/50 px-3 py-2.5">
                          <div className="flex items-start gap-2">
                            <InfoIcon className="text-navy-500" />
                            <p className="text-[12.5px] leading-relaxed text-navy-500">
                              {SENSITIVE_CATEGORY_NOTICE[entry.categoria]}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Aviso jurídico */}
                      <div className="flex items-start gap-2 border-t border-navy-100/80 pt-3">
                        <InfoIcon className="text-navy-400" />
                        <p className="text-[13px] leading-relaxed text-navy-400">
                          Esta orientação é informativa e serve como apoio administrativo ao síndico. Situações específicas podem exigir análise da administradora, assessoria jurídica ou profissional responsável.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Fallback — categorias navegáveis + sugestões contextuais */}
                  {isDefault && (
                    <div className="mt-4 animate-fade-in space-y-5">
                      {/* Chip de tema identificado */}
                      {detectedCategory && (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-navy-100 bg-navy-50/70 px-2.5 py-1 text-[10.5px] font-medium text-navy-600">
                            <svg className="h-3 w-3 flex-shrink-0" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                              <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.2" />
                              <path d="M8 8l2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                            </svg>
                            Tema provável: {CATEGORY_LABELS_PT[detectedCategory] ?? detectedCategory}
                          </span>
                        </div>
                      )}

                      {/* Chips de categoria */}
                      <div>
                        <p className="mb-2 text-[12.5px] leading-relaxed text-navy-500">
                          Tente reformular com outras palavras, ou escolha um tema abaixo:
                        </p>
                        <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-navy-400">
                          Pergunte sobre
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {TOPICS.slice(0, 6).map((topic) => (
                            <button
                              key={topic.id}
                              type="button"
                              onClick={() => onSuggestionSelect?.(topic.examplePrompt)}
                              className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-navy-100 bg-white px-3 py-2 text-[12px] font-medium text-navy-700 shadow-sm transition-all duration-150 hover:border-navy-300 hover:bg-navy-50 hover:shadow-md active:scale-95"
                            >
                              <span aria-hidden="true" className="text-[13px]">
                                {topic.icon}
                              </span>
                              {topic.title}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Cards de sugestão contextual */}
                      {suggestions.length > 0 && (
                        <div>
                          <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-navy-400">
                            {detectedCategory ? "Orientações próximas:" : "Talvez você esteja procurando:"}
                          </p>
                          <div className="space-y-2">
                            {suggestions.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  void trackEvent("assistant_suggestion_clicked", { suggestion_id: s.id, categoria: s.categoria });
                                  onSuggestionSelect?.(s.pergunta);
                                }}
                                className="group flex w-full items-center gap-3 rounded-2xl border border-navy-100 bg-white p-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-[0_4px_16px_-6px_rgba(31,49,71,0.15)] active:scale-[0.99]"
                              >
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-navy-50 text-[15px] transition-colors duration-200 group-hover:bg-cream-100">
                                  {CATEGORIA_ICONS[s.categoria] ?? "📋"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[13px] font-medium leading-snug text-navy-800">
                                    {s.pergunta}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-navy-400">
                                    Toque para perguntar
                                  </p>
                                </div>
                                <svg
                                  className="h-4 w-4 flex-shrink-0 text-navy-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-navy-400"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M6 4l4 4-4 4"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-2 border-t border-navy-100/80 pt-3">
                        <InfoIcon className="text-navy-300" />
                        <div>
                          <p className="text-[13px] leading-relaxed text-navy-400">
                            Não encontrei uma orientação específica para essa situação na base atual. Use a resposta como ponto de partida e, se envolver risco jurídico, financeiro, trabalhista ou técnico, confirme com profissional habilitado.
                          </p>
                          <ul className="mt-2 space-y-1 text-[12px] text-navy-400">
                            <li>· Reformule a pergunta com outras palavras</li>
                            <li>· Registre a situação como ocorrência no app</li>
                            <li>· Crie um próximo passo para acompanhar</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Ações rápidas — copiar e útil só para respostas encontradas */}
            {!isLoading && (
              <div className="mt-3 flex flex-wrap gap-1.5 animate-fade-in">
                {!isDefault && (
                  <>
                    <ActionPill
                      icon={liked ? "✓" : "+"}
                      label={liked ? "Salvo!" : "Salvar"}
                      onClick={handleLike}
                      active={liked}
                    />
                    <ActionPill
                      icon={copied ? "✓" : "□"}
                      label={copied ? "Copiado!" : "Copiar"}
                      onClick={handleCopy}
                      active={copied}
                    />
                    <ActionPill
                      icon="WA"
                      label="Compartilhar"
                      onClick={handleShare}
                    />
                  </>
                )}
                <ActionPill icon="↻" label="Refazer" onClick={onRetry} />
                {onNewQuestion && (
                  <div className="ml-auto">
                    <ActionPill icon="+" label="Nova pergunta" onClick={onNewQuestion} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Toast de feedback — aparece na base da tela após clicar "Útil" */}
      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 animate-fade-in"
        >
          <div className="flex items-center gap-2 rounded-full bg-navy-900 px-5 py-2.5 text-[13px] font-medium text-cream-50 shadow-xl ring-1 ring-white/10">
            <svg
              className="h-3.5 w-3.5 text-terracotta-300"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 8l3.5 3.5L13 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Pergunta salva nos favoritos!
          </div>
        </div>
      )}
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function TypingIndicator() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    setMsgIdx(0);
    const id = setTimeout(() => setMsgIdx(1), 1200);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex items-center gap-2.5 py-1">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-blink rounded-full bg-navy-300"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-[12.5px] text-navy-400">
        {LOADING_MESSAGES[msgIdx]}
      </span>
    </div>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${className ?? "text-navy-400"}`}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5v3.5M8 11v.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg
      className="h-3 w-3 flex-shrink-0 text-navy-400"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <rect x="1.5" y="1" width="7.5" height="10" rx="0.8" stroke="currentColor" strokeWidth="1.1" />
      <path d="M3.5 4h4M3.5 6h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function NextStepIcon() {
  return (
    <svg
      className="h-3 w-3 flex-shrink-0 text-navy-500"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg
      className="h-3 w-3 flex-shrink-0 text-terracotta-500"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 1a3.5 3.5 0 0 1 2.2 6.2c-.3.25-.7.8-.7 1.3H4.5c0-.5-.4-1.05-.7-1.3A3.5 3.5 0 0 1 6 1z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path d="M4.5 9.5h3M5 11h2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

type ConfidenceBadgeProps = {
  level: ConfidenceLevel;
  label: string;
};

function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  if (level === "none") return null;

  return (
    <span className="rounded-full border border-navy-100 bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-500">
      Resposta direta da base
    </span>
  );
}

type ActionPillProps = {
  icon: string;
  label: string;
  onClick?: () => void;
  active?: boolean;
};

function ActionPill({ icon, label, onClick, active }: ActionPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1 rounded-full border px-3 py-2 text-[12px] transition-all duration-150 active:scale-95 ${
        active
          ? "border-terracotta-200 bg-terracotta-50 text-terracotta-700"
          : "border-navy-100 bg-white text-navy-500 hover:border-navy-200 hover:bg-navy-50"
      }`}
    >
      <span aria-hidden="true" className="text-[10px]">
        {icon}
      </span>
      {label}
    </button>
  );
}
