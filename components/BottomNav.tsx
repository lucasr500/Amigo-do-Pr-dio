"use client";

export type AppTab = "inicio" | "agenda" | "assistente" | "ferramentas" | "condominio";

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

type TabItem = {
  id: AppTab;
  label: string;
  Icon: (props: { active: boolean }) => React.JSX.Element;
};

const LEFT_TABS: TabItem[] = [
  { id: "inicio",     label: "Início",     Icon: IconHome },
  { id: "agenda",     label: "Agenda",     Icon: IconCalendar },
];

const RIGHT_TABS: TabItem[] = [
  { id: "assistente", label: "Assistente", Icon: IconChat },
  { id: "condominio", label: "Meu prédio", Icon: IconAccount },
];

type Props = {
  active: AppTab;
  onChange: (tab: AppTab) => void;
  urgentCount?: number;
};

export default function BottomNav({ active, onChange, urgentCount }: Props) {
  const plusActive = active === "ferramentas";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      role="tablist"
      aria-label="Navegação principal"
    >
      <div className="mx-auto max-w-[440px]">
        <div
          className="border-t border-gray-100 bg-white shadow-nav"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)" }}
        >
          <div className="flex items-stretch px-1 pt-1">

            {/* Left tabs */}
            {LEFT_TABS.map((tab) => {
              const isActive = active === tab.id;
              const badgeCount = tab.id === "inicio" && (urgentCount ?? 0) > 0 ? urgentCount : 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onChange(tab.id)}
                  className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors duration-150 active:scale-[0.96] ${
                    isActive ? "text-navy-700" : "text-gray-400 hover:text-gray-500"
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
                  <span className={`whitespace-nowrap text-[10px] font-semibold leading-none ${isActive ? "text-navy-700" : "text-gray-400"}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}

            {/* Center "+" action button */}
            <div className="flex flex-1 flex-col items-center justify-start pt-0" style={{ marginTop: "-10px" }}>
              <button
                type="button"
                aria-label="Ações do síndico"
                aria-selected={plusActive}
                onClick={() => onChange("ferramentas")}
                className={`flex h-[52px] w-[52px] items-center justify-center rounded-full transition-all duration-150 active:scale-[0.93] ${
                  plusActive
                    ? "bg-navy-800 shadow-elevated"
                    : "bg-navy-700 shadow-card-md"
                }`}
              >
                <svg viewBox="0 0 20 20" className="h-[22px] w-[22px] text-white" fill="none" aria-hidden="true">
                  <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" />
                </svg>
              </button>
              <span className={`mt-1.5 whitespace-nowrap text-[10px] font-semibold leading-none ${plusActive ? "text-navy-700" : "text-gray-400"}`}>
                Ações
              </span>
            </div>

            {/* Right tabs */}
            {RIGHT_TABS.map((tab) => {
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onChange(tab.id)}
                  className={`flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 transition-colors duration-150 active:scale-[0.96] ${
                    isActive ? "text-navy-700" : "text-gray-400 hover:text-gray-500"
                  }`}
                >
                  <tab.Icon active={isActive} />
                  <span className={`whitespace-nowrap text-[10px] font-semibold leading-none ${isActive ? "text-navy-700" : "text-gray-400"}`}>
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
