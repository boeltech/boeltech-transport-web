import { useIncomingFrom } from "@shared/utils/listQueueFrom";
import {
  MASTER_WAYFINDING_COPY,
  resolveMasterBackHref,
} from "@shared/utils/masterWayfinding";
import { usersCopy } from "../copy/usersCopy";

export const USERS_LIST_PATH = "/users";
export const USERS_ACTIVITY_PATH = "/users/activity";

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
