import { useTheme } from "@shared/hooks";
import { resolveMapboxStyle } from "@shared/geolocation/mapboxStyles";

export function useMapboxStyle(): string {
  const { resolvedTheme } = useTheme();
  return resolveMapboxStyle(resolvedTheme);
}
