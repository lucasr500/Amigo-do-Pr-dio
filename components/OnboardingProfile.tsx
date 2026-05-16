"use client";

import { useEffect, useRef, useState } from "react";
import {
  getProfile,
  saveProfile,
  CondominioProfile,
  getUsageStats,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

type Props = {
  onProfileSaved?: () => void;
  onSetupMemoria?: () => void;
  forceShow?: boolean;
};

type ViewState = "hidden" | "collapsed" | "collapsed-existing" | "expanded" | "bridge" | "updated";

export default function OnboardingProfile({ onProfileSaved, onSetupMemoria, forceShow }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<ViewState>("hidden");
  const [draft, setDraft] = useState<CondominioProfile>({});
  // Indica se o perfil já existia ao montar — distingue edição de criação
  const isEditRef = useRef(false);

  useEffect(() => {
    const profile = getProfile();
    const stats = getUsageStats();
    if (forceShow) {
      if (profile) {
        setDraft(profile);
        isEditRef.current = true;
        setView("collapsed-existing");
      } else {
        setView("collapsed");
      }
    } else if (!profile && stats.totalCount >= 1) {
      setView("collapsed");
    }
    setHydrated(true);
  }, [forceShow]);

  if (!hydrated || view === "hidden") return null;

  const set = <K extends keyof CondominioProfile>(
    field: K,
    value: CondominioProfile[K]
  ) => setDraft((prev) => ({ ...prev, [field]: value }));

  const save = () => {
    saveProfile(draft);
    void trackEvent("onboarding_completed");
    if (isEditRef.current) {
      // Edição de perfil existente — feedback breve e volta ao collapsed
      setView("updated");
      setTimeout(() => {
        setView("collapsed-existing");
        onProfileSaved?.();
      }, 1400);
    } else {
      // Novo perfil — bridge para ativar memória
      setView("bridge");
    }
  };

  const handleSetupMemoria = () => {
    setView("hidden");
    onProfileSaved?.();
    onSetupMemoria?.();
  };

  const handleSkipMemoria = () => {
    setView("hidden");
    onProfileSaved?.();
  };

  // ── Bridge: guia para o próximo passo ──────────────────────────────────────
  if (view === "bridge") {
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <div className="rounded-2xl border border-sage-200 bg-sage-50/60 p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <span
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sage-100 text-[11px]"
              aria-hidden="true"
            >
              ✓
            </span>
            <p className="text-[13px] font-semibold text-sage-800">
              Condomínio configurado
            </p>
          </div>

          <p className="text-[12.5px] leading-relaxed text-navy-700">
            Agora registre as principais datas do seu prédio — como vencimento do
            seguro e última manutenção — para ativar o monitoramento inteligente.
          </p>

          <p className="mt-1.5 text-[11px] text-navy-500">
            Quanto mais o Amigo do Prédio conhece o seu prédio, melhor consegue
            te orientar.
          </p>

          <div className="mt-3.5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSetupMemoria}
              className="inline-flex items-center gap-1.5 rounded-full bg-sage-600 px-4 py-1.5 text-[12px] font-medium text-white transition-all hover:bg-sage-700 active:scale-[0.97]"
            >
              Registrar datas do prédio
              <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleSkipMemoria}
              className="text-[11.5px] text-navy-400 transition-colors hover:text-navy-600"
            >
              Fazer depois
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ── Updated: feedback após edição de perfil existente ─────────────────────
  if (view === "updated") {
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <div className="flex items-center gap-2.5 rounded-xl border border-sage-200 bg-sage-50/60 px-4 py-2.5">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sage-100 text-[11px]" aria-hidden="true">
            ✓
          </span>
          <p className="text-[12.5px] font-medium text-sage-800">Perfil atualizado</p>
        </div>
      </section>
    );
  }

  // ── Collapsed-existing: perfil salvo — mostra resumo e botão editar ────────
  if (view === "collapsed-existing") {
    const profileName = draft.nomeCondominio;
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <button
          type="button"
          onClick={() => setView("expanded")}
          className="flex w-full items-center gap-2.5 rounded-xl border border-navy-100 bg-white/70 px-4 py-2.5 text-left transition-colors hover:bg-white active:bg-navy-50"
        >
          <span
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sage-100 text-[11px]"
            aria-hidden="true"
          >
            ✓
          </span>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[12.5px] font-medium text-navy-800">
              {profileName ?? "Condomínio configurado"}
            </p>
            <p className="text-[11.5px] text-navy-400">
              Toque para editar o perfil
            </p>
          </div>
          <span className="flex-shrink-0 text-[11px] font-semibold text-navy-500">
            Editar →
          </span>
        </button>
      </section>
    );
  }

  // ── Collapsed: botão de entrada (perfil ainda não criado) ─────────────────
  if (view === "collapsed") {
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <button
          type="button"
          onClick={() => { setView("expanded"); void trackEvent("onboarding_started"); }}
          className="flex w-full items-center gap-2.5 rounded-xl border border-sage-200 bg-sage-50/60 px-4 py-2.5 text-left transition-colors hover:bg-sage-50 active:bg-sage-100"
        >
          <span
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sage-100 text-[13px]"
            aria-hidden="true"
          >
            ✦
          </span>
          <div className="flex-1">
            <p className="text-[12.5px] font-medium text-sage-800">
              Personalizar para o meu condomínio
            </p>
            <p className="text-[11.5px] text-sage-600">
              Configure em segundos · guidance mais relevante
            </p>
          </div>
          <span className="flex-shrink-0 text-[11px] font-semibold text-sage-600">
            Configurar →
          </span>
        </button>
      </section>
    );
  }

  // ── Expanded: formulário ───────────────────────────────────────────────────
  const ChipGroup = <V extends boolean | "morador" | "profissional">({
    label,
    field,
    options,
  }: {
    label: string;
    field: keyof CondominioProfile;
    options: { label: string; value: V }[];
  }) => (
    <div className="mb-3">
      <p className="mb-1.5 text-[12px] font-medium text-navy-500">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(({ label: optLabel, value }) => {
          const selected = draft[field] === value;
          return (
            <button
              key={optLabel}
              type="button"
              onClick={() => set(field, value as CondominioProfile[typeof field])}
              className={`rounded-full px-3.5 py-1 text-[12px] font-medium ring-1 transition-all active:scale-95 ${
                selected
                  ? "bg-sage-400 text-white ring-sage-400"
                  : "bg-white text-navy-700 ring-navy-200 hover:ring-navy-300"
              }`}
            >
              {optLabel}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="rounded-2xl border border-sage-200 bg-sage-50/40 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-sage-800">
            {isEditRef.current ? "Editar perfil" : "Meu condomínio"}
          </p>
          <span className="text-[11px] text-navy-400">
            Todos os campos são opcionais
          </span>
        </div>

        <div className="mb-3">
          <p className="mb-1.5 text-[12px] font-medium text-navy-500">Nome do condomínio</p>
          <input
            type="text"
            value={draft.nomeCondominio ?? ""}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                nomeCondominio: e.target.value || undefined,
              }))
            }
            placeholder="Ex: Residencial das Flores"
            className="w-full rounded-xl border border-navy-200 bg-white px-3 py-1.5 text-[12.5px] text-navy-800 placeholder-navy-300 focus:border-sage-300 focus:outline-none focus:ring-1 focus:ring-sage-200"
          />
        </div>

        <ChipGroup
          label="Possui elevador?"
          field="hasElevador"
          options={[
            { label: "Sim", value: true },
            { label: "Não", value: false },
          ]}
        />

        <ChipGroup
          label="Possui piscina?"
          field="hasPiscina"
          options={[
            { label: "Sim", value: true },
            { label: "Não", value: false },
          ]}
        />

        <ChipGroup
          label="Possui funcionários próprios?"
          field="hasFuncionarios"
          options={[
            { label: "Sim", value: true },
            { label: "Não / terceirizado", value: false },
          ]}
        />

        <ChipGroup
          label="Tipo de síndico"
          field="tipoSindico"
          options={[
            { label: "Morador", value: "morador" },
            { label: "Profissional", value: "profissional" },
          ]}
        />

        <div className="mt-1 flex items-center gap-4">
          <button
            type="button"
            onClick={save}
            className="rounded-xl bg-sage-500 px-5 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-sage-600 active:bg-sage-700"
          >
            Salvar
          </button>
          <button
            type="button"
            onClick={() => setView(isEditRef.current ? "collapsed-existing" : "hidden")}
            className="text-[11.5px] text-navy-400 underline underline-offset-2 transition-colors hover:text-navy-600"
          >
            {isEditRef.current ? "Cancelar" : "Pular por enquanto"}
          </button>
        </div>
      </div>
    </section>
  );
}
