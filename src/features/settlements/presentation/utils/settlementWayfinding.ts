import { useLocation } from "react-router-dom";
import {
  SETTLEMENTS_ADVANCES_PATH,
  SETTLEMENTS_CREATE_PATH,
  SETTLEMENTS_LIST_PATH,
  SETTLEMENTS_PENDING_APPROVAL_PATH,
  SETTLEMENTS_REGISTRY_PATH,
} from "../../application/settlementsRoutes";
import { settlementsCopy } from "../copy/settlementsCopy";

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

/** Solo colas internas de pagos / aprobaciones / esquemas. */
export function isSafeSettlementReturnHref(href: string): boolean {
  const path = hrefPath(href);
  if (path === SETTLEMENTS_CREATE_PATH) return false;
  if (path === "/finance/approvals" || path.startsWith("/finance/approvals/")) {
    return true;
  }
  if (path === "/finance/compensation" || path.startsWith("/finance/compensation/")) {
    return true;
  }
  if (path === SETTLEMENTS_LIST_PATH || path.startsWith(`${SETTLEMENTS_LIST_PATH}/`)) {
    return true;
  }
  return false;
}

export function resolveSettlementBackHref(from: string | undefined): string {
  if (from && isSafeSettlementReturnHref(from)) return from;
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
  if (path === "/finance/approvals" || path.startsWith("/finance/approvals/")) {
    return copy.backToApprovals;
  }
  if (path === SETTLEMENTS_LIST_PATH) return copy.backToWorkbench;
  return copy.backToList;
}
