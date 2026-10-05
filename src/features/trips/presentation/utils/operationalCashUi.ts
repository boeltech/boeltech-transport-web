/**
 * ADR-0096 addendum — helpers de presentación del cobro operativo.
 */

import type { OperationalCashCollectionStatus } from "@features/trips/domain";
import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";

const cashCopy = cfdiEmissionIntentCopy.cash;

export function operationalCashStatusLabel(
  status: OperationalCashCollectionStatus,
): string {
  switch (status) {
    case "partial":
      return cashCopy.statusPartial;
    case "collected":
      return cashCopy.statusCollected;
    default:
      return cashCopy.statusPending;
  }
}

export function operationalCashStatusBadgeVariant(
  status: OperationalCashCollectionStatus,
): "neutral" | "warning" | "success" {
  switch (status) {
    case "partial":
      return "warning";
    case "collected":
      return "success";
    default:
      return "neutral";
  }
}

export function operationalCashErrorToast(
  error: { code?: string; message: string },
  kind: "create" | "void",
): { title: string; description?: string } {
  if (error.code === "TRIP_OPERATIONAL_CASH_EXCEEDS_RATE") {
    return {
      title: cashCopy.toast.exceedsRate,
      description: error.message,
    };
  }
  if (error.code === "TRIP_OPERATIONAL_CASH_NOT_ALLOWED") {
    return {
      title: cashCopy.toast.notAllowed,
      description: error.message,
    };
  }
  if (error.code === "TRIP_OPERATIONAL_CASH_RECEIPT_ALREADY_VOIDED") {
    return {
      title: cashCopy.toast.alreadyVoided,
      description: error.message,
    };
  }
  return {
    title: kind === "void" ? cashCopy.toast.voidError : cashCopy.toast.error,
    description: error.message,
  };
}
