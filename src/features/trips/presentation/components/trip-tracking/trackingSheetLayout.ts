/** Layout compartido para sheets de seguimiento (header fijo, cuerpo scroll, footer anclado). */
export const TRACKING_SHEET_CONTENT_CLASS =
  "flex h-full w-full flex-col overflow-hidden sm:max-w-md";

/** Confirmación densa (alerta + efectos + CTA largo): un poco más de aire que `max-w-md`. */
export const TRACKING_SHEET_CONFIRM_CONTENT_CLASS =
  "flex h-full w-full flex-col overflow-hidden sm:max-w-lg";

export const TRACKING_SHEET_HEADER_CLASS = "shrink-0";

export const TRACKING_SHEET_BODY_CLASS =
  "min-h-0 flex-1 space-y-4 overflow-y-auto py-2";

export const TRACKING_SHEET_FOOTER_CLASS =
  "mt-auto shrink-0 flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end sm:space-x-2";

/**
 * Footer con hint de transición bajo los botones.
 * SheetFooter / TRACKING_SHEET_FOOTER_CLASS usan `sm:flex-row`; el hint no cabe al lado del CTA.
 */
export const TRACKING_SHEET_FOOTER_STACKED_CLASS =
  "mt-auto shrink-0 flex-col gap-3 border-t border-border pt-4 sm:flex-col sm:items-stretch sm:justify-start sm:space-x-0";

export const TRACKING_SHEET_PRIMARY_BUTTON_CLASS = "w-full sm:w-auto";
