"use client";

import { useEffect, useState } from "react";
import BrandMark from "@/components/BrandMark";
import type { AppTab } from "@/components/BottomNav";
import type { CentralSectionId } from "@/lib/visibility-guards";
import { getProfile } from "@/lib/session";
import { getActivePosts, type InstitutionalPost } from "@/lib/community-posts";
import { getOpenRequests } from "@/lib/community-requests";
import { getActivePolls, type Poll } from "@/lib/community-polls";
import { getTimeline, type TimelineEvent } from "@/lib/community-timeline";
import { getReservationSummary } from "@/lib/community-reservas";
import { formatDateSafe } from "@/lib/date-format";
import ContentNatureBadge from "@/components/ContentNatureBadge";
import { natureOfPost } from "@/lib/content-nature";
import TransparencyPanel from "@/components/TransparencyPanel";

type Props = {
  refreshKey: number;
  condoName: string;
  onNavigateTab: (tab: AppTab) => void;
  onNavigateToSection?: (sectionId: string, centralSection?: CentralSectionId) => void;
  onSwitchProfile: () => void;
};

type ResidentState = {
  condoName: string;
  featuredPost: InstitutionalPost | null;
  postsCount: number;
  openRequests: number;
  activePolls: Poll[];
  timeline: TimelineEvent[];
  pendingReservations: number;
};

const quickActions = [
  { label: "Comunicados", section: "central-digital", centralSection: "mural" as CentralSectionId, icon: "M4 6h12M4 10h12M4 14h7" },
  { label: "Solicitação", section: "central-digital", centralSection: "canal" as CentralSectionId, icon: "M5 5h10v8H8l-3 3V5z" },
  { label: "Avisar obra", section: "central-digital", centralSection: "canal" as CentralSectionId, icon: "M3 14h2l2-6 3 9 2-5 2 2h3" },
  { label: "Sugestão", section: "central-digital", centralSection: "canal" as CentralSectionId, icon: "M8 3C5.2 3 3 5.2 3 8c0 1.9 1.1 3.6 2.7 4.5V14h4.6v-1.5C11.9 11.6 13 9.9 13 8c0-2.8-2.2-5-5-5z" },
  { label: "Reservas", section: "central-digital", centralSection: "reservas" as CentralSectionId, icon: "M5 4v3M15 4v3M4 8h12M5 5h10v11H5z" },
  { label: "Enquetes", section: "central-digital", centralSection: "enquetes" as CentralSectionId, icon: "M5 14V8M10 14V5M15 14v-3" },
  { label: "Documentos", section: "central-digital", centralSection: "documentos" as CentralSectionId, icon: "M6 3h6l4 4v10H6V3zM12 3v5h4" },
  { label: "Agenda", tab: "agenda" as AppTab, icon: "M5 4v3M15 4v3M4 8h12M5 5h10v11H5z" },
];

function EmptyPublicCard({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="rounded-[24px] border border-navy-100 bg-white/92 px-5 py-5 shadow-card-md">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-sage-700">Central do morador</p>
      <h2 className="mt-2 font-display text-[24px] font-semibold leading-tight text-navy-900">
        Canal do condomínio
      </h2>
      <p className="mt-2 text-[13px] leading-relaxed text-navy-500">
        Comunicados, solicitações, documentos e enquetes do condomínio organizados em um só lugar.
      </p>
      <button
        type="button"
        onClick={onNavigate}
        className="mt-4 rounded-full bg-navy-800 px-4 py-2 text-[12px] font-semibold text-white hover:bg-navy-900"
      >
        Explorar
      </button>
    </div>
  );
}

export default function ResidentHomeTab({
  refreshKey,
  condoName,
  onNavigateTab,
  onNavigateToSection,
  onSwitchProfile,
}: Props) {
  const [state, setState] = useState<ResidentState | null>(null);

  useEffect(() => {
    const profile = getProfile();
    const posts = getActivePosts().filter((post) => post.visibility === "moradores" || post.visibility === "publico");
    const featured = posts.find((post) => post.pinned) ?? posts[0] ?? null;
    const timeline = getTimeline().filter((event) => event.visibility === "moradores" || event.visibility === "publico").slice(0, 4);
    const resSummary = getReservationSummary();
    setState({
      condoName: condoName || profile?.nomeCondominio || "Condomínio",
      featuredPost: featured,
      postsCount: posts.length,
      openRequests: getOpenRequests().length,
      activePolls: getActivePolls(),
      timeline,
      pendingReservations: resSummary.pending,
    });
  }, [condoName, refreshKey]);

  if (!state) return null;

  const goCentral = () => {
    if (onNavigateToSection) onNavigateToSection("central-digital", "mural");
    else onNavigateTab("condominio");
  };

  return (
    <main className="tab-enter flex w-full max-w-full flex-1 flex-col overflow-x-hidden">
      <section className="px-5 pb-4 pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:px-6">
        <div className="rounded-[28px] border border-navy-100 bg-white/90 px-4 py-4 shadow-card-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <BrandMark className="h-11 w-11" rounded="rounded-2xl" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-navy-400">Central do morador</p>
                <h1 className="mt-0.5 truncate font-display text-[24px] font-semibold text-navy-900">{state.condoName}</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={onSwitchProfile}
              className="rounded-full border border-navy-100 bg-white px-3 py-1.5 text-[11px] font-semibold text-navy-500 hover:bg-navy-50"
            >
              Trocar
            </button>
          </div>
          <div className="mt-4 rounded-2xl bg-navy-50 px-4 py-3">
            <p className="text-[12px] leading-relaxed text-navy-500">
              Comunicados, solicitações e documentos do seu condomínio disponíveis aqui.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 pb-4 sm:px-6">
        {state.featuredPost ? (
          <button
            type="button"
            onClick={goCentral}
            className="w-full rounded-[24px] border border-navy-100 bg-white/95 px-5 py-5 text-left shadow-card-md transition-all hover:border-navy-200 hover:bg-white active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sage-50 px-2.5 py-1 text-[10.5px] font-semibold text-sage-800">
                {state.featuredPost.pinned ? "Importante" : "Aviso"}
              </span>
              <ContentNatureBadge nature={natureOfPost(state.featuredPost)} size="sm" /><span className="text-[11px] text-navy-300">{state.postsCount} comunicado{state.postsCount !== 1 ? "s" : ""}</span>
            </div>
            <h2 className="mt-3 font-display text-[25px] font-semibold leading-tight text-navy-900">
              {state.featuredPost.title}
            </h2>
            <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-navy-500">
              {state.featuredPost.body}
            </p>
            <span className="mt-4 inline-flex rounded-full bg-navy-800 px-4 py-2 text-[12px] font-semibold text-white">
              Ver todos
            </span>
          </button>
        ) : (
          <EmptyPublicCard onNavigate={goCentral} />
        )}
      </section>

      <section className="px-5 pb-4 sm:px-6">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-navy-100 bg-white/90 px-3 py-3 shadow-card">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-navy-400">Solicitações</p>
            <p className="mt-1 text-[20px] font-semibold text-navy-900">{state.openRequests}</p>
            <p className="text-[10.5px] text-navy-400">em aberto</p>
          </div>
          <div className="rounded-2xl border border-navy-100 bg-white/90 px-3 py-3 shadow-card">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-navy-400">Enquetes</p>
            <p className="mt-1 text-[20px] font-semibold text-navy-900">{state.activePolls.length}</p>
            <p className="text-[10.5px] text-navy-400">ativas</p>
          </div>
          <div className={`rounded-2xl border bg-white/90 px-3 py-3 shadow-card ${state.pendingReservations > 0 ? "border-amber-200" : "border-navy-100"}`}>
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-navy-400">Reservas</p>
            <p className={`mt-1 text-[20px] font-semibold ${state.pendingReservations > 0 ? "text-amber-600" : "text-navy-900"}`}>{state.pendingReservations}</p>
            <p className="text-[10.5px] text-navy-400">pendentes</p>
          </div>
        </div>
      </section>

      <section className="px-5 pb-4 sm:px-6">
        <div className="rounded-[24px] border border-sage-100 bg-sage-50/70 px-4 py-4 shadow-card">
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-sage-800">Canal estruturado</p>
          <p className="mt-1 text-[14px] font-semibold text-navy-900">Fale com a gestão pelo caminho certo</p>
          <p className="mt-1.5 mb-3 text-[12px] leading-relaxed text-navy-500">
            Solicitações, reservas, avisos e sugestões ficam organizados e acompanháveis.
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["Mural oficial", "Avisos e comunicados da gestão em um só lugar."],
              ["Solicitações", "Pedidos e ocorrências com acompanhamento estruturado."],
              ["Documentos do prédio", "Atas, regras e documentos disponíveis para consulta."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl bg-white/78 px-3 py-3">
                <p className="text-[12px] font-semibold text-navy-800">{title}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-navy-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-4 sm:px-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-navy-900">Acesso rápido</h2>
          <span className="text-[11px] text-navy-400">Canal estruturado</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quickActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                if (action.tab) onNavigateTab(action.tab);
                else if (action.section && onNavigateToSection) onNavigateToSection(action.section, action.centralSection);
                else onNavigateTab("condominio");
              }}
              className="flex min-h-[84px] flex-col items-center justify-center gap-2 rounded-2xl border border-navy-100 bg-white/90 px-2 text-center shadow-card transition-colors hover:bg-white"
            >
              <svg className="h-5 w-5 text-navy-700" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d={action.icon} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[10.5px] font-semibold leading-tight text-navy-700">{action.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="px-5 pb-4 sm:px-6">
        <TransparencyPanel refreshKey={refreshKey} />
      </section>

      <section className="px-5 pb-5 sm:px-6">
        <div className="rounded-[24px] border border-navy-100 bg-white/90 px-4 py-4 shadow-card-md">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] font-semibold text-navy-900">Atividades recentes</h2>
            <button type="button" onClick={goCentral} className="text-[11px] font-semibold text-navy-500 hover:text-navy-800">
              Ver timeline
            </button>
          </div>
          {state.timeline.length > 0 ? (
            <div className="space-y-3">
              {state.timeline.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-sage-500" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-semibold leading-snug text-navy-800">{event.title}</p>
                    <p className="mt-0.5 text-[11px] text-navy-400">{formatDateSafe(event.occurredAt, undefined, "Data não informada")}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] leading-relaxed text-navy-400">
              Comunicados publicados, documentos atualizados e enquetes abertas aparecerão aqui.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
