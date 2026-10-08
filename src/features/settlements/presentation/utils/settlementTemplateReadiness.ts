import { isApiError } from "@shared/api/interceptors/error-handler";
import type { SettlementPreview } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";

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

/** api#59 V5: motivos de bloqueo de tarifa que tienen copy propio. */
export type BlockedSchemeReason = "template_deactivated" | "template_draft";

export interface BlockedSchemeDetails {
  readonly reason: BlockedSchemeReason;
  readonly templateName: string | null;
  readonly templateVersion: number | null;
}

/**
 * 422 `MISSING_COMPENSATION_SCHEME` con `details.reason` de tarifa desactivada o en borrador.
 * `no_assignment`, sin `details` o un motivo desconocido → `null` (copy actual).
 */
export function parseMissingCompensationSchemeError(error: unknown): BlockedSchemeDetails | null {
  if (!isApiError(error) || error.code !== "MISSING_COMPENSATION_SCHEME") return null;
  const details = (error.details ?? {}) as Record<string, unknown>;
  const reason = details.reason;
  if (reason !== "template_deactivated" && reason !== "template_draft") return null;
  const name =
    typeof details.template_name === "string" && details.template_name.trim() !== ""
      ? details.template_name
      : null;
  const rawVersion = details.template_version;
  const version =
    rawVersion !== null && rawVersion !== undefined && rawVersion !== ""
      ? Number(rawVersion)
      : Number.NaN;
  return {
    reason,
    templateName: name,
    templateVersion: Number.isFinite(version) ? version : null,
  };
}

const emptyCopy = settlementsCopy.createPage.empty;

/** Título y descripción del estado «sin tarifa» según el motivo del 422. */
export function resolveMissingSchemeCopy(error: unknown): { title: string; description: string } {
  const blocked = parseMissingCompensationSchemeError(error);
  if (!blocked) {
    return {
      title: emptyCopy.missingSchemeTitle,
      description: emptyCopy.missingSchemeDescription,
    };
  }
  const named =
    blocked.templateName === null
      ? null
      : blocked.templateVersion === null
        ? blocked.templateName
        : emptyCopy.schemeWithVersion(blocked.templateName, blocked.templateVersion);
  if (blocked.reason === "template_deactivated") {
    return {
      title: emptyCopy.deactivatedSchemeTitle,
      description: emptyCopy.deactivatedSchemeDescription(
        named ?? emptyCopy.deactivatedSchemeUnnamed,
      ),
    };
  }
  return {
    title: emptyCopy.draftSchemeTitle,
    description: emptyCopy.draftSchemeDescription(named ?? emptyCopy.draftSchemeUnnamed),
  };
}
