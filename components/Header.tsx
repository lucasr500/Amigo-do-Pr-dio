export default function Header() {
  return (
    <header className="px-5 pt-7 pb-4 sm:px-6 sm:pt-9 sm:pb-5">
      <div className="flex items-center gap-3 animate-fade-in">
        {/* Logo monograma — abstrato, transmite "prédio" + "amigo" */}
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-navy-800 shadow-sm">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 text-cream-50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Silhueta minimalista de prédio */}
            <rect x="5" y="7" width="6" height="13" rx="0.5" fill="currentColor" opacity="0.95" />
            <rect x="13" y="4" width="6" height="16" rx="0.5" fill="currentColor" />
            <rect x="6.5" y="9" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="8.3" y="9" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="6.5" y="11.5" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="8.3" y="11.5" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="14.5" y="6.5" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="16.3" y="6.5" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="14.5" y="9" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="16.3" y="9" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="14.5" y="11.5" width="1.2" height="1.2" fill="#1f3147" />
            <rect x="16.3" y="11.5" width="1.2" height="1.2" fill="#1f3147" />
            {/* Pequena folha verde — "amigo", traz humanidade */}
            <circle cx="19.5" cy="5" r="1.6" fill="#6fa97c" />
          </svg>
        </div>

        <div className="flex flex-col leading-tight">
          <h1 className="font-display text-[19px] font-semibold tracking-tight text-navy-800 sm:text-xl">
            Amigo do Prédio
          </h1>
          <p className="text-[12px] text-navy-500 sm:text-[13px]">
            Seu assistente para decisões no condomínio
          </p>
        </div>

        {/* Indicador discreto "online" */}
        <div className="ml-auto flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1 ring-1 ring-sage-100">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-pulse-soft rounded-full bg-sage-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sage-500" />
          </span>
          <span className="text-[10.5px] font-medium uppercase tracking-wider text-sage-700">
            Online
          </span>
        </div>
      </div>
    </header>
  );
}
