/**
 * EntitlementRoute
 *
 * Guard de contrato de complemento (DC2/DC4/DC7) después de ModuleRoute.
 * Sin permiso RBAC → ModuleRoute → /forbidden (sin cambio aquí).
 */

import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useEntitlement } from "@features/billing";
import { LoadingPageState } from "@shared/ui/feedback-states";

export interface EntitlementRouteProps {
  /** Código de módulo / complemento (p. ej. gps_tracking). */
  code: string;
  /** UI cuando el complemento no está contratado. */
  notContracted: ReactNode;
  /** UI cuando el kill-switch lo marca unavailable. */
  unavailable: ReactNode;
  /** Skeleton mientras carga /billing/access. */
  loading?: ReactNode;
}

function defaultLoading() {
  return (
    <div data-testid="entitlement-route-loading">
      <LoadingPageState variant="detail" />
    </div>
  );
}

/**
 * Las rutas mapa/historial llevan `handle.flush` (LayoutShell: h-dvh + overflow-hidden).
 * EntitlementRoute sustituye el Outlet por presentación/unavailable sin salir de esa
 * ruta, así que hay que permitir scroll dentro del viewport flush.
 * Altura con calc(100dvh - 4rem) = pt-16 del shell; no depende de wrappers intermedios.
 */
function FlushSafeScroll({
  children,
  testId,
}: {
  children: ReactNode;
  testId: string;
}) {
  return (
    <div
      className="h-full max-h-[calc(100dvh-4rem)] min-h-0 overflow-y-auto overscroll-contain"
      data-testid={testId}
    >
      {children}
    </div>
  );
}

export function EntitlementRoute({
  code,
  notContracted,
  unavailable,
  loading,
}: EntitlementRouteProps) {
  const { state } = useEntitlement(code);
  const loadingUi = loading ?? defaultLoading();

  switch (state) {
    case "loading":
      return <>{loadingUi}</>;
    case "not_contracted":
      return (
        <FlushSafeScroll testId="entitlement-route-not-contracted-scroll">
          {notContracted}
        </FlushSafeScroll>
      );
    case "unavailable":
      return (
        <FlushSafeScroll testId="entitlement-route-unavailable-scroll">
          {unavailable}
        </FlushSafeScroll>
      );
    case "active":
    case "unknown":
      return <Outlet />;
    default: {
      const _exhaustive: never = state;
      return _exhaustive;
    }
  }
}
