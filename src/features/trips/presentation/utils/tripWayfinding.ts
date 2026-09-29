import { isApprovalsInboxHref } from "@features/approvals";
import { shellCopy } from "../copy/tripDetail/shellCopy";

function pathOnly(href: string): string {
  return href.split("?")[0] ?? href;
}

/**
 * Label del chevron al salir del detalle de viaje.
 * Bandeja de aprobaciones → Volver a aprobaciones;
 * envío de facturas → Volver al envío / a envíos;
 * resto → Volver a Viajes.
 */
export function resolveTripWayfindingBackLabel(href: string): string {
  if (isApprovalsInboxHref(href)) {
    return shellCopy.state.backToApprovals;
  }
  const path = pathOnly(href);
  if (path === "/finance/dispatch") {
    return shellCopy.state.backToDispatch;
  }
  if (path === "/finance/dispatch/period") {
    return shellCopy.state.backToDispatchPeriod;
  }
  if (path.startsWith("/finance/dispatch/")) {
    return shellCopy.state.backToDispatchRun;
  }
  return shellCopy.state.backToList;
}

/** D9: 403 del conductor/cliente — no es suyo o pide vínculo. */
export function resolveTripAccessDeniedCopy(
  isDriverPortal: boolean,
  isClientPortal = false,
) {
  if (isClientPortal) {
    return {
      title: shellCopy.state.accessDeniedTitle,
      description: shellCopy.state.accessDeniedDescriptionClient,
      backLabel: shellCopy.state.backToListClient,
    };
  }
  return {
    title: shellCopy.state.accessDeniedTitle,
    description: isDriverPortal
      ? shellCopy.state.accessDeniedDescriptionDriver
      : shellCopy.state.accessDeniedDescription,
    backLabel: isDriverPortal
      ? shellCopy.state.backToListDriver
      : shellCopy.state.backToList,
  };
}
