// Categorias padrão de receitas e despesas condominiais.
// Usadas apenas pelos componentes financeiros (dynamic imports — fora do bundle inicial).

export type CategoriaFinanceira = {
  id: string;
  label: string;
  icon: string;
  color: string; // classe Tailwind de texto
  bgColor: string; // classe Tailwind de fundo
};

export const CATEGORIAS_RECEITA: CategoriaFinanceira[] = [
  { id: "cotas",         label: "Cotas condominiais", icon: "🏠", color: "text-teal-700",  bgColor: "bg-teal-50"  },
  { id: "acordos",       label: "Acordos",            icon: "🤝", color: "text-teal-600",  bgColor: "bg-teal-50"  },
  { id: "rendimentos",   label: "Rendimentos",        icon: "📈", color: "text-emerald-700", bgColor: "bg-emerald-50" },
  { id: "rateios",       label: "Rateios",            icon: "💱", color: "text-teal-600",  bgColor: "bg-teal-50"  },
  { id: "outros_rec",    label: "Outros",             icon: "➕", color: "text-navy-600",  bgColor: "bg-navy-50"  },
];

export const CATEGORIAS_DESPESA: CategoriaFinanceira[] = [
  { id: "administradora", label: "Administradora",   icon: "🏢", color: "text-navy-600",       bgColor: "bg-navy-50"     },
  { id: "folha",          label: "Folha",            icon: "👤", color: "text-navy-600",       bgColor: "bg-navy-50"     },
  { id: "manutencao",     label: "Manutenção",       icon: "🔧", color: "text-amber-700",      bgColor: "bg-amber-50"    },
  { id: "elevadores",     label: "Elevadores",       icon: "🛗", color: "text-amber-700",      bgColor: "bg-amber-50"    },
  { id: "agua",           label: "Água",             icon: "💧", color: "text-blue-700",       bgColor: "bg-blue-50"     },
  { id: "energia",        label: "Energia",          icon: "⚡", color: "text-yellow-700",     bgColor: "bg-yellow-50"   },
  { id: "limpeza",        label: "Limpeza",          icon: "🧹", color: "text-teal-600",       bgColor: "bg-teal-50"     },
  { id: "obras",          label: "Obras",            icon: "🏗️", color: "text-orange-700",     bgColor: "bg-orange-50"   },
  { id: "juridico",       label: "Jurídico",         icon: "⚖️", color: "text-navy-700",       bgColor: "bg-navy-50"     },
  { id: "seguro",         label: "Seguro",           icon: "🛡️", color: "text-navy-600",       bgColor: "bg-navy-50"     },
  { id: "outros_desp",    label: "Outros",           icon: "➕", color: "text-navy-500",       bgColor: "bg-navy-50"     },
];

export const TODAS_CATEGORIAS: CategoriaFinanceira[] = [
  ...CATEGORIAS_RECEITA,
  ...CATEGORIAS_DESPESA,
];

export function getCategoriaLabel(id: string): string {
  return TODAS_CATEGORIAS.find((c) => c.id === id)?.label ?? id;
}

export function getCategoriaIcon(id: string): string {
  return TODAS_CATEGORIAS.find((c) => c.id === id)?.icon ?? "💰";
}

export function getCategoriaColor(id: string): string {
  return TODAS_CATEGORIAS.find((c) => c.id === id)?.color ?? "text-navy-600";
}

export function getCategoriasBgColor(id: string): string {
  return TODAS_CATEGORIAS.find((c) => c.id === id)?.bgColor ?? "bg-navy-50";
}
