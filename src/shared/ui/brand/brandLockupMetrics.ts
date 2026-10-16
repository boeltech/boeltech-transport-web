/**
 * Reglas de espaciado del lockup (guía tipo “safe area” / Rilxer).
 *
 * Referencia canónica — lockup isotipo + wordmark (grid en px):
 * - Altura isotipo: 100
 * - Altura wordmark: 100  (= 1 × isotipo)
 * - Gap isotipo → wordmark: 50  (= 0.5 × isotipo)
 * - Safe area exterior (exports): 50  (= 0.5 × isotipo)
 *
 * En UI, `markSize` es la altura CSS del isotipo; gap y tipografía se derivan.
 */

export const BRAND_LOCKUP = {
  /** Altura de referencia del isotipo / wordmark en el grid de diseño. */
  REFERENCE_MARK_HEIGHT: 100,
  /** Gap horizontal isotipo → wordmark / REFERENCE_MARK_HEIGHT. */
  MARK_TO_WORDMARK_GAP_RATIO: 0.5,
  /** Margen exterior (“SAFE AREA”) / REFERENCE_MARK_HEIGHT (assets estáticos). */
  SAFE_AREA_RATIO: 0.5,
  /** Cap-height del wordmark ≈ altura del isotipo. */
  WORDMARK_HEIGHT_RATIO: 1,
  /**
   * Nudge vertical óptico del wordmark (fracción de markSize).
   * Positivo = baja el nombre. Escala con markSize en landing/auth/design-system.
   * Schibsted: em-box ya centra con `items-center`; un nudge leve (~0.04×)
   * alinea el centro de tinta del glyph con el ink del portal B
   * (calib. /welcome markSize 32 → +1.28px; Comfortaa usaba 0.08).
   */
  WORDMARK_OPTICAL_Y_OFFSET_RATIO: 0.04,
  /**
   * Gap óptico cuando el mark sustituye una letra dentro del nombre
   * (legado «la»+mark+«uno»). Más estrecho que icono|wordmark.
   */
  LETTER_MARK_GAP_RATIO: 0.06,
} as const;

/** Gap CSS entre isotipo y wordmark (guía 50/100). */
export function brandLockupGapPx(markSize: number): number {
  return markSize * BRAND_LOCKUP.MARK_TO_WORDMARK_GAP_RATIO;
}

/** Gap óptico letra↔mark cuando el isotipo actúa como letra. */
export function brandLockupLetterGapPx(markSize: number): number {
  return markSize * BRAND_LOCKUP.LETTER_MARK_GAP_RATIO;
}

/** Tamaño de fuente para que el wordmark iguale la altura del isotipo. */
export function brandLockupWordmarkFontSizePx(markSize: number): number {
  return markSize * BRAND_LOCKUP.WORDMARK_HEIGHT_RATIO;
}

/** Desplazamiento vertical óptico del wordmark respecto al isotipo. */
export function brandLockupWordmarkOpticalOffsetPx(markSize: number): number {
  return markSize * BRAND_LOCKUP.WORDMARK_OPTICAL_Y_OFFSET_RATIO;
}
