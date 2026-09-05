import { isApiError } from "@shared/api/interceptors/error-handler";
import type { SettlementPreview } from "../../domain/entities";

export type SettlementCompensationReadiness = "ready" | "missing_scheme" | "incomplete";

/**
 * Readiness de compensación vía plantilla ADR-0089 (cutover D11 — sin fallback legacy).
 */
export function resolveSettlementCompensationReadiness(
  preview: SettlementPreview | null | undefined,
  previewError?: unknown,
): SettlementCompensationReadiness {
  if (isApiError(previewError) && previewError.code === "MISSING_COMPENSATION_SCHEME") {
    return "missing_scheme";
  }

  if (preview?.template?.id) {
    const hasBaseSalary = (preview.summary.totalBaseSalary ?? 0) > 0;
    const hasCommissions = (preview.summary.totalCommissions ?? 0) > 0;
    const hasAllowances = (preview.summary.totalFixedAllowances ?? 0) > 0;
    const hasActiveAllowance = (preview.fixedAllowances ?? []).some(
      (line) => !line.suspended && line.amount > 0,
    );
    const hasRules = (preview.agreement.rules?.length ?? 0) > 0;

    if (hasBaseSalary || hasCommissions || hasAllowances || hasActiveAllowance || hasRules) {
      return "ready";
    }
    return "incomplete";
  }

  if (preview) {
    return "missing_scheme";
  }

  return "missing_scheme";
}

export function isSettlementCompensationReady(
  preview: SettlementPreview | null | undefined,
  previewError?: unknown,
): boolean {
  return resolveSettlementCompensationReadiness(preview, previewError) === "ready";
}
