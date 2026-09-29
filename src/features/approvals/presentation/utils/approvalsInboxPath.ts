import type { ApprovableType } from "../../domain";

export const APPROVALS_INBOX_PATH = "/finance/approvals";

export function buildApprovalsInboxPath(params?: {
  type?: ApprovableType;
  status?: string;
  tripId?: string;
  tripCode?: string;
}): string {
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  if (params?.status) qs.set("status", params.status);
  if (params?.tripId) qs.set("tripId", params.tripId);
  if (params?.tripCode) qs.set("tripCode", params.tripCode);
  const search = qs.toString();
  return search ? `${APPROVALS_INBOX_PATH}?${search}` : APPROVALS_INBOX_PATH;
}

export function isApprovalsInboxHref(href: string): boolean {
  const path = href.split("?")[0] ?? href;
  return path === APPROVALS_INBOX_PATH || path.startsWith(`${APPROVALS_INBOX_PATH}/`);
}
