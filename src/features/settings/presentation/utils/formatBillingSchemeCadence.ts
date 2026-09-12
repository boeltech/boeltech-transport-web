import type {
  BillingScheme,
  BillingSchemeParams,
} from "../../domain/billingScheme.types";
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
  scheme: Pick<BillingScheme, "cadenceKind" | "params">,
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

/** Ejemplo didáctico genérico del periodo (sin datos del tenant). */
export function formatBillingSchemePeriodExample(
  scheme: Pick<BillingScheme, "cadenceKind" | "params">,
): string {
  const params = scheme.params;
  const ex = copy.detail.periodExample;

  switch (scheme.cadenceKind) {
    case "event":
      if ("windowHours" in params) {
        return ex.event(params.windowHours);
      }
      break;
    case "periodic_weekly":
      if ("weekdays" in params && params.weekdays.length > 0) {
        return ex.weekly(formatWeekdaysLong(params.weekdays));
      }
      break;
    case "periodic_decadal":
      if ("monthDays" in params && params.monthDays.length > 0) {
        return ex.decadal(formatDecadalPeriodParts(params.monthDays));
      }
      break;
    case "periodic_monthly":
      if ("businessDaysFromMonthStart" in params) {
        return ex.monthlyBusiness(params.businessDaysFromMonthStart);
      }
      if ("monthDays" in params && params.monthDays.length > 0) {
        if (params.monthDays.length === 1) {
          return ex.monthlyDays(String(params.monthDays[0]));
        }
        return ex.monthlyDaysMulti(params.monthDays.join(", "));
      }
      break;
    default:
      break;
  }

  return ex.fallback;
}

function formatWeekdaysLong(weekdays: number[]): string {
  return [...weekdays]
    .sort((a, b) => a - b)
    .map((d) => copy.weekdaysLong[d] ?? String(d))
    .join(" y ");
}

/** Rangos didácticos entre días de corte del mes (p. ej. 10, 20, 30). */
export function formatDecadalPeriodParts(monthDays: number[]): string {
  const days = [...new Set(monthDays.filter((n) => n >= 1 && n <= 31))].sort(
    (a, b) => a - b,
  );
  if (days.length === 0) return "";

  const parts = days.map((day, index) => {
    const start = index === 0 ? 1 : (days[index - 1] as number) + 1;
    if (index === days.length - 1) {
      return `el del ${day}, del ${start} a fin de mes`;
    }
    return `el envío del día ${day} incluye cierres del ${start} al ${day}`;
  });

  if (parts.length === 1) {
    return parts[0] as string;
  }

  const head = parts.slice(0, -1).join("; ");
  const tail = parts[parts.length - 1] as string;
  return `${head}; ${tail}.`;
}

/** Construye params mínimos para preview en formulario (sin persistir). */
export function buildBillingSchemePreviewParams(input: {
  cadenceKind: BillingScheme["cadenceKind"];
  windowHours: number;
  weekdays: number[];
  monthDays: number[];
  monthlyMode: "days" | "business";
  businessDays: number;
}): BillingSchemeParams {
  switch (input.cadenceKind) {
    case "event":
      return { windowHours: input.windowHours };
    case "periodic_weekly":
      return { weekdays: [...input.weekdays].sort((a, b) => a - b) };
    case "periodic_decadal":
      return { monthDays: input.monthDays };
    case "periodic_monthly":
      if (input.monthlyMode === "business") {
        return { businessDaysFromMonthStart: input.businessDays };
      }
      return { monthDays: input.monthDays };
    default:
      return { windowHours: 48 };
  }
}
