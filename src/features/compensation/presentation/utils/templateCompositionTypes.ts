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

/** Secciones del Builder (ADR-0091 · Addendum D5.1 — identidad fuera del nav). */
export type BuilderSectionId = "payment" | "allowances" | "corridors";

export type BuilderSectionStatus = "complete" | "partial" | "empty";

export interface TemplateCompleteness {
  isComplete: boolean;
  missingSteps: TemplateCompletenessStep[];
  /** Estado visual por sección del Builder (F3). */
  sectionStatuses: Record<BuilderSectionId, BuilderSectionStatus>;
}

/** Estado de uso en catálogo: activo+completo | activo+incompleto | inactivo. */
export type TemplateUsageStatus = "ready" | "needs_payment" | "paused";

export interface TemplateSummaryLine {
  id: string;
  text: string;
}
