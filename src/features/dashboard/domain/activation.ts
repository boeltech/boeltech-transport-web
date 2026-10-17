/**
 * Pure helpers for tenant activation checklist (F1 + F3 success/mid-setup).
 */

import { ROLES } from "@shared/constants/roles";

import type {
  ActivationData,
  ActivationItem,
  ActivationItemCode,
  ActivationOpsLevel,
  ActivationReadyHint,
} from "./types";

/** L1 masters in setup order (before first trip). */
export const ACTIVATION_L1_CODES: readonly ActivationItemCode[] = [
  "client",
  "vehicle",
  "driver",
] as const;

/** Soft-track items after first trip (fiscal + invite). */
export const ACTIVATION_SOFT_TRACK_CODES: readonly ActivationItemCode[] = [
  "company_fiscal",
  "csd_pac",
  "invite_team",
] as const;

export type ActivationListKind = "trips" | "clients" | "vehicles" | "drivers";

export type ActivationChecklistMode =
  | "full"
  | "dispatcher_compact"
  | "accountant_fiscal";

export interface ActivationEmptyGuidance {
  redirectToGap: boolean;
  gapCode: ActivationItemCode;
  ctaPath: string;
}

export function resolveActivationChecklistMode(
  role: string | undefined,
): ActivationChecklistMode | null {
  if (role === ROLES.ADMIN || role === ROLES.MANAGER) return "full";
  if (role === ROLES.DISPATCHER) return "dispatcher_compact";
  if (role === ROLES.ACCOUNTANT) return "accountant_fiscal";
  return null;
}

export function findFirstPendingL1Item(
  items: ActivationItem[],
): ActivationItem | undefined {
  for (const code of ACTIVATION_L1_CODES) {
    const item = items.find((i) => i.code === code && i.status === "pending");
    if (item) return item;
  }
  return undefined;
}

/**
 * Empty-state chaining: if a prior master is missing, point CTA at that gap
 * instead of “create this entity / reserve trip”.
 */
export function resolveActivationEmptyGuidance(
  listKind: ActivationListKind,
  activation: ActivationData | undefined,
): ActivationEmptyGuidance | null {
  if (!activation) return null;

  if (listKind === "clients") {
    return null;
  }

  if (listKind === "vehicles") {
    const clientPending = activation.items.find(
      (i) => i.code === "client" && i.status === "pending",
    );
    if (!clientPending) return null;
    return {
      redirectToGap: true,
      gapCode: "client",
      ctaPath: clientPending.ctaPath,
    };
  }

  if (listKind === "drivers") {
    const pendingL1 = findFirstPendingL1Item(activation.items);
    if (!pendingL1 || pendingL1.code === "driver") return null;
    return {
      redirectToGap: true,
      gapCode: pendingL1.code,
      ctaPath: pendingL1.ctaPath,
    };
  }

  // trips
  const pendingL1 = findFirstPendingL1Item(activation.items);
  if (!pendingL1) return null;
  return {
    redirectToGap: true,
    gapCode: pendingL1.code,
    ctaPath: pendingL1.ctaPath,
  };
}

export function hasPendingItemsForMode(
  activation: ActivationData,
  mode: ActivationChecklistMode,
): boolean {
  if (mode === "dispatcher_compact") {
    return activation.opsLevel !== "l1_complete";
  }

  if (mode === "accountant_fiscal") {
    return activation.items.some(
      (i) =>
        (i.code === "company_fiscal" || i.code === "csd_pac") &&
        i.status === "pending",
    );
  }

  return activation.items.some((i) => i.status === "pending");
}

/**
 * F3: keep checklist visible for first-trip success (admin/manager) and
 * dispatcher ops-complete brief message until local dismiss.
 */
export function shouldShowActivationChecklist(
  activation: ActivationData,
  mode: ActivationChecklistMode,
): boolean {
  if (activation.opsLevel === "l1_complete") {
    if (mode === "full" || mode === "dispatcher_compact") return true;
  }
  return hasPendingItemsForMode(activation, mode);
}

export function isOpsReadyForFiscalTrack(opsLevel: ActivationOpsLevel): boolean {
  return opsLevel === "l1_ready" || opsLevel === "l1_complete";
}

export function findPendingSoftTrackItems(
  items: ActivationItem[],
): ActivationItem[] {
  return items.filter(
    (i) =>
      ACTIVATION_SOFT_TRACK_CODES.includes(i.code) && i.status === "pending",
  );
}

/**
 * Preferred fiscal CTA from `fiscal_track.ready_hint` (accountant F3).
 */
export function resolvePreferredFiscalItem(
  items: ActivationItem[],
  readyHint: ActivationReadyHint,
): ActivationItem | undefined {
  const preferredCode: ActivationItemCode | null =
    readyHint === "missing_rfc"
      ? "company_fiscal"
      : readyHint === "missing_csd" || readyHint === "ready_for_config"
        ? "csd_pac"
        : null;
  if (!preferredCode) return undefined;
  return items.find(
    (i) => i.code === preferredCode && i.status === "pending",
  );
}

export function filterActivationItemsForMode(
  items: ActivationItem[],
  mode: ActivationChecklistMode,
): ActivationItem[] {
  if (mode === "accountant_fiscal") {
    return items.filter(
      (i) => i.code === "company_fiscal" || i.code === "csd_pac",
    );
  }
  if (mode === "dispatcher_compact") {
    return items.filter((i) => i.requiredForOps);
  }
  return items;
}
