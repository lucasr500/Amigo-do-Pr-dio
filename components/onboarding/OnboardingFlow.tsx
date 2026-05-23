"use client";

import { useState } from "react";
import {
  saveProfile,
  saveMemoriaOperacional,
  markFirstRunComplete,
  type CondominioProfile,
  type MemoriaOperacional,
} from "@/lib/session";

// ── Tipos internos ────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

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

type Props = {
  onComplete: () => void;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function countFilledDates(m: MemoriaDraft): number {
  return [m.vencimentoAVCB, m.vencimentoSeguro, m.fimMandatoSindico].filter(Boolean).length;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState<Step>(1);
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

  // Salva o que foi preenchido e encerra o flow
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

    markFirstRunComplete();
    onComplete();
  };

  // Pula sem salvar dados parciais, mas marca onboarding como visto
  const skip = () => {
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
      {([1, 2, 3, 4] as Step[]).map((s) => (
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

  // ── Skip link ─────────────────────────────────────────────────────────────

  const SkipLink = ({ label = "Pular" }: { label?: string }) => (
    <button
      type="button"
      onClick={skip}
      className="text-[11.5px] text-navy-400 transition-colors hover:text-navy-600"
    >
      {label}
    </button>
  );

  // ── Step 1 — Boas-vindas ──────────────────────────────────────────────────

  if (step === 1) {
    return (
      <Overlay>
        <ProgressDots />
        <div className="mt-5 mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy-400">
            Amigo do Prédio
          </p>
          <h2 className="mt-2 font-display text-[24px] font-semibold leading-snug text-navy-800">
            Bem-vindo ao Amigo do Prédio.
          </h2>
          <p className="mt-3 text-[13.5px] leading-relaxed text-navy-600">
            Organize a rotina do seu condomínio: vencimentos, pendências, comunicados e orientações práticas — tudo em um lugar só.
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-navy-400">
            Em 2 minutos o monitoramento está ativo.
          </p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setStep(2)}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-navy-700 px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.98]"
          >
            Começar
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <SkipLink label="Pular configuração" />
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
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-navy-700 px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.98]"
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
    return (
      <Overlay>
        <ProgressDots />
        <div className="mt-4 mb-5">
          <p className="text-[13px] font-semibold text-navy-800">Datas importantes</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-navy-400">
            Registre para ativar alertas automáticos. Pode preencher depois em Minha Conta.
          </p>
        </div>

        <div className="space-y-3.5">
          <div>
            <p className="mb-1 text-[12px] font-medium text-navy-500">Vencimento do AVCB</p>
            <p className="mb-1.5 text-[11px] text-navy-400">Auto de Vistoria do Corpo de Bombeiros</p>
            <input
              type="date"
              value={memoria.vencimentoAVCB}
              onChange={(e) => setMemoria((m) => ({ ...m, vencimentoAVCB: e.target.value }))}
              className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
            />
          </div>

          <div>
            <p className="mb-1 text-[12px] font-medium text-navy-500">Vencimento do Seguro</p>
            <p className="mb-1.5 text-[11px] text-navy-400">Seguro condominial obrigatório</p>
            <input
              type="date"
              value={memoria.vencimentoSeguro}
              onChange={(e) => setMemoria((m) => ({ ...m, vencimentoSeguro: e.target.value }))}
              className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
            />
          </div>

          <div>
            <p className="mb-1 text-[12px] font-medium text-navy-500">Fim do mandato do síndico</p>
            <p className="mb-1.5 text-[11px] text-navy-400">Quando termina o mandato atual</p>
            <input
              type="date"
              value={memoria.fimMandatoSindico}
              onChange={(e) => setMemoria((m) => ({ ...m, fimMandatoSindico: e.target.value }))}
              className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setStep(4)}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded-full bg-navy-700 px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.98]"
          >
            Continuar
          </button>
          <button
            type="button"
            onClick={() => setStep(4)}
            className="text-[11.5px] text-navy-400 transition-colors hover:text-navy-600"
          >
            Pular etapa
          </button>
        </div>
      </Overlay>
    );
  }

  // ── Step 4 — Resumo ───────────────────────────────────────────────────────

  const filledDates = countFilledDates(memoria);
  const hasName = profile.nomeCondominio.trim().length > 0;

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
          {hasName || filledDates > 0 ? "Tudo configurado." : "Pronto para começar."}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-navy-500">
          {hasName && <span>{profile.nomeCondominio.trim()} · </span>}
          {filledDates > 0
            ? `${filledDates} data${filledDates > 1 ? "s" : ""} registrada${filledDates > 1 ? "s" : ""}.`
            : "Dados mínimos configurados."}
        </p>
      </div>

      {/* Status de armazenamento */}
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-navy-100/60 bg-navy-50/50 px-3 py-2.5">
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 text-[9px] text-navy-600">
          ✓
        </span>
        <p className="text-[12px] font-medium text-navy-700">Dados salvos neste dispositivo</p>
      </div>

      {/* CTA de conta — neutro, não funcional */}
      <div className="mb-5 rounded-xl border border-navy-100/40 bg-white/60 px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.10em] text-navy-300">Sincronização em nuvem</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-navy-400">
          Em breve será possível criar uma conta para sincronizar os dados entre dispositivos. Por enquanto, use o backup local em Minha Conta.
        </p>
      </div>

      <button
        type="button"
        onClick={finish}
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-navy-700 px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.98]"
      >
        Ir para o app
        <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
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
