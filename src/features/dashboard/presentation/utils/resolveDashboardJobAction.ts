/**
 * Ranking Operate del CTA primario en Inicio (D1 / H1).
 * Personalizar y Actualizar quedan fuera — son terciarios del shell.
 */

import { ROLES } from "@shared/constants/roles";
import { APPROVALS_INBOX_PATH } from "@features/approvals/presentation/utils/approvalsInboxPath";
import {
  buildPendingApprovalsHref,
  type PendingApprovalsBriefCounts,
} from "../../domain/morningBrief";
import { dashboardCopy } from "../copy/dashboardCopy";

export type DashboardJobAction = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
};

export function resolveDashboardJobAction(input: {
  role: string | undefined;
  canReadTrips: boolean;
  /** Portal client/driver: sin CTA de job staff. */
  isPortal: boolean;
  showPendingApprovals: boolean;
  pendingApprovalsTotal: number | undefined;
  pendingApprovalsCounts: PendingApprovalsBriefCounts | undefined;
  alertCount: number;
  todayOpsDay: string;
  onFocusAlerts: () => void;
}): DashboardJobAction | null {
  if (input.isPortal || !input.canReadTrips) return null;

  const job = dashboardCopy.page.jobActions;

  if (input.role === ROLES.DISPATCHER) {
    return { id: "job-trips", label: job.trips, href: "/trips" };
  }

  if (input.role === ROLES.ACCOUNTANT) {
    return {
      id: "job-invoiceable",
      label: job.invoiceable,
      href: "/finance/invoiceable",
    };
  }

  if (input.role === ROLES.OPERATOR) {
    return { id: "job-trips", label: job.trips, href: "/trips" };
  }

  // admin / manager (y staff con brief): cola → alertas → viajes de hoy
  if (
    input.showPendingApprovals &&
    (input.pendingApprovalsTotal ?? 0) > 0
  ) {
    return {
      id: "job-approvals",
      label: job.pendingApprovals,
      href: buildPendingApprovalsHref(
        APPROVALS_INBOX_PATH,
        input.pendingApprovalsCounts,
      ),
    };
  }

  if (input.alertCount > 0) {
    return {
      id: "job-alerts",
      label: job.viewAlerts,
      onClick: input.onFocusAlerts,
    };
  }

  return {
    id: "job-trips-today",
    label: job.tripsToday,
    href: `/trips?opsDay=${encodeURIComponent(input.todayOpsDay)}`,
  };
}
