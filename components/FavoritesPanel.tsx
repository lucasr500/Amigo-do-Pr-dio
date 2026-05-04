"use client";

import { useEffect, useState } from "react";
import { getFavorites, removeFavorite, type FavoriteEntry } from "@/lib/session";

type FavoritesPanelProps = {
  onSelect: (q: string) => void;
  refreshKey?: number;
};

export default function FavoritesPanel({ onSelect, refreshKey }: FavoritesPanelProps) {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);

  useEffect(() => {
    // Mais recentes primeiro
    setFavorites([...getFavorites()].reverse());
  }, [refreshKey]);

  const handleRemove = (matchedId: string) => {
    removeFavorite(matchedId);
    setFavorites((prev) => prev.filter((f) => f.matchedId !== matchedId));
  };

  if (favorites.length === 0) return null;

  return (
    <section className="px-5 pb-5 sm:px-6 animate-fade-in-up">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-navy-500">
          Perguntas salvas
        </h3>
        <span className="text-[11px] text-navy-400">
          {favorites.length} {favorites.length === 1 ? "salva" : "salvas"}
        </span>
      </div>

      <div className="space-y-1.5">
        {favorites.map((fav) => (
          // Wrapper div para evitar button aninhado (HTML inválido)
          <div
            key={fav.id}
            className="flex items-center overflow-hidden rounded-xl border border-navy-100 bg-white transition-colors hover:border-navy-200"
          >
            {/* Área clicável — reabre a pergunta */}
            <button
              type="button"
              onClick={() => onSelect(fav.q)}
              className="flex flex-1 items-center gap-3 px-3.5 py-2.5 text-left"
            >
              <span className="text-[13px] text-sage-500" aria-hidden="true">
                ★
              </span>
              <span className="flex-1 truncate text-[13px] text-navy-700">
                {fav.q}
              </span>
            </button>

            {/* Botão remover */}
            <button
              type="button"
              onClick={() => handleRemove(fav.matchedId)}
              aria-label="Remover dos favoritos"
              className="flex-shrink-0 px-3 py-2.5 text-navy-200 transition-colors hover:bg-navy-50 hover:text-navy-400"
            >
              <svg
                className="h-3 w-3"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 2l8 8M10 2l-8 8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
