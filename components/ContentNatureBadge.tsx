// ─── Selo de natureza do conteúdo ─────────────────────────────────────────────
// Componente presentational (props-driven). Torna VISÍVEL e consistente a
// separação jurídica derivada em lib/content-nature.ts. Sem storage, sem lógica.
// A descrição jurídica vai no `title` (tooltip) — discreto, à mão quando preciso.

import type { ContentNature } from "@/lib/content-nature";
import { CONTENT_NATURE_LABELS, CONTENT_NATURE_DESCRIPTION } from "@/lib/content-nature";

const NATURE_STYLES: Record<ContentNature, string> = {
  opiniao:     "bg-amber-50 text-amber-700 ring-amber-100",
  comunicado:  "bg-navy-100 text-navy-700 ring-navy-200",
  deliberacao: "bg-sage-50 text-sage-700 ring-sage-100",
};

const NATURE_DOT: Record<ContentNature, string> = {
  opiniao:     "bg-amber-400",
  comunicado:  "bg-navy-500",
  deliberacao: "bg-sage-500",
};

export default function ContentNatureBadge({
  nature,
  size = "sm",
  showDot = true,
  title,
}: {
  nature: ContentNature;
  size?: "xs" | "sm";
  showDot?: boolean;
  title?: string;
}) {
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[9.5px]" : "px-2 py-0.5 text-[10px]";
  return (
    <span
      title={title ?? CONTENT_NATURE_DESCRIPTION[nature]}
      className={`inline-flex items-center gap-1 rounded-full font-medium uppercase tracking-[0.06em] ring-1 ring-inset ${pad} ${NATURE_STYLES[nature]}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${NATURE_DOT[nature]}`} />}
      {CONTENT_NATURE_LABELS[nature]}
    </span>
  );
}
