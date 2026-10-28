import type {
  PlatformPlanPriceEstimate,
  PlatformPreviewCapacityMetric,
} from "../../domain/entities";
import { opsCopy } from "./opsCopy";

export function formatPreviewPriceEstimate(
  estimate: PlatformPlanPriceEstimate,
): string {
  if (!estimate.estimateAvailable || estimate.estimatedMonthlyCents == null) {
    return opsCopy.preview.pricePending;
  }
  const mxn = (estimate.estimatedMonthlyCents / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: estimate.currency,
    maximumFractionDigits: 0,
  });
  return opsCopy.preview.priceEstimate(mxn);
}

export function formatCapacityMetric(
  metric: PlatformPreviewCapacityMetric,
): string {
  const from = metric.from == null ? "—" : String(metric.from);
  const to = metric.to == null ? "—" : String(metric.to);
  if (metric.delta == null) {
    return `${from} → ${to}`;
  }
  const sign = metric.delta > 0 ? "+" : "";
  return `${from} → ${to} (${sign}${metric.delta})`;
}

export function previewWarningLabel(code: string): string {
  const known = opsCopy.preview.warnings;
  if (code in known) {
    return known[code as keyof typeof known];
  }
  if (code.startsWith("MODULE_PREREQUISITE_NOT_MET:")) {
    return `Falta prerequisito: ${code.slice("MODULE_PREREQUISITE_NOT_MET:".length)}`;
  }
  return code;
}
