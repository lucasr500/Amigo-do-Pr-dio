"use client";

import { useState } from "react";
import BrandMark from "@/components/BrandMark";
import { useAuth } from "@/lib/auth/AuthContext";
import type { ActiveProfile } from "@/lib/profile-mode";

type Props = {
  onSelectProfile: (profile: ActiveProfile) => void;
};

type Step = "select" | ActiveProfile;

const PROFILE_COPY: Record<ActiveProfile, {
  title: string;
  subtitle: string;
  surface: string;
  cta: string;
  secondary: string;
  benefits: string[];
}> = {
  manager: {
    title: "Olá, síndico.",
    subtitle: "Acesse o cockpit completo de gestão do condomínio.",
    surface: "bg-navy-950 text-cream-50",
    cta: "Enviar link de acesso",
    secondary: "Continuar como síndico/gestor",
    benefits: ["Gestão completa", "Visão estratégica", "Segurança e confiança"],
  },
  resident: {
    title: "Área do morador.",
    subtitle: "Acompanhe comunicados, documentos e solicitações do seu condomínio.",
    surface: "bg-cream-50 text-navy-900",
    cta: "Solicitar acesso",
    secondary: "Acessar área do morador",
    benefits: ["Fique informado", "Participe com organização", "Consulte tudo em um só lugar"],
  },
};

function Skyline() {
  return (
    <svg className="absolute inset-x-0 bottom-0 h-40 w-full text-white/[0.08]" viewBox="0 0 420 160" fill="none" aria-hidden="true">
      <path d="M18 132V76h42v56M78 132V48h52v84M148 132V62h38v70M206 132V34h66v98M292 132V70h44v62M356 132V52h46v80" stroke="currentColor" strokeWidth="2" />
      <path d="M0 132h420" stroke="currentColor" strokeWidth="2" />
      {Array.from({ length: 18 }).map((_, i) => (
        <rect key={i} x={34 + i * 20} y={78 + (i % 3) * 12} width="5" height="5" rx="1" fill="currentColor" />
      ))}
    </svg>
  );
}

function RoleSelectCard({
  title,
  subtitle,
  tone,
  onClick,
}: {
  title: string;
  subtitle: string;
  tone: "dark" | "light";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[126px] w-full items-center gap-4 rounded-3xl border px-5 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] ${
        tone === "dark"
          ? "border-white/12 bg-white/[0.08] text-white shadow-elevated hover:bg-white/[0.12]"
          : "border-navy-100 bg-white/95 text-navy-900 shadow-card-md hover:border-navy-200"
      }`}
    >
      <span className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${
        tone === "dark" ? "bg-cream-50/12 text-cream-50" : "bg-navy-50 text-navy-700"
      }`}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 20V8l8-4 8 4v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 20v-6h6v6M8 10h.01M12 10h.01M16 10h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold leading-tight">{title}</span>
        <span className={`mt-1 block text-[12.5px] leading-relaxed ${tone === "dark" ? "text-cream-100/72" : "text-navy-500"}`}>
          {subtitle}
        </span>
      </span>
      <svg className={`h-5 w-5 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${tone === "dark" ? "text-cream-100/50" : "text-navy-300"}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default function RoleGateway({ onSelectProfile }: Props) {
  const [step, setStep] = useState<Step>("select");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const auth = useAuth();

  if (step !== "select") {
    const copy = PROFILE_COPY[step];
    const isManager = step === "manager";

    const handleMagicLink = async () => {
      if (!email.trim()) {
        setStatus("Informe um e-mail para receber o link.");
        return;
      }
      const result = await auth.sendMagicLink(email);
      setStatus(result.error ? result.error : "Link enviado. Verifique seu e-mail.");
    };

    return (
      <main className={`relative flex min-h-dvh overflow-hidden ${copy.surface}`}>
        {isManager && <Skyline />}
        <div className="relative z-10 mx-auto grid w-full max-w-5xl gap-8 px-5 py-[calc(env(safe-area-inset-top,0px)+2rem)] sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <section className="flex flex-col justify-between gap-10">
            <div>
              <button
                type="button"
                onClick={() => { setStep("select"); setStatus(null); }}
                className={`mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
                  isManager ? "bg-white/[0.08] text-cream-100 hover:bg-white/[0.12]" : "bg-white text-navy-500 shadow-card hover:text-navy-800"
                }`}
              >
                <span aria-hidden="true">←</span>
                Trocar perfil
              </button>
              <BrandMark className="h-14 w-14" rounded="rounded-2xl" />
              <p className={`mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] ${isManager ? "text-cream-100/58" : "text-navy-400"}`}>
                amigo do prédio
              </p>
              <h1 className={`mt-3 font-display text-[38px] font-semibold leading-[1.02] sm:text-[52px] ${isManager ? "text-cream-50" : "text-navy-900"}`}>
                {copy.title}
              </h1>
              <p className={`mt-4 max-w-[460px] text-[15px] leading-relaxed ${isManager ? "text-cream-100/72" : "text-navy-500"}`}>
                {copy.subtitle}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {copy.benefits.map((benefit) => (
                <div key={benefit} className={`rounded-2xl border px-4 py-3 ${
                  isManager ? "border-white/10 bg-white/[0.06]" : "border-navy-100 bg-white/85"
                }`}>
                  <p className={`text-[12px] font-semibold ${isManager ? "text-cream-50" : "text-navy-800"}`}>{benefit}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={`rounded-[28px] border p-4 shadow-elevated sm:p-5 ${
            isManager ? "border-white/12 bg-white/[0.08] backdrop-blur-xl" : "border-navy-100 bg-white/95"
          }`}>
            <div className={`rounded-[22px] border p-4 sm:p-5 ${isManager ? "border-white/10 bg-navy-900/70" : "border-navy-100 bg-cream-50/70"}`}>
              <label className={`mb-1.5 block text-[12px] font-semibold ${isManager ? "text-cream-100" : "text-navy-700"}`} htmlFor="gateway-email">
                E-mail
              </label>
              <input
                id="gateway-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@condominio.com"
                className={`w-full rounded-2xl border px-4 py-3 text-[15px] outline-none transition-colors focus:border-terracotta-400 ${
                  isManager ? "border-white/12 bg-white/10 text-white placeholder:text-white/35" : "border-navy-100 bg-white text-navy-900 placeholder:text-navy-300"
                }`}
              />
              {status && (
                <p className={`mt-2 text-[12px] ${isManager ? "text-cream-100/70" : "text-navy-500"}`}>{status}</p>
              )}
              <button
                type="button"
                onClick={handleMagicLink}
                className={`mt-4 min-h-12 w-full rounded-2xl px-4 text-[14px] font-semibold transition-all active:scale-[0.98] ${
                  isManager ? "bg-cream-50 text-navy-950 hover:bg-white" : "bg-navy-800 text-white hover:bg-navy-900"
                }`}
              >
                {copy.cta}
              </button>
              <button
                type="button"
                onClick={() => onSelectProfile(step)}
                className={`mt-2 min-h-11 w-full rounded-2xl border px-4 text-[13px] font-semibold transition-colors ${
                  isManager ? "border-white/12 text-cream-100/80 hover:bg-white/[0.08]" : "border-navy-100 bg-white text-navy-600 hover:bg-navy-50"
                }`}
              >
                {copy.secondary}
              </button>
            </div>

            <div className={`mt-4 rounded-2xl px-4 py-3 ${isManager ? "bg-white/[0.06]" : "bg-navy-50/70"}`}>
              <p className={`text-[12px] leading-relaxed ${isManager ? "text-cream-100/66" : "text-navy-500"}`}>
                {isManager
                  ? "Login é opcional. Seus dados ficam salvos no dispositivo e protegidos pelo backup do app."
                  : "A central do morador reúne comunicados, solicitações e documentos organizados pela gestão do condomínio."}
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-dvh overflow-hidden bg-navy-950 text-cream-50">
      <div className="absolute left-1/2 top-[-18rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-navy-600/[0.18] blur-3xl" aria-hidden="true" />
      <Skyline />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col justify-between px-5 py-[calc(env(safe-area-inset-top,0px)+2rem)] sm:px-8">
        <section className="pt-6 text-center">
          <BrandMark className="mx-auto h-16 w-16 shadow-elevated" rounded="rounded-[22px]" />
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-cream-100/56">amigo do prédio</p>
          <h1 className="mx-auto mt-4 max-w-[560px] font-display text-[42px] font-semibold leading-[0.98] sm:text-[58px]">
            Tudo o que importa no condomínio, em um só lugar.
          </h1>
          <p className="mx-auto mt-5 max-w-[520px] text-[15px] leading-relaxed text-cream-100/70">
            Gestão, comunicação, documentos, memória institucional e participação organizada em um só lugar.
          </p>
        </section>

        <section className="mt-10 space-y-3 pb-8">
          <RoleSelectCard
            title="Sou síndico ou gestor"
            subtitle="Acesse o cockpit completo de gestão do condomínio."
            tone="dark"
            onClick={() => setStep("manager")}
          />
          <RoleSelectCard
            title="Sou morador"
            subtitle="Acesse comunicados, documentos e solicitações do seu condomínio."
            tone="dark"
            onClick={() => setStep("resident")}
          />
          <p className="pt-2 text-center text-[12px] text-cream-100/50">
            Ainda não tem acesso? Fale com o síndico do seu condomínio.
          </p>
        </section>
      </div>
    </main>
  );
}
