"use client";

import { useState } from "react";
import {
  addOcorrencia,
  addPendencia,
  markOcorrenciaMessageGenerated,
  type Ocorrencia,
  type OcorrenciaTipo,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

const TIPO_LABEL: Record<OcorrenciaTipo, string> = {
  barulho: "Barulho",
  vazamento: "Vazamento",
  obra: "Obra",
  inadimplencia: "Inadimplência",
  manutencao: "Manutenção",
  funcionario: "Funcionário",
  "area-comum": "Área comum",
  assembleia: "Assembleia",
  outro: "Outro",
};

const TIPOS = Object.entries(TIPO_LABEL) as Array<[OcorrenciaTipo, string]>;

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
};

function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function categoriaFromTipo(tipo: OcorrenciaTipo): string {
  if (tipo === "obra" || tipo === "vazamento" || tipo === "manutencao") return "manutencao";
  if (tipo === "assembleia") return "assembleias";
  if (tipo === "inadimplencia") return "inadimplencia";
  if (tipo === "funcionario") return "funcionarios";
  if (tipo === "area-comum") return "areas-comuns";
  return "gestao";
}

type Props = {
  onSaved?: () => void;
};

export default function RegistroRapido({ onSaved }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [tipo, setTipo] = useState<OcorrenciaTipo>("barulho");
  const [descricao, setDescricao] = useState("");
  const [local, setLocal] = useState("");
  const [createStep, setCreateStep] = useState(true);
  const [saved, setSaved] = useState<Ocorrencia | null>(null);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setDescricao("");
    setLocal("");
    setCreateStep(true);
    setMessage("");
    setCopied(false);
  };

  const handleSave = () => {
    const cleanDescription = descricao.trim();
    if (!cleanDescription) return;
    const cleanLocal = local.trim();
    const occurrence = addOcorrencia({
      tipo,
      descricao: cleanDescription.slice(0, 240),
      local: cleanLocal ? cleanLocal.slice(0, 80) : undefined,
      hasNextStep: createStep,
    });

    if (createStep) {
      addPendencia({
        titulo: `Acompanhar ${TIPO_LABEL[tipo].toLowerCase()}`,
        categoria: categoriaFromTipo(tipo),
        origem: "ocorrencia",
        matchedId: occurrence.id,
      });
    }

    void trackEvent("ocorrencia_created", {
      tipo,
      has_next_step: createStep,
      has_unit_or_location: Boolean(cleanLocal),
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
    void trackEvent("admin_message_generated", {
      tipo: saved.tipo,
      source: "registro_rapido",
    });
    onSaved?.();
  };

  const handleCopyMessage = async () => {
    if (!saved || !message.trim()) return;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      void trackEvent("admin_message_copied", {
        tipo: saved.tipo,
        source: "registro_rapido",
      });
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
          className="flex w-full items-center gap-2.5 rounded-[18px] border border-navy-100/80 bg-white/78 px-4 py-3 text-left shadow-[0_1px_2px_rgba(31,49,71,0.03)] transition-colors hover:bg-white active:bg-navy-50"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-[14px]" aria-hidden="true">
            +
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-navy-800">Registro rápido</p>
            <p className="text-[11.5px] leading-snug text-navy-400">
              Anote uma situação da rotina e transforme em acompanhamento.
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
              Registro rápido
            </p>
            <p className="mt-0.5 text-[12.5px] leading-snug text-navy-500">
              Registro operacional simples. Não é livro oficial nem protocolo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setExpanded(false);
              setSaved(null);
              resetForm();
            }}
            className="text-[11.5px] text-navy-400 hover:text-navy-600"
          >
            Fechar
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-navy-600" htmlFor="ocorrencia-tipo">
              Tipo
            </label>
            <select
              id="ocorrencia-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as OcorrenciaTipo)}
              className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
            >
              {TIPOS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-navy-600" htmlFor="ocorrencia-descricao">
              Descrição curta
            </label>
            <textarea
              id="ocorrencia-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              maxLength={240}
              rows={3}
              placeholder="Ex: reclamação de barulho recorrente no período da noite"
              className="min-h-20 w-full resize-none rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] leading-relaxed text-navy-800 placeholder:text-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11.5px] font-medium text-navy-600" htmlFor="ocorrencia-local">
              Unidade ou local <span className="font-normal text-navy-300">opcional</span>
            </label>
            <input
              id="ocorrencia-local"
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              maxLength={80}
              placeholder="Ex: bloco B, garagem, área comum"
              className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 placeholder:text-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
            />
          </div>

          <label className="flex items-start gap-2 rounded-xl bg-navy-50/60 px-3 py-2.5">
            <input
              type="checkbox"
              checked={createStep}
              onChange={(e) => setCreateStep(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-navy-200 text-navy-700"
            />
            <span className="text-[12px] leading-relaxed text-navy-600">
              Criar próximo passo para acompanhar esta situação
            </span>
          </label>

          <button
            type="button"
            onClick={handleSave}
            disabled={!descricao.trim()}
            className="inline-flex min-h-10 items-center rounded-xl bg-navy-700 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-navy-800 disabled:bg-navy-200 disabled:text-navy-400"
          >
            Salvar registro
          </button>
        </div>

        {saved && (
          <div className="mt-3 rounded-xl border border-navy-100 bg-navy-50/45 px-3 py-3">
            <p className="text-[12.5px] font-semibold text-navy-700">Registro salvo</p>
            <p className="mt-0.5 text-[11.5px] leading-relaxed text-navy-500">
              A situação entrou no histórico operacional{saved.hasNextStep ? " e nos próximos passos." : "."}
            </p>

            {canGenerateMessage && !message && (
              <button
                type="button"
                onClick={handleGenerateMessage}
                className="mt-2 rounded-full px-3 py-1.5 text-[11.5px] font-medium text-navy-600 transition-colors hover:bg-white"
              >
                Gerar mensagem para moradores
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
                  Modelo administrativo editável. Ajuste conforme a convenção, o regimento interno e a situação concreta.
                </p>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="mt-2 inline-flex min-h-9 items-center rounded-full bg-navy-700 px-4 py-2 text-[12px] font-semibold text-cream-50 transition-colors hover:bg-navy-800"
                >
                  {copied ? "Mensagem copiada" : "Copiar mensagem"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
