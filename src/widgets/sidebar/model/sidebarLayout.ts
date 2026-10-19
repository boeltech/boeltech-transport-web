/**
 * Anchos del riel de navegación (desktop).
 * LayoutShell / Header deben usar las mismas constantes.
 */
export const SIDEBAR_WIDTH_PX = 240;
export const SIDEBAR_COLLAPSED_WIDTH_PX = 56;

/** Clases Tailwind alineadas a SIDEBAR_*_PX (lg+). */
export const SIDEBAR_WIDTH_CLASS = "w-[240px]";
export const SIDEBAR_COLLAPSED_WIDTH_CLASS = "w-[56px]";
export const SIDEBAR_MAIN_OFFSET_CLASS = "lg:ml-[240px]";
export const SIDEBAR_MAIN_OFFSET_COLLAPSED_CLASS = "lg:ml-[56px]";
export const SIDEBAR_HEADER_LEFT_CLASS = "lg:left-[240px]";
export const SIDEBAR_HEADER_LEFT_COLLAPSED_CLASS = "lg:left-[56px]";

/**
 * Transición compartida de layout (aside width, header left, main margin).
 * Misma curva en los tres para evitar desfase al colapsar/expandir.
 * `motion-reduce` anula el movimiento de chrome.
 */
export const SIDEBAR_LAYOUT_TRANSITION_CLASS =
  "transition-[width,margin-left,left] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none";

/**
 * Fade corto de labels (ítem + grupo) al expandir/colapsar.
 * Más breve que el layout; instantáneo con reduced-motion.
 */
export const SIDEBAR_LABEL_FADE_CLASS =
  "transition-opacity duration-150 ease-out motion-reduce:transition-none";
