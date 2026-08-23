/**
 * KPI de vigencia documental para el ATF del detalle (P12).
 * Umbral «próximo a vencer» = 30 días (misma regla que alertas).
 */

import type { StatCardTone } from "@shared/ui/data-display";
import { getDaysUntilDateString } from "@shared/utils/dateUtils";
import { driversCopy } from "../copy";

const copy = driversCopy.detail.stat.vigency;

export type DocumentVigencyEmptyMode = "missing" | "notApplicable";

export interface DocumentVigencyStat {
  value: string;
  tone: StatCardTone;
  description?: string;
}

export function resolveDocumentVigencyStat(
  expiry: string | null | undefined,
  emptyMode: DocumentVigencyEmptyMode,
): DocumentVigencyStat {
  const trimmed = expiry?.trim() || null;
  if (!trimmed) {
    return emptyMode === "notApplicable"
      ? { value: copy.notApplicable, tone: "neutral" }
      : { value: copy.missing, tone: "neutral" };
  }

  const days = getDaysUntilDateString(trimmed);
  if (days === null) {
    return emptyMode === "notApplicable"
      ? { value: copy.notApplicable, tone: "neutral" }
      : { value: copy.missing, tone: "neutral" };
  }

  if (days <= 0) {
    return { value: copy.expired, tone: "destructive" };
  }

  if (days <= 30) {
    return {
      value: copy.expiring(days),
      tone: "warning",
      description: copy.expiringHint,
    };
  }

  return {
    value: copy.valid,
    tone: "success",
    description: copy.validHint,
  };
}
