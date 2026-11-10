export type CompositionBlockId = "rules" | "allowances" | "corridors";

export type CompositionBlockStatus = "complete" | "empty" | "warning";

export interface CompositionBlockItem {
  title: string;
  subtitle?: string;
  amount?: string;
}

export interface TemplateCompositionBlock {
  id: CompositionBlockId;
  label: string;
  status: CompositionBlockStatus;
  items: CompositionBlockItem[];
}

export type TemplateCompletenessStep = CompositionBlockId;

/**
 * Secciones del Builder F1 (fórmula visible).
 * `trips` = Por cada viaje (corredores + reglas + medio viaje).
 * `result` = término «Recibe el operador» (enfoca inspector; no es canvas).
 */
export type BuilderSectionId = "trips" | "allowances" | "deductions";

/** Término de resultado de la fórmula (no navega a sección de canvas). */
export const BUILDER_RESULT_TERM_ID = "result" as const;
export type BuilderFormulaTermId = BuilderSectionId | typeof BUILDER_RESULT_TERM_ID;

export type BuilderSectionStatus = "complete" | "partial" | "empty";

export interface TemplateCompleteness {
  isComplete: boolean;
  missingSteps: TemplateCompletenessStep[];
  /** Estado visual por sección del Builder (F3). */
  sectionStatuses: Record<BuilderSectionId, BuilderSectionStatus>;
}

/** Estado de uso en catálogo. */
export type TemplateUsageStatus =
  | "ready"
  | "ready_to_activate"
  | "needs_payment"
  | "superseded_paying"
  | "paused";

export interface TemplateSummaryLine {
  id: string;
  text: string;
  /** Hint-style line (muted in inspector); omitted from compact card summary. */
  variant?: "default" | "hint";
}
