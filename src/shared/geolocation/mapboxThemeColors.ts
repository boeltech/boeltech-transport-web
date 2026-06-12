/** Lee --chart-1 del documento para pintar capas Mapbox (line-color, etc.). */
export function getChartPrimaryColor(): string {
  if (typeof document === "undefined") {
    return "oklch(0.55 0.16 250)";
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--chart-1")
    .trim();

  return value || "oklch(0.55 0.16 250)";
}
