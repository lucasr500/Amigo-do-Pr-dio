"use client";

import { useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { id: "visao-geral",    label: "Meu prédio" },
  { id: "revisao-mensal", label: "Revisão" },
  { id: "financeiro",     label: "Financeiro" },
  { id: "documentos",     label: "Documentos" },
  { id: "operacao",       label: "Operação" },
  { id: "dados",          label: "Dados" },
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
          // Escolhe o item com maior interseção
          let best: NavId | null = null;
          let bestRatio = 0;
          for (const [id, ratio] of thresholds) {
            if (ratio > bestRatio) { bestRatio = ratio; best = id as NavId; }
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

  // Scroll o botão ativo para o centro da nav horizontal
  useEffect(() => {
    if (!activeId || !navRef.current) return;
    const btn = btnRefs.current[activeId];
    if (!btn) return;
    const nav = navRef.current;
    const btnLeft = btn.offsetLeft;
    const btnWidth = btn.offsetWidth;
    const navWidth = nav.offsetWidth;
    nav.scrollTo({ left: btnLeft - navWidth / 2 + btnWidth / 2, behavior: "smooth" });
  }, [activeId]);

  const scrollTo = (id: string) => {
    if (typeof window === "undefined") return;
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      ref={navRef}
      aria-label="Seções do condomínio"
      className="overflow-x-auto px-5 pb-2 pt-1 sm:px-6"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex gap-2" style={{ minWidth: "max-content" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => { btnRefs.current[item.id] = el; }}
              type="button"
              onClick={() => scrollTo(item.id)}
              className={`flex-shrink-0 rounded-full border px-3 py-1.5 text-[11.5px] font-medium shadow-sm transition-all active:scale-[0.97] ${
                isActive
                  ? "border-navy-600 bg-navy-700 text-white shadow-[0_2px_8px_rgba(35,75,99,0.3)]"
                  : "border-navy-100 bg-white text-navy-600 hover:border-navy-200 hover:bg-navy-50"
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
