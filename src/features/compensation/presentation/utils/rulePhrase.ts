import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { AgreementCommissionType, TripRouteType } from "@features/settlements/domain";
import type { CompensationTemplateRule } from "../../domain/entities";

const ROUTE_LABELS: Record<TripRouteType, string> = {
  local: "Local",
  long_haul: "Foráneo",
  transfer: "Transfer / Patio",
};

export interface RulePhrasePart {
  kind: "text" | "chip";
  text: string;
}

/**
 * Frase legible de una regla (T3): «Paga $3.00 por km…, nunca menos de $1,500».
 * Los chips envuelven montos/valores editables en la UI.
 */
export function buildRulePhraseParts(
  rule: Pick<
    CompensationTemplateRule,
    "routeType" | "commissionType" | "rateValue" | "minimumGuaranteedAmount"
  >,
): RulePhrasePart[] {
  const commissionType = rule.commissionType as AgreementCommissionType;
  const rate =
    typeof rule.rateValue === "number" && Number.isFinite(rule.rateValue) ? rule.rateValue : 0;
  const minimum =
    typeof rule.minimumGuaranteedAmount === "number" && rule.minimumGuaranteedAmount > 0
      ? rule.minimumGuaranteedAmount
      : 0;

  switch (commissionType) {
    case "rate_per_km": {
      const parts: RulePhrasePart[] = [
        { kind: "text", text: "Paga " },
        { kind: "chip", text: formatMxCurrency(rate) },
        { kind: "text", text: " por km recorrido" },
      ];
      if (minimum > 0) {
        parts.push(
          { kind: "text", text: ", nunca menos de " },
          { kind: "chip", text: formatMxCurrency(minimum) },
          { kind: "text", text: " por viaje." },
        );
      } else {
        parts.push({ kind: "text", text: "." });
      }
      return parts;
    }
    case "percentage_of_freight": {
      const parts: RulePhrasePart[] = [
        { kind: "text", text: "Paga " },
        { kind: "chip", text: `${rate}%` },
        { kind: "text", text: " del flete" },
      ];
      if (minimum > 0) {
        parts.push(
          { kind: "text", text: ", nunca menos de " },
          { kind: "chip", text: formatMxCurrency(minimum) },
          { kind: "text", text: " por viaje." },
        );
      } else {
        parts.push({ kind: "text", text: "." });
      }
      return parts;
    }
    case "fixed_per_trip":
      return [
        { kind: "text", text: "Paga un importe fijo de " },
        { kind: "chip", text: formatMxCurrency(rate) },
        { kind: "text", text: " por viaje." },
      ];
    case "none":
    default:
      return [
        {
          kind: "text",
          text: "Sin regla: estos viajes pagan $0 por viaje.",
        },
      ];
  }
}

export function buildRulePhrasePlain(
  rule: Pick<
    CompensationTemplateRule,
    "routeType" | "commissionType" | "rateValue" | "minimumGuaranteedAmount"
  >,
): string {
  return buildRulePhraseParts(rule)
    .map((part) => part.text)
    .join("");
}

export function routeTypeLabel(routeType: TripRouteType): string {
  return ROUTE_LABELS[routeType] ?? routeType;
}
