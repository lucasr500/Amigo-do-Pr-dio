// Seções do CondominioTab visíveis apenas para gestão/conselho, nunca para moradores.
export const MANAGER_ONLY_SECTIONS = [
  "implantacao",
  "revisao-mensal",
  "financeiro",
  "documentos",
  "operacao",
  "memoria-institucional",
  "dados",
] as const;

export type ManagerOnlySection = (typeof MANAGER_ONLY_SECTIONS)[number];

// Seções da Central Digital visíveis para todos os perfis.
export const RESIDENT_VISIBLE_CENTRAL_SECTIONS = [
  "mural",
  "canal",
  "reservas",
  "enquetes",
  "documentos",
] as const;

// Seções da Central Digital exclusivas de gestão.
export const MANAGER_ONLY_CENTRAL_SECTIONS = [
  "hub",
  "timeline",
  "relatorio",
] as const;

export type CentralSectionId =
  | (typeof RESIDENT_VISIBLE_CENTRAL_SECTIONS)[number]
  | (typeof MANAGER_ONLY_CENTRAL_SECTIONS)[number];

export type ProfileRole = "manager" | "council" | "resident" | "viewer";

/** Retorna true se a seção deve ser visível para o perfil dado. */
export function isSectionVisible(sectionId: string, role: ProfileRole): boolean {
  if (role === "manager" || role === "council") return true;
  return !(MANAGER_ONLY_SECTIONS as readonly string[]).includes(sectionId);
}

/** Retorna true se a sub-seção da Central Digital está disponível para o perfil. */
export function isCentralSectionVisible(section: string, role: ProfileRole): boolean {
  if (role === "manager" || role === "council") return true;
  return (RESIDENT_VISIBLE_CENTRAL_SECTIONS as readonly string[]).includes(section);
}

/** Seção inicial padrão da Central Digital por perfil. */
export function defaultCentralSection(role: ProfileRole): CentralSectionId {
  return role === "resident" || role === "viewer" ? "mural" : "hub";
}

/** Retorna as seções do CondominioTab visíveis para o perfil. */
export function getVisibleCondominioSections(role: ProfileRole): string[] {
  const all = [
    "visao-geral",
    "implantacao",
    "revisao-mensal",
    "financeiro",
    "documentos",
    "operacao",
    "memoria-institucional",
    "central-digital",
    "dados",
  ];
  return all.filter((s) => isSectionVisible(s, role));
}
