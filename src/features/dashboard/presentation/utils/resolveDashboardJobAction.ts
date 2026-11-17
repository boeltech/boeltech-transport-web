/**
 * CTA primaria del Inicio (Q13 / I9).
 * Personalizar y Actualizar quedan fuera — son ghost/terciarios del shell.
 */

import { ROLES } from "@shared/constants/roles";
import { dashboardCopy } from "../copy/dashboardCopy";
import type { AttentionRowId } from "../../domain/attentionQueue";

export type DashboardJobAction = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
};

export type DashboardJobPending = {
  id: AttentionRowId;
  count: number;
  /** Texto corto para el CTA (p. ej. «por autorizar»). */
  labelDetail: string;
  href: string;
  /** Verbo de CTA de fila (Revisar / Ver viajes / …). */
  ctaVerb: string;
};

export function resolveDashboardJobAction(input: {
  role: string | undefined;
  canReadTrips: boolean;
  canCreateTrip: boolean;
  /** Portal client/driver: sin CTA de job staff. */
  isPortal: boolean;
  /** Primer pendiente visible (ya ordenado por urgencia). */
  firstPending: DashboardJobPending | null;
}): DashboardJobAction | null {
  if (input.isPortal) return null;

  const job = dashboardCopy.page.jobActions;

  if (input.role === ROLES.ACCOUNTANT) {
    return {
      id: "job-invoiceable",
      label: job.invoiceable,
      href: "/finance/invoiceable",
    };
  }

  if (input.role === ROLES.DISPATCHER || input.role === ROLES.OPERATOR) {
    if (input.canCreateTrip) {
      return { id: "job-new-trip", label: job.newTrip, href: "/trips/new" };
    }
    if (input.canReadTrips) {
      return { id: "job-trips", label: job.trips, href: "/trips" };
    }
    return null;
  }

  // admin / manager: primer pendiente → Nuevo viaje si al día
  if (input.firstPending && input.firstPending.count > 0) {
    const p = input.firstPending;
    return {
      id: `job-${p.id}`,
      label: `${p.ctaVerb} ${p.count} ${p.labelDetail}`,
      href: p.href,
    };
  }

  if (input.canCreateTrip) {
    return { id: "job-new-trip", label: job.newTrip, href: "/trips/new" };
  }

  if (input.canReadTrips) {
    return { id: "job-trips", label: job.trips, href: "/trips" };
  }

  return null;
}
