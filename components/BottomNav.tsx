"use client";

export type AppTab = "inicio" | "agenda" | "assistente" | "ferramentas" | "memoria" | "comunidade" | "ajustes";
export type NavProfile = "manager" | "resident";
// Alvos de navegação da barra inferior. "pendencias" não é uma aba: abre a
// subView de pendências dentro de Início (tratado em app/page.tsx).
export type NavTarget = AppTab | "pendencias";

function IconHome({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <path
        d="M3 9.5L10 3.5L17 9.5V17H12.5V12.5H7.5V17H3V9.5Z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCalendar({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.5} strokeLinejoin="round" />
      <path d="M3 8.5h14" stroke="currentColor" strokeWidth={active ? 2.2 : 1.5} strokeLinecap="round" />
      <path d="M7 3v3M13 3v3" stroke="currentColor" strokeWidth={active ? 2.2 : 1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconChat({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <path
        d="M3.5 4.5h13a1 1 0 011 1v7a1 1 0 01-1 1H12l-3.5 3V13.5H3.5a1 1 0 01-1-1v-7a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAccount({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth={active ? 2.2 : 1.5} />
      <path
        d="M3.5 17c0-3.038 2.91-5.5 6.5-5.5s6.5 2.462 6.5 5.5"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconMemoria({ active }: { active: boolean }) {
  // Cérebro / memória institucional — livro aberto com marcador.
  return (
    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <path d="M10 5.5C8.5 4.3 6.3 4 4.2 4.4a1 1 0 00-.8 1V15a1 1 0 001.2 1c1.9-.4 3.9-.1 5.4 1 1.5-1.1 3.5-1.4 5.4-1a1 1 0 001.2-1V5.4a1 1 0 00-.8-1C13.7 4 11.5 4.3 10 5.5z" stroke="currentColor" strokeWidth={active ? 2.1 : 1.5} strokeLinejoin="round" />
      <path d="M10 5.5V16" stroke="currentColor" strokeWidth={active ? 2.1 : 1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconPendencias({ active }: { active: boolean }) {
  // Lista com check — pendências / tarefas.
  return (
    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <path d="M7.5 6h8M7.5 10h8M7.5 14h5" stroke="currentColor" strokeWidth={active ? 2.1 : 1.5} strokeLinecap="round" />
      <path d="M3.5 6l1 1 1.5-1.8M3.5 10l1 1 1.5-1.8" stroke="currentColor" strokeWidth={active ? 2.1 : 1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4.5" cy="14" r="0.9" fill="currentColor" />
    </svg>
  );
}

function IconComunidade({ active }: { active: boolean }) {
  // Pessoas — a rede do condomínio.
  return (
    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="2.6" stroke="currentColor" strokeWidth={active ? 2.1 : 1.5} />
      <circle cx="14" cy="8" r="2.1" stroke="currentColor" strokeWidth={active ? 2.1 : 1.5} />
      <path d="M2.5 16c0-2.3 2-4 4.5-4s4.5 1.7 4.5 4" stroke="currentColor" strokeWidth={active ? 2.1 : 1.5} strokeLinecap="round" />
      <path d="M13 12.2c2.2 0 4.5 1.4 4.5 3.8" stroke="currentColor" strokeWidth={active ? 2.1 : 1.5} strokeLinecap="round" />
    </svg>
  );
}

function IconAjustes({ active }: { active: boolean }) {
  // Engrenagem — ajustes.
  return (
    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth={active ? 2.1 : 1.5} />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4" stroke="currentColor" strokeWidth={active ? 2.1 : 1.5} strokeLinecap="round" />
    </svg>
  );
}

type TabItem = {
  id: NavTarget;
  label: string;
  Icon: (props: { active: boolean }) => React.JSX.Element;
};

// Síndico/Gestor — opção A (W7): Início · Memória · [Perguntar] · Comunidade · Ajustes.
// Pendências vive no motor "Hoje" do Início (o badge de urgência fica no Início).
const LEFT_TABS: TabItem[] = [
  { id: "inicio",     label: "Início",     Icon: IconHome },
  { id: "memoria",    label: "Memória",    Icon: IconMemoria },
];

const RIGHT_TABS: TabItem[] = [
  { id: "comunidade", label: "Comunidade", Icon: IconComunidade },
  { id: "ajustes",    label: "Ajustes",    Icon: IconAjustes },
];

const RESIDENT_LEFT_TABS: TabItem[] = [
  { id: "inicio",     label: "Início",       Icon: IconHome },
  { id: "comunidade", label: "Comunidade",   Icon: IconComunidade },
];

const RESIDENT_RIGHT_TABS: TabItem[] = [
  { id: "agenda",      label: "Agenda",      Icon: IconCalendar },
  { id: "assistente",  label: "Info",        Icon: IconAccount },
];

type Props = {
  active: NavTarget;
  onChange: (tab: NavTarget) => void;
  urgentCount?: number;
  profile?: NavProfile;
};

export default function BottomNav({ active, onChange, urgentCount, profile = "manager" }: Props) {
  const isResident = profile === "resident";
  const leftTabs = isResident ? RESIDENT_LEFT_TABS : LEFT_TABS;
  const rightTabs = isResident ? RESIDENT_RIGHT_TABS : RIGHT_TABS;
  // Centro: morador abre o "Canal" (solicitações); síndico abre "Perguntar" (assistente).
  const plusTarget: NavTarget = isResident ? "ferramentas" : "assistente";
  const plusActive = active === plusTarget;
  const plusLabel = isResident ? "Canal" : "Perguntar";
  const plusAria = isResident ? "Abrir canal estruturado da visualização de morador" : "Pergunte ao prédio — abrir assistente";
  // Badge de urgência no Início (o motor "Hoje" surfaceia as pendências urgentes).
  const badgeFor = (id: NavTarget) =>
    id === "inicio" && (urgentCount ?? 0) > 0 ? (urgentCount as number) : 0;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      role="tablist"
      aria-label="Navegação principal"
    >
      <div className="mx-auto max-w-[760px]">
        <div
          className="border-t border-navy-100/70 bg-white/[0.94] shadow-nav backdrop-blur"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)" }}
        >
          <div className="flex items-stretch px-1 pt-1">

            {/* Left tabs */}
            {leftTabs.map((tab) => {
              const isActive = active === tab.id;
              const badgeCount = badgeFor(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onChange(tab.id)}
                  className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors duration-150 active:scale-[0.96] ${
                    isActive ? "text-navy-800" : "text-navy-300 hover:text-navy-500"
                  }`}
                >
                  <div className="relative">
                    <tab.Icon active={isActive} />
                    {!!badgeCount && (
                      <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta-600 px-0.5 text-[9px] font-bold leading-none text-white">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </div>
                  <span className={`whitespace-nowrap text-[10px] font-semibold leading-none ${isActive ? "text-navy-800" : "text-navy-300"}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}

            {/* Center "+" action button */}
            <div className="flex flex-1 flex-col items-center justify-start pt-0" style={{ marginTop: "-10px" }}>
              <button
                type="button"
                aria-label={plusAria}
                aria-pressed={plusActive}
                onClick={() => onChange(plusTarget)}
                className={`flex h-[52px] w-[52px] items-center justify-center rounded-full transition-all duration-150 active:scale-[0.93] ${
                  plusActive
                    ? "bg-navy-900 shadow-elevated"
                    : "bg-navy-800 shadow-card-md"
                }`}
              >
                {isResident ? (
                  <svg viewBox="0 0 20 20" className="h-[22px] w-[22px] text-white" fill="none" aria-hidden="true">
                    <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
                  </svg>
                ) : (
                  <span className="text-white">
                    <IconChat active />
                  </span>
                )}
              </button>
              <span className={`mt-1.5 whitespace-nowrap text-[10px] font-semibold leading-none ${plusActive ? "text-navy-800" : "text-navy-300"}`}>
                {plusLabel}
              </span>
            </div>

            {/* Right tabs */}
            {rightTabs.map((tab) => {
              const isActive = active === tab.id;
              const badgeCount = badgeFor(tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onChange(tab.id)}
                  className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors duration-150 active:scale-[0.96] ${
                    isActive ? "text-navy-800" : "text-navy-300 hover:text-navy-500"
                  }`}
                >
                  <div className="relative">
                    <tab.Icon active={isActive} />
                    {!!badgeCount && (
                      <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-terracotta-600 px-0.5 text-[9px] font-bold leading-none text-white">
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </div>
                  <span className={`whitespace-nowrap text-[10px] font-semibold leading-none ${isActive ? "text-navy-800" : "text-navy-300"}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}

          </div>
        </div>
      </div>
    </nav>
  );
}
