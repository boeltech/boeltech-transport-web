import { useEntitlement } from "@features/billing";

const GPS_MODULE = "gps_tracking";

/**
 * Conveniencia GPS sobre `useEntitlement("gps_tracking")`.
 * Conserva `showNotActivated` / `canUseModule` para no romper F3 (páginas).
 *
 * - `showNotActivated` = `not_contracted` (UI presentación = F3)
 * - `canUseModule` = `active` | `unknown` (unknown deja pasar a la API)
 * - `unavailable` / `loading` / `not_contracted` → no consultar módulo
 */
export function useGpsTrackingEntitlement() {
  const entitlement = useEntitlement(GPS_MODULE);
  const showNotActivated = entitlement.state === "not_contracted";
  const canUseModule =
    entitlement.state === "active" || entitlement.state === "unknown";

  return {
    ...entitlement,
    hasModule: entitlement.state === "active",
    showNotActivated,
    canUseModule,
  };
}
