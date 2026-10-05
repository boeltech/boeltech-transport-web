import type {
  SettlementBacklogRow,
  SettlementPeriodOverlap,
  SettlementPeriodOverlapStatus,
} from "../../domain/entities";
import { SETTLEMENT_STATUS_LABELS } from "../../domain/enums";
import {
  settlementCreatePath,
  settlementDetailPath,
  settlementsPendingApprovalPath,
  settlementsRegistryPath,
} from "../../application/settlementsRoutes";
import { formatDate } from "@shared/utils/dateUtils";
import { settlementsCopy } from "../copy/settlementsCopy";

const DAY_MS = 24 * 60 * 60 * 1000;
const folioCopy = settlementsCopy.workbench.periodOverlapFolio;

/** Badge + tooltip F3 según status del conflicto; null/ausente → copy genérico F1. */
export function resolvePeriodOverlapWarningCopy(
  status: SettlementPeriodOverlapStatus | null | undefined,
): { badge: string; tooltip: string } {
  const w = settlementsCopy.workbench.warnings;
  if (status === "disbursed") {
    return {
      badge: w.period_overlap_disbursed,
      tooltip: w.period_overlap_tooltip_disbursed,
    };
  }
  if (
    status === "draft" ||
    status === "pending_approval" ||
    status === "approved"
  ) {
    return {
      badge: w.period_overlap_in_progress,
      tooltip: w.period_overlap_tooltip_in_progress,
    };
  }
  return {
    badge: w.period_overlap,
    tooltip: w.period_overlap_tooltip,
  };
}

/** CTA F2 del badge period_overlap; null/ausente → registry F1. */
export function resolvePeriodOverlapCtaPath(
  employeeId: string,
  periodOverlap: SettlementPeriodOverlap | null | undefined,
): string {
  const registryHref = settlementsRegistryPath({ employeeId });
  if (!periodOverlap) return registryHref;

  const { settlementId, conflictsCount, status } = periodOverlap;
  if (conflictsCount === 1 && settlementId) {
    return settlementDetailPath(settlementId);
  }
  if (conflictsCount > 1) {
    if (status === "pending_approval") {
      return settlementsPendingApprovalPath({ driverId: employeeId });
    }
    return registryHref;
  }
  return registryHref;
}

/**
 * ADR-0085 E11 — «LIQ-… · Borrador · creado hace n días»; la antigüedad solo en borrador o por autorizar.
 * null si el API no trae folio.
 */
export function formatPeriodOverlapFolioLabel(
  periodOverlap: SettlementPeriodOverlap | null | undefined,
  now: number = Date.now(),
): string | null {
  if (!periodOverlap?.settlementNumber) return null;
  const statusLabel = SETTLEMENT_STATUS_LABELS[periodOverlap.status] ?? periodOverlap.status;
  const showsAge =
    periodOverlap.status === "draft" || periodOverlap.status === "pending_approval";
  const createdAt = periodOverlap.createdAt ? Date.parse(periodOverlap.createdAt) : Number.NaN;
  const age =
    showsAge && !Number.isNaN(createdAt)
      ? folioCopy.age(Math.max(0, Math.floor((now - createdAt) / DAY_MS)))
      : null;
  return folioCopy.label(periodOverlap.settlementNumber, statusLabel, age);
}

function resolveSuggestedPeriodStart(row: SettlementBacklogRow): string | null {
  const suggested = row.suggestedPeriodStart;
  return row.periodOverlap?.overlapKind === "partial" && suggested && suggested <= row.periodEnd
    ? suggested
    : null;
}

/** ADR-0085 E11 — tooltip del badge según tipo de cruce; sin `overlapKind` usa el copy por estado. */
export function resolvePeriodOverlapTooltip(row: SettlementBacklogRow): string {
  const overlap = row.periodOverlap;
  const folio = overlap?.settlementNumber;
  if (folio && overlap?.overlapKind === "contained") {
    return folioCopy.tooltipContained(folio);
  }
  const suggested = resolveSuggestedPeriodStart(row);
  if (folio && suggested) {
    return folioCopy.tooltipPartial(folio, formatDate(suggested));
  }
  return resolvePeriodOverlapWarningCopy(overlap?.status).tooltip;
}

/** ADR-0085 E11 — con solape parcial, armar arranca al día siguiente del pago vivo. */
export function resolveBacklogCreatePath(row: SettlementBacklogRow): string {
  if (row.rowType === "reimbursement_only") {
    return settlementCreatePath({ kind: "reimbursements", employeeId: row.employeeId });
  }
  return settlementCreatePath({
    employeeId: row.employeeId,
    periodStart: resolveSuggestedPeriodStart(row) ?? row.periodStart,
    periodEnd: row.periodEnd,
  });
}
