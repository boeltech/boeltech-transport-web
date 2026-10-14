import { useIncomingFrom } from "@shared/utils/listQueueFrom";
import {
  MASTER_WAYFINDING_COPY,
  resolveMasterBackHref,
} from "@shared/utils/masterWayfinding";
import { usersCopy } from "../copy/usersCopy";

export const USERS_LIST_PATH = "/users";
export const USERS_ACTIVITY_PATH = "/users/activity";

/** Query flag: abre AddUserSheet (alta canónica) en el listado. */
export const USERS_CREATE_QUERY = "create";
export const USERS_CREATE_VALUE = "1";

/**
 * D10 — `/users/new` redirige aquí (Sheet en listado), no a FormPageShell.
 * Barato: el listado ya monta `AddUserSheet`.
 */
export function usersCreatePath(): string {
  return `${USERS_LIST_PATH}?${USERS_CREATE_QUERY}=${USERS_CREATE_VALUE}`;
}

export function isUsersCreateQuery(
  value: string | null | undefined,
): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === USERS_CREATE_VALUE || normalized === "true";
}

function hrefPath(href: string): string {
  return href.split("?")[0] ?? href;
}

export function resolveUserBackLabel(href: string): string {
  const path = hrefPath(href);
  if (path === "/dashboard") return MASTER_WAYFINDING_COPY.backToDashboard;
  if (path === USERS_ACTIVITY_PATH) return usersCopy.detail.backToActivity;
  return usersCopy.detail.backToList;
}

export function useUserDetailWayfinding(): {
  backHref: string;
  backLabel: string;
  fromState: { from: string };
} {
  const incoming = useIncomingFrom();
  const backHref = resolveMasterBackHref(incoming, USERS_LIST_PATH);
  const backLabel = resolveUserBackLabel(backHref);
  return { backHref, backLabel, fromState: { from: backHref } };
}
