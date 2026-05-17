"use client";

export type AppTab = "inicio" | "assistente" | "ferramentas" | "condominio";

const TABS: Array<{ id: AppTab; label: string }> = [
  { id: "inicio",      label: "Início" },
  { id: "assistente",  label: "Assistente" },
  { id: "ferramentas", label: "Ferramentas" },
  { id: "condominio",  label: "Condomínio" },
];

function IconHome({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <path
        d="M3 9.5L10 3.5L17 9.5V17H12.5V12.5H7.5V17H3V9.5Z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChat({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <path
        d="M3.5 4.5h13a1 1 0 011 1v7a1 1 0 01-1 1H12l-3.5 3V13.5H3.5a1 1 0 01-1-1v-7a1 1 0 011-1z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGrid({ active }: { active: boolean }) {
  const w = active ? 2 : 1.5;
  return (
    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <rect x="3"    y="3"    width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth={w} />
      <rect x="11.5" y="3"    width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth={w} />
      <rect x="3"    y="11.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth={w} />
      <rect x="11.5" y="11.5" width="5.5" height="5.5" rx="1.2" stroke="currentColor" strokeWidth={w} />
    </svg>
  );
}

function IconBuilding({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <path
        d="M4 17.5V7L10 3.5L16 7V17.5H12.5V13H7.5V17.5H4Z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="8.5" y="8.5" width="3" height="3" rx="0.5" stroke="currentColor" strokeWidth={1} />
    </svg>
  );
}

const ICONS: Record<AppTab, (props: { active: boolean }) => React.JSX.Element> = {
  inicio:      IconHome,
  assistente:  IconChat,
  ferramentas: IconGrid,
  condominio:  IconBuilding,
};

type Props = {
  active: AppTab;
  onChange: (tab: AppTab) => void;
};

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      role="tablist"
      aria-label="Navegação principal"
    >
      <div className="mx-auto max-w-[440px]">
        <div
          className="border-t border-cream-200/80 bg-[#fffaf1]/[0.96] shadow-[0_-10px_30px_-26px_rgba(31,49,71,0.45)] backdrop-blur-xl"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 7px)" }}
        >
          <div className="flex items-center px-1">
            {TABS.map((tab) => {
              const isActive = active === tab.id;
              const Icon = ICONS[tab.id];
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onChange(tab.id)}
                  className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl px-1 transition-all duration-150 active:scale-[0.97] ${
                    isActive ? "text-navy-800" : "text-navy-400 hover:text-navy-600"
                  }`}
                >
                  <span className={isActive ? "rounded-full bg-navy-50 px-3 py-1 text-navy-800" : "px-3 py-1"}>
                    <Icon active={isActive} />
                  </span>
                  <span
                    className={`text-[10.5px] font-semibold leading-none ${
                      isActive ? "text-navy-800" : "text-navy-400"
                    }`}
                  >
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
