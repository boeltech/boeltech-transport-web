import { useLocation } from "react-router-dom";
import {
  COMPENSATION_HUB_PATH,
  LEGACY_AGREEMENTS_PATH,
} from "@features/compensation/application";
import { FINANCE_APPROVALS_PATH } from "@features/finance/application";
import {
  canonicalizeSettlementReturnHref,
  isSafeSettlementReturnHref,
} from "../../application/settlementReturnHref";
import {
  SETTLEMENTS_ADVANCES_PATH,
  SETTLEMENTS_CREATE_PATH,
  SETTLEMENTS_LIST_PATH,
  SETTLEMENTS_PENDING_APPROVAL_PATH,
  SETTLEMENTS_REGISTRY_PATH,
} from "../../application/settlementsRoutes";
import { settlementsCopy } from "../copy/settlementsCopy";

export { isSafeSettlementReturnHref };

/** `location.state.from` = cola actual (pathname + query). */
export function useSettlementQueueFromState(): { from: string } {
  const { pathname, search } = useLocation();
  return { from: `${pathname}${search}` };
}

function hrefPath(href: string): string {
  return href.split("?")[0] ?? href;
}

function hrefSearch(href: string): string {
  const q = href.indexOf("?");
  return q >= 0 ? href.slice(q + 1) : "";
}

/** Alta de pago: destino válido de `state.from` al salir a Tarifas / empleado. */
export function isSettlementCreateHref(href: string): boolean {
  return hrefPath(href) === SETTLEMENTS_CREATE_PATH;
}

export function resolveSettlementBackHref(from: string | undefined): string {
  if (from && isSafeSettlementReturnHref(from)) {
    return canonicalizeSettlementReturnHref(from);
  }
  return SETTLEMENTS_LIST_PATH;
}

export function resolveSettlementWayfindingBackLabel(href: string): string {
  const path = hrefPath(href);
  const search = hrefSearch(href);
  const copy = settlementsCopy.actions;
  const bucket = new URLSearchParams(search).get("bucket");

  if (
    path === SETTLEMENTS_PENDING_APPROVAL_PATH ||
    (path === SETTLEMENTS_LIST_PATH && bucket === "approval")
  ) {
    return copy.backToPendingApproval;
  }
  if (path === SETTLEMENTS_REGISTRY_PATH) return copy.backToRegistry;
  if (path === SETTLEMENTS_ADVANCES_PATH) return copy.backToAdvances;
  if (
    path === FINANCE_APPROVALS_PATH ||
    path.startsWith(`${FINANCE_APPROVALS_PATH}/`)
  ) {
    return copy.backToApprovals;
  }
  if (
    path === COMPENSATION_HUB_PATH ||
    path.startsWith(`${COMPENSATION_HUB_PATH}/`) ||
    path === LEGACY_AGREEMENTS_PATH
  ) {
    return copy.backToAgreements;
  }
  if (path === SETTLEMENTS_LIST_PATH) return copy.backToWorkbench;
  return copy.backToList;
}
