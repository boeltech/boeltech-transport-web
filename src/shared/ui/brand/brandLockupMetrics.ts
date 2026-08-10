/**
 * Reglas de espaciado del lockup laTuno (guía tipo “safe area”).
 *
 * Referencia canónica (grid en px a escala de diseño, estilo adjunto):
 * - Altura del mark / cap-height del wordmark: 100
 * - Safe area exterior (todas las caras, exports/lockup SVG): 50 (= 0.5 × altura)
 *
 * Composición del logo de producto: «la» + isotipo G + «uno»
 * (la «T» tipográfica se sustituye por el mark). El gap entre letras y mark
 * es óptico (más estrecho que un lockup icono|nombre separado).
 */

export const BRAND_LOCKUP = {
  /** Altura de referencia del mark / wordmark en el grid de diseño. */
  REFERENCE_MARK_HEIGHT: 100,
  /**
   * Gap entre segmentos tipográficos («la» / mark / «uno») /
   * REFERENCE_MARK_HEIGHT. Más estrecho que un lockup icono aparte
   * porque el mark actúa como letra.
   */
  LETTER_MARK_GAP_RATIO: 0.06,
  /** Margen exterior (“SAFE AREA”) / REFERENCE_MARK_HEIGHT (assets estáticos). */
  SAFE_AREA_RATIO: 0.5,
  /** Cap-height visual del wordmark ≈ altura del mark. */
  WORDMARK_HEIGHT_RATIO: 1,
} as const;

/** Gap CSS entre «la», mark y «uno» para un `markSize` dado. */
export function brandLockupGapPx(markSize: number): number {
  return markSize * BRAND_LOCKUP.LETTER_MARK_GAP_RATIO;
}

/** Tamaño de fuente aproximado para que «la»/«uno» igualen la altura del mark. */
export function brandLockupWordmarkFontSizePx(markSize: number): number {
  return markSize * BRAND_LOCKUP.WORDMARK_HEIGHT_RATIO;
}
