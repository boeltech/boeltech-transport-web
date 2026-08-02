/** Layout compartido de los sheets de Configuración (header fijo, cuerpo scroll, footer anclado). */
export const SETTINGS_SHEET_CONTENT_CLASS =
  "flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl";

/** Domicilio: el bloque SAT necesita más ancho que identidad o contacto. */
export const SETTINGS_SHEET_WIDE_CONTENT_CLASS =
  "flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl";

export const SETTINGS_SHEET_HEADER_CLASS =
  "shrink-0 space-y-1 border-b px-6 py-4 text-left";

export const SETTINGS_SHEET_BODY_CLASS =
  "min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4";

export const SETTINGS_SHEET_FOOTER_CLASS =
  "mt-auto shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end sm:space-x-2";

export const SETTINGS_SHEET_PRIMARY_BUTTON_CLASS = "w-full sm:w-auto";
