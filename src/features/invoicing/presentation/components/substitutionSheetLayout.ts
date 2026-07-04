/** Layout compartido para el sheet de sustitución (header fijo, cuerpo scroll, footer anclado). */
export const SUBSTITUTION_SHEET_CONTENT_CLASS =
  "flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl";

export const SUBSTITUTION_SHEET_HEADER_CLASS =
  "shrink-0 space-y-1 border-b px-6 py-4 text-left";

export const SUBSTITUTION_SHEET_BODY_CLASS =
  "min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4";

export const SUBSTITUTION_SHEET_FOOTER_CLASS =
  "mt-auto shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end sm:space-x-2";

export const SUBSTITUTION_SHEET_PRIMARY_BUTTON_CLASS = "w-full sm:w-auto";

/** Collapsibles de correcciones opcionales (mismo patrón en todas las secciones). */
export const SUBSTITUTION_COLLAPSIBLE_CLASS = "rounded-md border";

export const SUBSTITUTION_COLLAPSIBLE_TRIGGER_CLASS =
  "flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-muted/50";

export const SUBSTITUTION_COLLAPSIBLE_CONTENT_CLASS =
  "space-y-4 border-t px-4 py-4";

export const SUBSTITUTION_COLLAPSIBLE_CHEVRON_CLASS =
  "h-4 w-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180";

/** Ancho de inputs monetarios en importes del sustituto (alineado a desglose del detalle). */
export const SUBSTITUTION_AMOUNT_INPUT_WIDTH_CLASS = "w-48";

export const SUBSTITUTION_AMOUNT_LABEL_CLASS =
  "mb-2 block text-right text-sm font-medium leading-none text-muted-foreground";
