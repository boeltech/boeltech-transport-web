import { useHasBillingModule } from "@features/billing";

const GPS_MODULE = "gps_tracking";

/**
 * Entitlement gate for Monitoreo GPS (piloto: sin paywall de venta).
 * Solo muestra “módulo no activado” cuando /billing/access responde OK
 * y `gps_tracking` no está en effectiveModuleCodes. Error/idle ≠ no entitled.
 */
export function useGpsTrackingEntitlement() {
  const access = useHasBillingModule(GPS_MODULE);
  const showNotActivated = access.isSuccess && !access.hasModule;
  /** Evita 403 ruidosos mientras access carga; si access falla, deja pasar al API. */
  const canUseModule =
    !showNotActivated &&
    !(access.isLoading || (access.isFetching && !access.isSuccess));

  return {
    ...access,
    showNotActivated,
    canUseModule,
  };
}
