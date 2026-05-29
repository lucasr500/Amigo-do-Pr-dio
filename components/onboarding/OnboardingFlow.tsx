"use client";

import { useState } from "react";
import {
  saveProfile,
  saveMemoriaOperacional,
  saveMemoriaAssistida,
  getMemoriaAssistida,
  markFirstRunComplete,
  saveImplantacaoMode,
  addPendencia,
  type CondominioProfile,
  type MemoriaOperacional,
  type MemoriaAssistida,
  type ImplantacaoMode,
} from "@/lib/session";

// ── Tipos internos ────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3 | 4;

type ProfileDraft = {
  nomeCondominio: string;
  tipoSindico: CondominioProfile["tipoSindico"] | undefined;
  hasElevador: boolean | undefined;
};

type MemoriaDraft = {
  vencimentoAVCB: string;
  vencimentoSeguro: string;
  fimMandatoSindico: string;
};

type NaoSeiDraft = {
  vencimentoAVCB: boolean;
  vencimentoSeguro: boolean;
  fimMandatoSindico: boolean;
};

type Props = {
  onComplete: () => void;
};

// ── Plano de implantação para síndico novo ────────────────────────────────────

const PLANO_NOVO_SINDICO: Array<{ titulo: string; categoria: string; dueOffset: number }> = [
  { titulo: "Localizar a ata de eleição do síndico", categoria: "gestao", dueOffset: 7 },
  { titulo: "Confirmar data do fim do mandato", categoria: "gestao", dueOffset: 7 },
  { titulo: "Localizar a apólice do seguro predial", categoria: "gestao", dueOffset: 7 },
  { titulo: "Verificar situação do AVCB / CLCB", categoria: "gestao", dueOffset: 7 },
  { titulo: "Identificar contratos essenciais vigentes", categoria: "gestao", dueOffset: 7 },
  { titulo: "Mapear pendências urgentes com administradora", categoria: "gestao", dueOffset: 7 },
  { titulo: "Revisar convenção e regimento interno", categoria: "convencao", dueOffset: 15 },
  { titulo: "Confirmar calendário de assembleias", categoria: "assembleias", dueOffset: 15 },
  { titulo: "Mapear funcionários e situação de férias", categoria: "funcionarios", dueOffset: 15 },
  { titulo: "Revisar manutenção de elevador, extintores e caixa d'água", categoria: "manutencao", dueOffset: 15 },
  { titulo: "Organizar documentos essenciais do condomínio", categoria: "gestao", dueOffset: 15 },
  { titulo: "Consolidar agenda anual de eventos e manutenções", categoria: "gestao", dueOffset: 30 },
  { titulo: "Revisar inadimplência e rotinas financeiras básicas", categoria: "financeiro", dueOffset: 30 },
  { titulo: "Concluir checklist de implantação do Amigo do Prédio", categoria: "gestao", dueOffset: 30 },
];

function gerarPendenciasNovoSindico(): void {
  const hoje = new Date();
  PLANO_NOVO_SINDICO.forEach(({ titulo, categoria, dueOffset }) => {
    const due = new Date(hoje);
    due.setDate(due.getDate() + dueOffset);
    addPendencia({
      titulo,
      categoria,
      origem: "assistente_preenchimento",
      dueDate: due.toISOString().slice(0, 10),
    });
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function countFilledDates(m: MemoriaDraft): number {
  return [m.vencimentoAVCB, m.vencimentoSeguro, m.fimMandatoSindico].filter(Boolean).length;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [implantacaoMode, setImplantacaoMode] = useState<ImplantacaoMode | null>(null);
  const [profile, setProfile] = useState<ProfileDraft>({
    nomeCondominio: "",
    tipoSindico: undefined,
    hasElevador: undefined,
  });
  const [memoria, setMemoria] = useState<MemoriaDraft>({
    vencimentoAVCB: "",
    vencimentoSeguro: "",
    fimMandatoSindico: "",
  });
  const [naoSei, setNaoSei] = useState<NaoSeiDraft>({
    vencimentoAVCB: false,
    vencimentoSeguro: false,
    fimMandatoSindico: false,
  });

  const selectMode = (mode: ImplantacaoMode) => {
    setImplantacaoMode(mode);
    setStep(1);
  };

  const finish = () => {
    const profilePayload: CondominioProfile = {};
    if (profile.nomeCondominio.trim()) profilePayload.nomeCondominio = profile.nomeCondominio.trim();
    if (profile.tipoSindico !== undefined) profilePayload.tipoSindico = profile.tipoSindico;
    if (profile.hasElevador !== undefined) profilePayload.hasElevador = profile.hasElevador;
    if (Object.keys(profilePayload).length > 0) saveProfile(profilePayload);

    const memoriaPayload: MemoriaOperacional = {};
    if (memoria.vencimentoAVCB) memoriaPayload.vencimentoAVCB = memoria.vencimentoAVCB;
    if (memoria.vencimentoSeguro) memoriaPayload.vencimentoSeguro = memoria.vencimentoSeguro;
    if (memoria.fimMandatoSindico) memoriaPayload.fimMandatoSindico = memoria.fimMandatoSindico;
    if (Object.keys(memoriaPayload).length > 0) saveMemoriaOperacional(memoriaPayload);

    // Também persiste em MemoriaAssistida para que health score e notificações
    // vejam os dados pelo caminho assistido (status="filled" ou "to_discover").
    const now = new Date().toISOString();
    const existing = getMemoriaAssistida();
    const assistidaPayload: MemoriaAssistida = { ...existing };
    if (memoria.vencimentoAVCB) {
      assistidaPayload.avcb = { value: memoria.vencimentoAVCB, precision: "exact", status: "filled", updatedAt: now };
    } else if (naoSei.vencimentoAVCB) {
      assistidaPayload.avcb = { precision: "unknown", status: "to_discover", updatedAt: now };
    }
    if (memoria.vencimentoSeguro) {
      assistidaPayload.seguro = { value: memoria.vencimentoSeguro, precision: "exact", status: "filled", updatedAt: now };
    } else if (naoSei.vencimentoSeguro) {
      assistidaPayload.seguro = { precision: "unknown", status: "to_discover", updatedAt: now };
    }
    if (memoria.fimMandatoSindico) {
      assistidaPayload.mandato = { value: memoria.fimMandatoSindico, precision: "exact", status: "filled", updatedAt: now };
    } else if (naoSei.fimMandatoSindico) {
      assistidaPayload.mandato = { precision: "unknown", status: "to_discover", updatedAt: now };
    }
    saveMemoriaAssistida(assistidaPayload);

    if (implantacaoMode) saveImplantacaoMode(implantacaoMode);
    if (implantacaoMode === "new_sindico") gerarPendenciasNovoSindico();

    markFirstRunComplete();
    onComplete();
  };

  const skip = () => {
    if (implantacaoMode) saveImplantacaoMode(implantacaoMode);
    markFirstRunComplete();
    onComplete();
  };

  // ── Shared chip group ─────────────────────────────────────────────────────

  function ChipGroup<T extends string | boolean>({
    options,
    value,
    onChange,
  }: {
    options: { label: string; value: T }[];
    value: T | undefined;
    onChange: (v: T) => void;
  }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium ring-1 transition-all active:scale-95 ${
                selected
                  ? "bg-navy-700 text-white ring-navy-700"
                  : "bg-white text-navy-700 ring-navy-200 hover:ring-navy-300"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  // ── Progress dots ─────────────────────────────────────────────────────────

  const ProgressDots = () => (
    <div className="flex items-center gap-1.5" aria-label={`Etapa ${step} de 4`}>
      {([1, 2, 3, 4] as Array<1 | 2 | 3 | 4>).map((s) => (
        <span
          key={s}
          className={`rounded-full transition-all ${
            s === step
              ? "h-2 w-5 bg-navy-700"
              : s < step
              ? "h-2 w-2 bg-navy-300"
              : "h-2 w-2 bg-navy-100"
          }`}
        />
      ))}
    </div>
  );

  const SkipLink = ({ label = "Pular" }: { label?: string }) => (
    <button
      type="button"
      onClick={skip}
      className="text-[11.5px] text-navy-400 transition-colors hover:text-navy-600"
    >
      {label}
    </button>
  );

  // ── Step 0 — Escolha do modo ─────────────────────────────────────────────

  if (step === 0) {
    return (
      <Overlay>
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-navy-100">
          <svg className="h-4 w-4 text-navy-700" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 2v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="font-display text-[22px] font-semibold leading-snug text-navy-800">
          Qual é a sua situação?
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-navy-500">
          O app se adapta para ajudar melhor conforme o seu contexto.
        </p>

        <div className="mt-5 space-y-2.5">
          <button
            type="button"
            onClick={() => selectMode("existing")}
            className="flex w-full items-start gap-3 rounded-[16px] border border-navy-100 bg-white px-4 py-3.5 text-left transition-all hover:border-navy-300 hover:bg-navy-50 active:scale-[0.98]"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[12px]">📋</span>
            <div>
              <p className="text-[13px] font-semibold text-navy-800">Já acompanho este condomínio</p>
              <p className="mt-0.5 text-[11.5px] text-navy-500">Tenho dados parciais e quero organizar melhor.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => selectMode("new_sindico")}
            className="flex w-full items-start gap-3 rounded-[16px] border border-terracotta-200 bg-terracotta-50/60 px-4 py-3.5 text-left transition-all hover:border-terracotta-300 hover:bg-terracotta-50 active:scale-[0.98]"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta-100 text-[12px]">🏗️</span>
            <div>
              <p className="text-[13px] font-semibold text-navy-800">Assumi o prédio agora</p>
              <p className="mt-0.5 text-[11.5px] text-navy-500">Sou novo síndico e ainda preciso levantar todas as informações.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => selectMode("organizing")}
            className="flex w-full items-start gap-3 rounded-[16px] border border-navy-100 bg-white px-4 py-3.5 text-left transition-all hover:border-navy-300 hover:bg-navy-50 active:scale-[0.98]"
          >
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-100 text-[12px]">📁</span>
            <div>
              <p className="text-[13px] font-semibold text-navy-800">Estou organizando dados antigos</p>
              <p className="mt-0.5 text-[11.5px] text-navy-500">Tenho documentos e histórico para registrar e organizar.</p>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={skip}
          className="mt-4 w-full text-center text-[11.5px] text-navy-400 hover:text-navy-600"
        >
          Pular e explorar o app
        </button>
      </Overlay>
    );
  }

  // ── Step 1 — Boas-vindas ──────────────────────────────────────────────────

  if (step === 1) {
    const isNewSindico = implantacaoMode === "new_sindico";
    return (
      <Overlay>
        <ProgressDots />
        <div className="mt-5 mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-400">
            Amigo do Prédio
          </p>
          {isNewSindico ? (
            <>
              <h2 className="mt-2 font-display text-[24px] font-semibold leading-snug text-navy-800">
                Vamos organizar o seu prédio juntos.
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-navy-600">
                Não precisa saber tudo agora. O app vai te ajudar a levantar as informações, descobrir o que precisa de atenção e criar um plano para os primeiros 30 dias.
              </p>
            </>
          ) : (
            <>
              <h2 className="mt-2 font-display text-[24px] font-semibold leading-snug text-navy-800">
                Veja o que exige atenção no seu prédio.
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-navy-600">
                Cadastre as datas essenciais e o app organiza alertas, pendências e saúde operacional — sem depender só da memória.
              </p>
            </>
          )}
        </div>
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-navy-700 px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.98]"
          >
            {isNewSindico ? "Começar o levantamento" : "Configurar alertas do prédio"}
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <SkipLink label="Explorar primeiro" />
        </div>
      </Overlay>
    );
  }

  // ── Step 2 — Perfil básico ────────────────────────────────────────────────

  if (step === 2) {
    return (
      <Overlay>
        <ProgressDots />
        <div className="mt-4 mb-5">
          <p className="text-[13px] font-semibold text-navy-800">Seu condomínio</p>
          <p className="mt-0.5 text-[11.5px] text-navy-400">Todos os campos são opcionais.</p>
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-1.5 text-[12px] font-medium text-navy-500">Nome do condomínio</p>
            <input
              type="text"
              value={profile.nomeCondominio}
              onChange={(e) => setProfile((p) => ({ ...p, nomeCondominio: e.target.value }))}
              placeholder="Ex: Residencial das Flores"
              maxLength={80}
              className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 placeholder-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
            />
          </div>

          <div>
            <p className="mb-1.5 text-[12px] font-medium text-navy-500">Tipo de síndico</p>
            <ChipGroup
              options={[
                { label: "Morador", value: "morador" as const },
                { label: "Profissional", value: "profissional" as const },
              ]}
              value={profile.tipoSindico}
              onChange={(v) => setProfile((p) => ({ ...p, tipoSindico: v }))}
            />
          </div>

          <div>
            <p className="mb-1.5 text-[12px] font-medium text-navy-500">Possui elevador?</p>
            <ChipGroup
              options={[
                { label: "Sim", value: true as const },
                { label: "Não", value: false as const },
              ]}
              value={profile.hasElevador}
              onChange={(v) => setProfile((p) => ({ ...p, hasElevador: v }))}
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setStep(3)}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-navy-700 px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.98]"
          >
            Continuar
          </button>
          <SkipLink />
        </div>
      </Overlay>
    );
  }

  // ── Step 3 — Datas importantes ────────────────────────────────────────────

  if (step === 3) {
    const isNewSindico = implantacaoMode === "new_sindico";
    const filledNow = countFilledDates(memoria);

    const toggleNaoSei = (field: keyof NaoSeiDraft) => {
      setNaoSei((prev) => ({ ...prev, [field]: !prev[field] }));
      // Limpa o valor da data ao marcar "não sei"
      if (!naoSei[field]) setMemoria((m) => ({ ...m, [field]: "" }));
    };

    type DateFieldProps = {
      field: keyof NaoSeiDraft & keyof MemoriaDraft;
      label: string;
      hint: string;
      confirmLabel: string;
    };

    const DateField = ({ field, label, hint, confirmLabel }: DateFieldProps) => {
      const filled = !!memoria[field];
      const unknown = naoSei[field];
      return (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[12px] font-medium text-navy-500">{label}</p>
            <button
              type="button"
              onClick={() => toggleNaoSei(field)}
              className={`min-h-[36px] rounded-full px-3 py-1.5 text-[10.5px] font-medium ring-1 transition-all active:scale-95 ${
                unknown
                  ? "bg-navy-100 text-navy-700 ring-navy-200"
                  : "bg-white text-navy-400 ring-navy-150 hover:ring-navy-300"
              }`}
            >
              {unknown ? "Informar data" : "Não sei"}
            </button>
          </div>
          {unknown ? (
            <div className="flex items-center gap-2 rounded-xl border border-navy-100 bg-navy-50/60 px-3 py-2.5">
              <span className="text-[11px] text-navy-500">Anotado. O app vai te lembrar de descobrir esta data.</span>
            </div>
          ) : (
            <>
              <p className="mb-1.5 text-[11px] leading-relaxed text-navy-400">{hint}</p>
              <input
                type="date"
                value={memoria[field]}
                onChange={(e) => setMemoria((m) => ({ ...m, [field]: e.target.value }))}
                className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
              />
              {filled && (
                <p className="mt-1 text-[10.5px] font-medium text-emerald-600">
                  ✓ {confirmLabel}
                </p>
              )}
            </>
          )}
        </div>
      );
    };

    return (
      <Overlay>
        <ProgressDots />
        <div className="mt-4 mb-4">
          <div className="flex items-baseline justify-between">
            <p className="text-[13px] font-semibold text-navy-800">Datas essenciais do prédio</p>
            {filledNow > 0 && (
              <span className="text-[10.5px] font-medium text-emerald-600">{filledNow} de 3 ativado{filledNow > 1 ? "s" : ""}</span>
            )}
          </div>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-navy-400">
            {isNewSindico
              ? "Preencha o que já sabe. Clique em “Não sei” para o que não tiver agora."
              : "Cadastre pelo menos uma data para ativar os alertas. Complete o resto depois, em Meu prédio."}
          </p>
        </div>

        <div className="space-y-3.5">
          <DateField
            field="vencimentoAVCB"
            label="Vencimento do AVCB"
            hint="Exigência legal. O app avisa quando o prazo se aproximar."
            confirmLabel="Monitoramento de AVCB ativado"
          />
          <DateField
            field="vencimentoSeguro"
            label="Vencimento do Seguro predial"
            hint="Obrigatório por lei. Cobre incêndio, raio e explosão."
            confirmLabel="Monitoramento do seguro ativado"
          />
          <DateField
            field="fimMandatoSindico"
            label="Fim do mandato do síndico"
            hint="O app avisa para organizar a assembleia com antecedência."
            confirmLabel="Monitoramento de mandato ativado"
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setStep(4)}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-navy-700 px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.98]"
          >
            {filledNow > 0 ? "Continuar" : "Continuar assim mesmo"}
          </button>
          {filledNow === 0 && !Object.values(naoSei).some(Boolean) && (
            <button
              type="button"
              onClick={() => setStep(4)}
              className="text-[11.5px] text-navy-400 transition-colors hover:text-navy-600"
            >
              Pular
            </button>
          )}
        </div>
      </Overlay>
    );
  }

  // ── Step 4 — Resumo ───────────────────────────────────────────────────────

  const filledDates = countFilledDates(memoria);
  const hasName = profile.nomeCondominio.trim().length > 0;
  const isNewSindico = implantacaoMode === "new_sindico";

  return (
    <Overlay>
      <ProgressDots />
      <div className="mt-4 mb-5">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-navy-100">
          <svg className="h-4 w-4 text-navy-700" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-[13px] font-semibold text-navy-800">
          {isNewSindico
            ? "Plano de implantação criado."
            : filledDates > 0 ? "Monitoramento ativado." : hasName ? "Tudo configurado." : "Pronto para explorar."}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
          {isNewSindico ? (
            <>
              {hasName && <span>{profile.nomeCondominio.trim()} · </span>}
              O app criou um plano de 30 dias nos Próximos passos com as informações que você precisa levantar. Comece por onde for mais fácil.
            </>
          ) : filledDates > 0 ? (
            <>
              {hasName && <span>{profile.nomeCondominio.trim()} · </span>}
              O app já pode calcular a saúde operacional e destacar prazos que exigem atenção.
            </>
          ) : (
            "Os alertas do prédio aparecem quando as datas essenciais forem cadastradas. Você pode fazer isso a qualquer momento em Meu prédio."
          )}
        </p>
      </div>

      {isNewSindico && (
        <div className="mb-4 rounded-xl border border-terracotta-200/60 bg-terracotta-50/60 px-3 py-3">
          <p className="text-[11.5px] font-semibold text-navy-700">Seu plano de implantação</p>
          <p className="mt-1 text-[11px] leading-relaxed text-navy-600">
            Criamos tarefas para os primeiros 7, 15 e 30 dias. Acesse em <span className="font-medium">Próximos passos</span> e vá resolvendo no seu ritmo.
          </p>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-navy-100/60 bg-navy-50/50 px-3 py-2.5">
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 text-[9px] text-navy-600">
          ✓
        </span>
        <p className="text-[12px] font-medium text-navy-700">Dados salvos neste dispositivo</p>
      </div>

      <button
        type="button"
        onClick={finish}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-navy-700 px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.98]"
      >
        {isNewSindico ? "Ver meu plano de implantação" : filledDates > 0 ? "Ir para meu painel" : "Explorar mesmo assim"}
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <p className="mt-3 text-center text-[10.5px] text-navy-400">
        Para preservar os dados ao trocar de dispositivo, use{" "}
        <span className="font-medium text-navy-500">&ldquo;Exportar dados&rdquo;</span> em Meu prédio.
      </p>
    </Overlay>
  );
}

// ── Overlay wrapper ───────────────────────────────────────────────────────────

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-navy-900/55 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="Configuração inicial"
    >
      <div className="w-full max-w-[440px] overflow-y-auto rounded-t-[28px] bg-[#F7F1E8] px-5 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-6 shadow-[0_-4px_32px_rgba(31,49,71,0.18)] sm:rounded-[28px] sm:pb-6">
        {children}
      </div>
    </div>
  );
}
