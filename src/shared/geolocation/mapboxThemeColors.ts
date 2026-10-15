/**
 * Ancla light brand Patio v2 (`--palette-brand` en index.css).
 * Fallback SSR / sin CSS var: no hue 250 azul-tinta.
 */
export const MAPBOX_CHART_PRIMARY_FALLBACK = "oklch(0.54 0.13 205)";

/** Lee --chart-1 del documento para pintar capas Mapbox (line-color, etc.). */
export function getChartPrimaryColor(): string {
  if (typeof document === "undefined") {
    return MAPBOX_CHART_PRIMARY_FALLBACK;
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--chart-1")
    .trim();

  return value || MAPBOX_CHART_PRIMARY_FALLBACK;
}
