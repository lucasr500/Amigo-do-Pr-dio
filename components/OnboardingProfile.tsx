"use client";

import { useEffect, useRef, useState } from "react";
import {
  getProfile,
  saveProfile,
  CondominioProfile,
  TipoGestao,
  getUsageStats,
} from "@/lib/session";
import { trackEvent } from "@/lib/telemetry";

type Props = {
  onProfileSaved?: () => void;
  onSetupMemoria?: () => void;
  forceShow?: boolean;
};

type ViewState = "hidden" | "collapsed" | "collapsed-existing" | "expanded" | "bridge" | "updated";

const TIPO_GESTAO_LABEL: Record<TipoGestao, string> = {
  sindico_morador:  "Síndico morador",
  profissional:     "Síndico profissional",
  autogestao:       "Autogestão",
  administradora:   "Administradora",
};

function profileCompleteness(p: CondominioProfile): number {
  const fields: (keyof CondominioProfile)[] = [
    "nomeCondominio", "hasElevador", "hasPiscina", "hasFuncionarios",
    "numUnidades", "hasGaragem", "hasSalao", "tipoGestao",
  ];
  const filled = fields.filter((f) => p[f] !== undefined && p[f] !== "").length;
  return Math.round((filled / fields.length) * 100);
}

export default function OnboardingProfile({ onProfileSaved, onSetupMemoria, forceShow }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<ViewState>("hidden");
  const [draft, setDraft] = useState<CondominioProfile>({});
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
      setView("updated");
      setTimeout(() => {
        setView("collapsed-existing");
        onProfileSaved?.();
      }, 1400);
    } else {
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

  // ── Bridge ─────────────────────────────────────────────────────────────────
  if (view === "bridge") {
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <div className="rounded-[22px] border border-cream-200 bg-cream-100/75 p-4 shadow-[0_12px_28px_-24px_rgba(31,49,71,0.30)]">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 text-[11px] text-navy-600" aria-hidden="true">
              ✓
            </span>
            <p className="text-[13px] font-semibold text-navy-800">Condomínio configurado</p>
          </div>
          <p className="text-[13px] leading-relaxed text-navy-700">
            Registre as principais datas do seu prédio — vencimento do AVCB, seguro, mandato do síndico e manutenções — para ativar alertas de antecipação.
          </p>
          <p className="mt-1.5 text-[11px] text-navy-500">
            Cada data registrada é um alerta antes de virar urgência.
          </p>
          <div className="mt-3.5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleSetupMemoria}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-navy-700 px-4 py-1.5 text-[12.5px] font-semibold text-white transition-all hover:bg-navy-800 active:scale-[0.98]"
            >
              Ativar monitoramento
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

  // ── Updated ────────────────────────────────────────────────────────────────
  if (view === "updated") {
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <div className="flex items-center gap-2.5 rounded-xl border border-cream-200 bg-cream-100/60 px-4 py-2.5">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 text-[11px] text-navy-600" aria-hidden="true">
            ✓
          </span>
          <p className="text-[12.5px] font-medium text-navy-800">Perfil atualizado</p>
        </div>
      </section>
    );
  }

  // ── Collapsed-existing ─────────────────────────────────────────────────────
  if (view === "collapsed-existing") {
    const pct = profileCompleteness(draft);
    const subtitle = draft.tipoGestao
      ? TIPO_GESTAO_LABEL[draft.tipoGestao]
      : draft.numUnidades
      ? `${draft.numUnidades} unidades`
      : "Toque para editar o perfil";
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <button
          type="button"
          onClick={() => setView("expanded")}
          className="flex w-full items-center gap-2.5 rounded-[18px] border border-cream-200/90 bg-white/78 px-4 py-3 text-left shadow-[0_1px_2px_rgba(31,49,71,0.03)] transition-colors hover:bg-white active:bg-navy-50"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 text-[11px] text-navy-600" aria-hidden="true">
            ✓
          </span>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[12.5px] font-medium text-navy-800">
              {draft.nomeCondominio ?? "Condomínio configurado"}
            </p>
            <p className="text-[11.5px] text-navy-400">{subtitle}</p>
          </div>
          {pct < 100 && (
            <span className={`shrink-0 text-[10.5px] font-semibold ${pct >= 75 ? "text-teal-600" : pct >= 50 ? "text-amber-600" : "text-navy-400"}`}>
              {pct}%
            </span>
          )}
          <span className="flex-shrink-0 text-[11px] font-semibold text-navy-500">
            Editar →
          </span>
        </button>
      </section>
    );
  }

  // ── Collapsed: perfil não criado ───────────────────────────────────────────
  if (view === "collapsed") {
    return (
      <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
        <button
          type="button"
          onClick={() => { setView("expanded"); void trackEvent("onboarding_started"); }}
          className="flex w-full items-center gap-2.5 rounded-[18px] border border-cream-200 bg-cream-100/70 px-4 py-3 text-left shadow-[0_1px_2px_rgba(31,49,71,0.03)] transition-colors hover:bg-cream-100 active:bg-cream-200"
        >
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-cream-200 text-[13px]" aria-hidden="true">
            ✦
          </span>
          <div className="flex-1">
            <p className="text-[12.5px] font-medium text-navy-700">Identificar meu condomínio</p>
            <p className="text-[11.5px] text-navy-500">Ativa alertas e orientações específicas para o seu prédio</p>
          </div>
          <span className="flex-shrink-0 text-[11px] font-semibold text-navy-500">Configurar →</span>
        </button>
      </section>
    );
  }

  // ── Expanded: formulário ───────────────────────────────────────────────────
  const pct = profileCompleteness(draft);

  function ChipGroup<V extends string | boolean>({
    label,
    field,
    options,
  }: {
    label: string;
    field: keyof CondominioProfile;
    options: { label: string; value: V }[];
  }) {
    return (
      <div className="mb-3">
        <p className="mb-1.5 text-[12px] font-medium text-navy-500">{label}</p>
        <div className="flex flex-wrap gap-1.5">
          {options.map(({ label: optLabel, value }) => {
            const selected = draft[field] === value;
            return (
              <button
                key={String(value)}
                type="button"
                onClick={() => set(field, value as CondominioProfile[typeof field])}
                className={`rounded-full px-3.5 py-1 text-[12px] font-medium ring-1 transition-all active:scale-95 ${
                  selected
                    ? "bg-navy-700 text-white ring-navy-700"
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
  }

  return (
    <section className="px-5 pb-3 sm:px-6 animate-fade-in-up">
      <div className="rounded-[22px] border border-cream-200 bg-white/82 p-4 shadow-[0_1px_2px_rgba(31,49,71,0.03),0_14px_30px_-24px_rgba(31,49,71,0.28)]">

        {/* Header + progresso */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[13px] font-semibold text-navy-800">
            {isEditRef.current ? "Editar perfil" : "Meu condomínio"}
          </p>
          <span className="text-[11px] text-navy-400">Todos os campos são opcionais</span>
        </div>

        {/* Barra de completude */}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-[10.5px] text-navy-400">Perfil do prédio</p>
            <p className={`text-[10.5px] font-semibold ${pct >= 75 ? "text-teal-600" : pct >= 50 ? "text-amber-600" : "text-navy-400"}`}>
              {pct}% preenchido
            </p>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-navy-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pct >= 75 ? "bg-teal-500" : pct >= 50 ? "bg-amber-400" : "bg-navy-300"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Nome */}
        <div className="mb-3">
          <p className="mb-1.5 text-[12px] font-medium text-navy-500">Nome do condomínio</p>
          <input
            type="text"
            autoComplete="off"
            value={draft.nomeCondominio ?? ""}
            onChange={(e) => set("nomeCondominio", e.target.value || undefined)}
            placeholder="Ex: Residencial das Flores"
            className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13.5px] text-navy-800 placeholder-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
          />
        </div>

        {/* Número de unidades */}
        <div className="mb-3">
          <p className="mb-1.5 text-[12px] font-medium text-navy-500">Número de unidades</p>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={draft.numUnidades ?? ""}
            onChange={(e) => set("numUnidades", e.target.value ? Number(e.target.value) : undefined)}
            placeholder="Ex: 48"
            className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13.5px] text-navy-800 placeholder-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
          />
        </div>

        {/* Infraestrutura */}
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
          label="Possui garagem?"
          field="hasGaragem"
          options={[
            { label: "Sim", value: true },
            { label: "Não", value: false },
          ]}
        />

        <ChipGroup
          label="Possui salão de festas?"
          field="hasSalao"
          options={[
            { label: "Sim", value: true },
            { label: "Não", value: false },
          ]}
        />

        {/* Funcionários */}
        <ChipGroup
          label="Possui funcionários próprios?"
          field="hasFuncionarios"
          options={[
            { label: "Sim", value: true },
            { label: "Não / terceirizado", value: false },
          ]}
        />

        {/* Tipo de gestão */}
        <ChipGroup
          label="Tipo de gestão"
          field="tipoGestao"
          options={[
            { label: "Síndico morador", value: "sindico_morador" },
            { label: "Síndico profissional", value: "profissional" },
            { label: "Autogestão", value: "autogestao" },
            { label: "Administradora", value: "administradora" },
          ]}
        />

        {/* Administradora — condicional */}
        {(draft.tipoGestao === "administradora" || draft.tipoGestao === "profissional") && (
          <div className="mb-3">
            <p className="mb-1.5 text-[12px] font-medium text-navy-500">Nome da administradora</p>
            <input
              type="text"
              autoComplete="off"
              value={draft.nomeAdministradora ?? ""}
              onChange={(e) => set("nomeAdministradora", e.target.value || undefined)}
              placeholder="Ex: Administradora ABC"
              className="min-h-10 w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13.5px] text-navy-800 placeholder-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100"
            />
          </div>
        )}

        {/* Observações internas */}
        <div className="mb-3">
          <p className="mb-1.5 text-[12px] font-medium text-navy-500">
            Observações internas <span className="font-normal text-navy-300">(visível só para você)</span>
          </p>
          <textarea
            rows={2}
            value={draft.observacoesInternas ?? ""}
            onChange={(e) => set("observacoesInternas", e.target.value || undefined)}
            placeholder="Ex: Condomínio em processo de troca de administradora"
            className="w-full rounded-xl border border-navy-100 bg-cream-50/50 px-3 py-2 text-[13px] text-navy-800 placeholder-navy-300 focus:border-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-100 resize-none"
          />
        </div>

        <div className="mt-1 flex items-center gap-4">
          <button
            type="button"
            onClick={save}
            className="min-h-10 rounded-xl bg-navy-700 px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-navy-800 active:bg-navy-900"
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
