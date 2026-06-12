import type { ResolvedTheme } from "@shared/ui/theme/types";

export const MAPBOX_STYLE_LIGHT = "mapbox://styles/mapbox/streets-v12";
export const MAPBOX_STYLE_DARK = "mapbox://styles/mapbox/dark-v11";

export function resolveMapboxStyle(resolvedTheme: ResolvedTheme): string {
  return resolvedTheme === "dark" ? MAPBOX_STYLE_DARK : MAPBOX_STYLE_LIGHT;
}
