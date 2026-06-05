export type ToolAnchor =
  | "comunicado"
  | "comunicado-infracao"
  | "comunicado-obra"
  | "comunicado-convocacao"
  | "comunicado-cobranca"
  | "simulador-multa"
  | "simulador-reajuste"
  | "checklists"
  | "registro-rapido"
  | "agenda-predio";

export type ToolGroup = "rotina" | "comunicados" | "simuladores" | "checklists" | "temas";

export const ANCHOR_TO_GROUP: Partial<Record<ToolAnchor, ToolGroup>> = {
  "registro-rapido":      "rotina",
  "agenda-predio":        "rotina",
  comunicado:             "comunicados",
  "comunicado-infracao":  "comunicados",
  "comunicado-obra":      "comunicados",
  "comunicado-convocacao":"comunicados",
  "comunicado-cobranca":  "comunicados",
  "simulador-multa":      "simuladores",
  "simulador-reajuste":   "simuladores",
  checklists:             "checklists",
};
