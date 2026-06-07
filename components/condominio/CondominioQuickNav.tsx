"use client";

import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { id: "visao-geral", label: "Prédio" },
  { id: "revisao-mensal", label: "Hoje" },
  { id: "financeiro", label: "Financeiro" },
  { id: "documentos", label: "Documentos" },
  { id: "operacao", label: "Gestão" },
  { id: "memoria-institucional", label: "Memória" },
  { id: "dados", label: "Backup" },
] as const;

type NavId = (typeof NAV_ITEMS)[number]["id"];

export default function CondominioQuickNav() {
  const [activeId, setActiveId] = useState<NavId | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Partial<Record<NavId, HTMLButtonElement | null>>>({});

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    const thresholds = new Map<NavId, number>();

    for (const item of NAV_ITEMS) {
      const el = document.getElementById(item.id);
      if (!el) continue;

      const obs = new IntersectionObserver(
        ([entry]) => {
          thresholds.set(item.id, entry.isIntersecting ? entry.intersectionRatio : 0);
          let best: NavId | null = null;
          let bestRatio = 0;
          for (const [id, ratio] of thresholds) {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              best = id as NavId;
            }
          }
          if (best) setActiveId(best);
        },
        { threshold: [0, 0.1, 0.25, 0.5], rootMargin: "-64px 0px -40% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  useEffect(() => {
    if (!activeId || !navRef.current) return;
    const btn = btnRefs.current[activeId];
    if (!btn) return;
    const nav = navRef.current;
    nav.scrollTo({ left: btn.offsetLeft - nav.offsetWidth / 2 + btn.offsetWidth / 2, behavior: "smooth" });
  }, [activeId]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      ref={navRef}
      aria-label="Seções do condomínio"
      className="no-scrollbar overflow-x-auto px-5 pb-3 pt-1 sm:px-6"
    >
      <div className="flex gap-1.5 rounded-full border border-navy-100/70 bg-white/[0.70] p-1 shadow-card" style={{ minWidth: "max-content" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => { btnRefs.current[item.id] = el; }}
              type="button"
              onClick={() => scrollTo(item.id)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-all active:scale-[0.98] ${
                isActive
                  ? "bg-navy-800 text-white shadow-card"
                  : "text-navy-500 hover:bg-white hover:text-navy-800"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
