import type {
  SettlementTemplateChange,
  TemplatePeriodAssignmentRef,
} from "../../domain/entities";
import { formatDate } from "@shared/utils/dateUtils";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.workbench.templateChange;

export type TemplateChangeVariant = "two" | "several" | "concurrent";

/** D-1 C1 §3.2: varios → a la vez → dos (en ese orden). Fechas `YYYY-MM-DD` comparadas como cadena. */
export function resolveTemplateChangeVariant(
  change: SettlementTemplateChange,
): TemplateChangeVariant {
  if (change.templatesCount >= 3) return "several";
  const fromEnd = change.from.effectiveTo;
  if (fromEnd === null || fromEnd >= change.to.effectiveFrom) return "concurrent";
  return "two";
}

/** Primera asignación (orden ASC) cuyo esquema no es el del cierre. */
function firstNonClosingRef(change: SettlementTemplateChange): TemplatePeriodAssignmentRef {
  return (
    change.assignments.find((ref) => ref.templateId !== change.to.templateId) ?? change.from
  );
}

/** El nombre lleva versión solo si otro esquema mostrado en el mismo texto se llama igual. */
export function visibleTemplateNames(
  refs: readonly TemplatePeriodAssignmentRef[],
): string[] {
  return refs.map((ref) => {
    const repeated = refs.some(
      (other) => other.templateId !== ref.templateId && other.templateName === ref.templateName,
    );
    return repeated ? `${ref.templateName} (v${ref.templateVersion})` : ref.templateName;
  });
}

export function resolveTemplateChangeTooltip(
  change: SettlementTemplateChange,
  withTrips: boolean,
): string {
  const variant = resolveTemplateChangeVariant(change);
  if (variant === "several") {
    const [first, closing] = visibleTemplateNames([firstNonClosingRef(change), change.to]);
    const params = { n: change.templatesCount, first: first!, closing: closing! };
    return withTrips ? copy.tooltip.severalWithTrips(params) : copy.tooltip.several(params);
  }
  const [a, b] = visibleTemplateNames([change.from, change.to]);
  if (variant === "concurrent") {
    const params = { a: a!, b: b! };
    return withTrips ? copy.tooltip.concurrentWithTrips(params) : copy.tooltip.concurrent(params);
  }
  const params = {
    a: a!,
    b: b!,
    endA: formatDate(change.from.effectiveTo),
    startB: formatDate(change.to.effectiveFrom),
  };
  return withTrips ? copy.tooltip.twoWithTrips(params) : copy.tooltip.two(params);
}

export function resolveTemplateChangeAlert(
  change: SettlementTemplateChange,
  withTrips: boolean,
  periodEnd: string,
): { title: string; body: string } {
  const variant = resolveTemplateChangeVariant(change);
  const title = copy.alertTitle[variant];
  const formattedEnd = formatDate(periodEnd);
  const startB = formatDate(change.to.effectiveFrom);
  if (variant === "several") {
    const [closing] = visibleTemplateNames([change.to]);
    const params = { closing: closing!, periodEnd: formattedEnd, startB };
    return {
      title,
      body: withTrips ? copy.alertBody.severalWithTrips(params) : copy.alertBody.several(params),
    };
  }
  const [a, b] = visibleTemplateNames([change.from, change.to]);
  if (variant === "concurrent") {
    const params = { a: a!, b: b! };
    return {
      title,
      body: withTrips
        ? copy.alertBody.concurrentWithTrips(params)
        : copy.alertBody.concurrent(params),
    };
  }
  const params = { a: a!, b: b!, periodEnd: formattedEnd, startB };
  return {
    title,
    body: withTrips ? copy.alertBody.twoWithTrips(params) : copy.alertBody.two(params),
  };
}
