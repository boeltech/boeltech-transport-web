import type { BillingScheme } from "../../domain/billingScheme.types";
import { billingSchemesCopy } from "../copy/billingSchemesCopy";
import { formatBillingSchemeParamsSummary } from "./formatBillingSchemeCadenceParams";

const copy = billingSchemesCopy;

export { formatBillingSchemeParamsSummary } from "./formatBillingSchemeCadenceParams";

/** Frecuencia + params, p. ej. «Semanal · Jue, Vie». */
export function formatBillingSchemeCadenceSummary(scheme: BillingScheme): string {
  const cadence = copy.cadence[scheme.cadenceKind];
  const params = formatBillingSchemeParamsSummary(scheme);
  return params ? `${cadence} · ${params}` : cadence;
}

/** Párrafo operativo para vista de consulta y contexto en selects. */
export function formatBillingSchemeNaturalDescription(
  scheme: BillingScheme,
): string {
  const params = scheme.params;

  switch (scheme.cadenceKind) {
    case "event":
      if ("windowHours" in params) {
        return copy.naturalDescription.event(params.windowHours);
      }
      break;
    case "periodic_weekly":
      if ("weekdays" in params) {
        return copy.naturalDescription.weekly(params.weekdays);
      }
      break;
    case "periodic_decadal":
      if ("monthDays" in params) {
        return copy.naturalDescription.decadal(params.monthDays);
      }
      break;
    case "periodic_monthly":
      if ("businessDaysFromMonthStart" in params) {
        return copy.naturalDescription.monthlyBusiness(
          params.businessDaysFromMonthStart,
        );
      }
      if ("monthDays" in params) {
        return copy.naturalDescription.monthlyDays(params.monthDays);
      }
      break;
    default:
      break;
  }

  return copy.naturalDescription.fallback;
}

/** Bullets estructurados para el bloque «Regla del periodo». */
export function formatBillingSchemePeriodRuleBullets(
  scheme: BillingScheme,
): string[] {
  const bullets: string[] = [
    copy.detail.periodRules.frequency(copy.cadence[scheme.cadenceKind]),
  ];

  const params = scheme.params;
  if ("windowHours" in params) {
    bullets.push(copy.detail.periodRules.windowHours(params.windowHours));
  } else if ("weekdays" in params) {
    bullets.push(
      copy.detail.periodRules.weekdays(
        params.weekdays
          .map((d) => copy.weekdays[d] ?? String(d))
          .join(", "),
      ),
    );
  } else if ("monthDays" in params) {
    bullets.push(copy.detail.periodRules.monthDays(params.monthDays.join(", ")));
  } else if ("businessDaysFromMonthStart" in params) {
    bullets.push(
      copy.detail.periodRules.businessDays(params.businessDaysFromMonthStart),
    );
  }

  bullets.push(copy.detail.periodRules.tripInclusion);
  return bullets;
}
