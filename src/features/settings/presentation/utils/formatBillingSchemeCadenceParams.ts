import type { BillingScheme } from "../../domain/billingScheme.types";
import { billingSchemesCopy } from "../copy/billingSchemesCopy";

const copy = billingSchemesCopy;

/** Resumen corto de params (ventana, días de corte, etc.). */
export function formatBillingSchemeParamsSummary(scheme: BillingScheme): string {
  const params = scheme.params;
  if ("windowHours" in params) {
    return copy.paramsSummary.event(params.windowHours);
  }
  if ("weekdays" in params) {
    return copy.paramsSummary.weekly(params.weekdays);
  }
  if ("monthDays" in params) {
    return copy.paramsSummary.monthDays(params.monthDays);
  }
  if ("businessDaysFromMonthStart" in params) {
    return copy.paramsSummary.businessDays(params.businessDaysFromMonthStart);
  }
  return "";
}
