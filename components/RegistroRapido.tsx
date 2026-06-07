"use client";

import { useState } from "react";
import {
  addOcorrencia,
  addPendencia,
  markOcorrenciaMessageGenerated,
  type Ocorrencia,
  type OcorrenciaTipo,
  type OcorrenciaPrioridade,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

const TIPO_LABEL: Record<OcorrenciaTipo, string> = {
  barulho:      "Barulho",
  vazamento:    "Vazamento",
  obra:         "Obra",
  inadimplencia:"Inadimplência",
  manutencao:   "Manutenção",
  funcionario:  "Funcionário",
  "area-comum": "Área comum",
  assembleia:   "Assembleia",
  briga:        "Briga/Conflito",
  vistoria:     "Vistoria",
  reclamacao:   "Reclamação",
  lembrete:     "Lembrete",
  outro:        "Outro",
};

const PRIORIDADE_LABEL: Record<OcorrenciaPrioridade, string> = {
  alta:  "Alta",
  media: "Média",
  baixa: "Baixa",
};

const PRIORIDADE_COLOR: Record<OcorrenciaPrioridade, string> = {
  alta:  "bg-terracotta-50 text-terracotta-700 ring-terracotta-200",
  media: "bg-amber-50 text-amber-700 ring-amber-200",
  baixa: "bg-navy-50 text-navy-600 ring-navy-100",
};

const MESSAGE_BY_TYPE: Partial<Record<OcorrenciaTipo, string>> = {
  barulho:
    "Prezados moradores, reforçamos a importância de respeitar os horários de silêncio e evitar ruídos que possam prejudicar o descanso dos demais. Contamos com a colaboração de todos para manter a boa convivência no condomínio.",
  obra:
    "Prezados moradores, lembramos que obras e reformas devem respeitar os horários permitidos e as regras internas do condomínio. Pedimos a colaboração de todos para reduzir incômodos e manter a organização das áreas comuns.",
  vazamento:
    "Prezados moradores, informamos que a administração está acompanhando uma situação de vazamento/infiltração. Pedimos atenção a sinais de umidade e colaboração no acesso às áreas necessárias para verificação.",
  manutencao:
    "Prezados moradores, será necessário acompanhar uma manutenção no condomínio. Pedimos a colaboração de todos durante o serviço e informaremos qualquer impacto na rotina das áreas comuns.",
  "area-comum":
    "Prezados moradores, reforçamos a importância de utilizar as áreas comuns com cuidado, respeito às regras internas e atenção à boa convivência entre todos.",
  assembleia:
    "Prezados moradores, lembramos a importância de acompanhar os comunicados sobre assembleias e participar das decisões que envolvem a rotina do condomínio.",
  briga:
    "Prezados moradores, reforçamos que a boa convivência no condomínio depende do respeito mútuo. Em caso de situações de conflito, a administração está à disposição para mediar.",
  reclamacao:
    "Prezados moradores, a administração tomou conhecimento de uma situação e está acompanhando. Agradecemos a comunicação e reforçamos o compromisso com a qualidade de vida de todos.",
};

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function categoriaFromTipo(tipo: OcorrenciaTipo): string {
  if (tipo === "obra" || tipo === "vazamento" || tipo === "manutencao" || tipo === "vistoria") return "manutencao";
  if (tipo === "assembleia") return "assembleias";
  if (tipo === "inadimplencia") return "inadimplencia";
  if (tipo === "funcionario") return "funcionarios";
  if (tipo === "area-comum") return "areas-comuns";
  return "gestao";
}

type Props = {
  onSaved?: () => void;
};

// Tipos frequentes exibidos na primeira linha; os demais ficam ocultos até expandir
const TIPOS_FREQUENTES: OcorrenciaTipo[] = ["barulho", "vazamento", "manutencao", "obra", "area-comum", "reclamacao"];
const TIPOS_OUTROS: OcorrenciaTipo[] = ["inadimplencia", "funcionario", "assembleia", "briga", "vistoria", "lembrete", "outro"];

export default function RegistroRapido({ onSaved }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [tipo, setTipo] = useState<OcorrenciaTipo>("barulho");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");
  const [prioridade, setPrioridade] = useState<OcorrenciaPrioridade>("media");
  const [proximo, setProximo] = useState("");
  const [link, setLink] = useState("");
  const [createStep, setCreateStep] = useState(true);
  const [saved, setSaved] = useState<Ocorrencia | null>(null);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showMoreTipos, setShowMoreTipos] = useState(false);

  const resetForm = () => {
    setTitulo(""); setDescricao(""); setLocal(""); setProximo(""); setLink("");
    setPrioridade("media"); setCreateStep(true); setMessage(""); setCopied(false);
    setShowAdvanced(false); setShowMoreTipos(false); setTipo("barulho");
  };

  const canSave = descricao.trim().length > 0 || titulo.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    // Use tipo label as description when user left it blank (tipo-only quick register)
    const cleanDescription = descricao.trim() || TIPO_LABEL[tipo];
    const occurrence = addOcorrencia({
      titulo: titulo.trim() || undefined,
      tipo,
      descricao: cleanDescription.slice(0, 400),
      local: local.trim() ? local.trim().slice(0, 80) : undefined,
      prioridade,
      proximo: proximo.trim() ? proximo.trim().slice(0, 160) : undefined,
      link: link.trim() ? link.trim() : undefined,
      hasNextStep: createStep,
    });

    if (createStep) {
      const pendTitulo = titulo.trim()
        ? `Acompanhar: ${titulo.trim().slice(0, 60)}`
        : `Acompanhar ${TIPO_LABEL[tipo].toLowerCase()}`;
      addPendencia({
        titulo: pendTitulo,
        categoria: categoriaFromTipo(tipo),
        origem: "ocorrencia",
        matchedId: occurrence.id,
      });
    }

    void trackEvent("ocorrencia_created", {
      tipo,
      prioridade,
      has_titulo: Boolean(titulo.trim()),
      has_proximo: Boolean(proximo.trim()),
      has_link: Boolean(link.trim()),
      has_next_step: createStep,
      source: "registro_rapido",
      month_key: monthKey(),
    });

    setSaved(occurrence);
    resetForm();
    onSaved?.();
  };

  const handleGenerateMessage = () => {
    if (!saved) return;
    const generated = MESSAGE_BY_TYPE[saved.tipo];
    if (!generated) return;
    setMessage(generated);
    markOcorrenciaMessageGenerated(saved.id);
    onSaved?.();
  };

  const handleCopyMessage = async () => {
    if (!message.trim()) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const canGenerateMessage = saved ? Boolean(MESSAGE_BY_TYPE[saved.tipo]) : false;

  if (!expanded) {
    return (
      <section className="px-5 pb-3 sm:px-6">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-2.5 rounded-[18px] border border-navy-100/80 bg-white/[0.78] px-4 py-3 text-left shadow-[0_1px_2px_rgba(31,49,71,0.03)] transition-colors hover:bg-white active:bg-navy-50"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[14px]" aria-hidden="true">
            +
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-navy-800">Registro de ocorrência</p>
            <p className="text-[11.5px] leading-snug text-navy-400">
              Registre situações, conflitos, vistorias e lembretes da rotina.
            </p>
          </div>
          <span className="text-[11.5px] font-semibold text-navy-500">Registrar</span>
        </button>
      </section>
    );
  }

  return (
    <section className="px-5 pb-3 sm:px-6">
      <div className="animate-fade-in-up rounded-[18px] border border-navy-100/80 bg-white/90 px-4 py-3.5 shadow-[0_1px_2px_rgba(31,49,71,0.04),0_4px_16px_-8px_rgba(31,49,71,0.10)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.10em] text-navy-400">
              Registro de ocorrência
            </p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-navy-500">
              Diário operacional. Não é livro oficial nem protocolo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setExpanded(false); setSaved(null); resetForm(); }}
            className="text-[11.5px] text-navy-400 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        <div className="space-y-3">

          {/* Tipo — chips compactos (sem select) */}
          <div>
            <p className="mb-1.5 text-[11.5px] font-medium text-navy-600">Tipo</p>
            <div className="flex flex-wrap gap-1.5">
              {TIPOS_FREQUENTES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`min-h-[36px] rounded-full px-3 py-1 text-[11.5px] font-medium ring-1 transition-all active:scale-95 ${
                    tipo === t
                      ? "bg-navy-700 text-white ring-navy-700"
                      : "bg-white text-navy-600 ring-navy-200 hover:ring-navy-300"
                  }`}
                >
                  {TIPO_LABEL[t]}
                </button>
              ))}
              {!showMoreTipos && (
                <button
                  type="button"
                  onClick={() => setShowMoreTipos(true)}
                  className="min-h-[36px] rounded-full px-3 py-1 text-[11.5px] text-navy-400 ring-1 ring-navy-100 hover:ring-navy-200"
                >
                  Mais ↓
                </button>
              )}
              {showMoreTipos && TIPOS_OUTROS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`min-h-[36px] rounded-full px-3 py-1 text-[11.5px] font-medium ring-1 transition-all active:scale-95 ${
                    tipo === t
                      ? "bg-navy-700 text-white ring-navy-700"
                      : "bg-white text-navy-600 ring-navy-200 hover:ring-navy-300"
                  }`}
                >
                  {TIPO_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {/* O que aconteceu? */}
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-navy-600" htmlFor="ocorrencia-descricao">
              O que aconteceu? <span className="font-normal text-navy-400">opcional</span>
            </label>
            <textarea
              id="ocorrencia-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={400}
              rows={2}
              placeholder="Breve relato — não precisa ser formal. Ex: morador do 301 reclamou do barulho do 302."
              className="min-h-[72px] w-full resize-none rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] leading-relaxed text-navy-800 placeholder:text-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
            />
          </div>

          {/* Prioridade */}
          <div>
            <p className="mb-1 text-[11.5px] font-medium text-navy-600">Prioridade</p>
            <div className="flex gap-2">
              {(["alta", "media", "baixa"] as OcorrenciaPrioridade[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPrioridade(p)}
                  className={`min-h-[44px] flex-1 rounded-xl border py-1.5 text-[11.5px] font-medium ring-1 transition-all active:scale-95 ${
                    prioridade === p
                      ? "border-navy-600 bg-navy-700 text-white ring-navy-700"
                      : `${PRIORIDADE_COLOR[p]} ring-current`
                  }`}
                >
                  {PRIORIDADE_LABEL[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Campos avançados */}
          {!showAdvanced && (
            <button
              type="button"
              onClick={() => setShowAdvanced(true)}
              className="text-[11.5px] text-navy-400 hover:text-navy-600"
            >
              + Unidade, título e próxima ação
            </button>
          )}
          {showAdvanced && (
            <>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-navy-600" htmlFor="ocorrencia-local">
                  Unidade ou local <span className="font-normal text-navy-400">opcional</span>
                </label>
                <input
                  id="ocorrencia-local"
                  type="text"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  maxLength={80}
                  placeholder="Ex: Apto 301, garagem, área comum"
                  autoComplete="off"
                  className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 placeholder:text-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-navy-600" htmlFor="ocorrencia-titulo">
                  Título <span className="font-normal text-navy-400">opcional</span>
                </label>
                <input
                  id="ocorrencia-titulo"
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  maxLength={80}
                  placeholder="Ex: Barulho no 3º andar após 22h"
                  autoComplete="off"
                  className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 placeholder:text-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-navy-600" htmlFor="ocorrencia-proximo">
                  Próxima ação <span className="font-normal text-navy-400">opcional</span>
                </label>
                <input
                  id="ocorrencia-proximo"
                  type="text"
                  value={proximo}
                  onChange={(e) => setProximo(e.target.value)}
                  maxLength={160}
                  placeholder="Ex: Ligar para o morador do 302 amanhã"
                  autoComplete="off"
                  className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 placeholder:text-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11.5px] font-medium text-navy-600" htmlFor="ocorrencia-link">
                  Link ou referência <span className="font-normal text-navy-400">opcional</span>
                </label>
                <input
                  id="ocorrencia-link"
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  maxLength={200}
                  placeholder="Ex: https://... ou 'E-mail de 28/05'"
                  autoComplete="off"
                  className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 placeholder:text-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
                />
              </div>
            </>
          )}

          <label className="flex items-start gap-2 rounded-xl bg-navy-50/60 px-3 py-2.5">
            <input
              type="checkbox"
              checked={createStep}
              onChange={(e) => setCreateStep(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-navy-200 text-navy-700"
            />
            <span className="text-[12px] leading-relaxed text-navy-600">
              Criar próximo passo para acompanhar
            </span>
          </label>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex min-h-[44px] items-center rounded-xl bg-navy-700 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-navy-800 disabled:bg-navy-200 disabled:text-navy-400"
          >
            Registrar ocorrência
          </button>
        </div>

        {saved && (
          <div className="mt-3 rounded-xl border border-navy-100 bg-navy-50/45 px-3 py-3">
            <p className="text-[12.5px] font-semibold text-navy-700">Registro salvo</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-navy-500">
              {saved.titulo ? `"${saved.titulo}" — ` : ""}{TIPO_LABEL[saved.tipo]}{saved.hasNextStep ? " · próximo passo criado" : ""}
            </p>

            {canGenerateMessage && !message && (
              <button
                type="button"
                onClick={handleGenerateMessage}
                className="mt-2 rounded-full px-3 py-1.5 text-[11.5px] font-medium text-navy-600 transition-colors hover:bg-white"
              >
                Gerar comunicado para moradores
              </button>
            )}

            {message && (
              <div className="mt-3">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-xl border border-navy-100 bg-white px-3 py-2 text-[12.5px] leading-relaxed text-navy-700 focus:border-navy-300 focus:outline-none"
                />
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-navy-400">
                  Modelo editável. Ajuste conforme a convenção e a situação concreta.
                </p>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="mt-2 inline-flex min-h-9 items-center rounded-full bg-navy-700 px-4 py-2 text-[12px] font-semibold text-cream-50 transition-colors hover:bg-navy-800"
                >
                  {copied ? "Copiado!" : "Copiar comunicado"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
