import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { CompensationTemplate } from "../../domain/entities";
import { buildRulePhrasePlain, routeTypeLabel } from "./rulePhrase";
import type { TripRouteType } from "@features/settlements/domain";

const ALL_ROUTE_TYPES: TripRouteType[] = ["long_haul", "local", "transfer"];

/**
 * Lista en palabras para el inspector «Así le pagas» (orden del cálculo).
 */
export function buildPaysHowProse(
  template: Pick<
    CompensationTemplate,
    "rules" | "fixedAllowances" | "deductions" | "corridorIds" | "salaryOnly"
  >,
): string[] {
  const lines: string[] = [];

  if (template.salaryOnly) {
    lines.push(
      "Esta tarifa no paga por viaje: el operador recibe el sueldo de su ficha en Empleados.",
    );
  } else {
    if (template.corridorIds.length > 0) {
      lines.push(
        "Si el viaje es una ruta con tarifa fija, paga el importe de esa ruta.",
      );
    }

    const byType = new Map(
      template.rules.map((rule) => [rule.routeType, rule] as const),
    );

    for (const routeType of ALL_ROUTE_TYPES) {
      const rule = byType.get(routeType);
      const label = routeTypeLabel(routeType);
      if (!rule || rule.commissionType === "none") {
        lines.push(`${label} no paga por viaje.`);
        continue;
      }
      const phrase = buildRulePhrasePlain(rule);
      lines.push(
        template.corridorIds.length > 0
          ? `Si no: ${label} — ${phrase}`
          : `${label}: ${phrase}`,
      );
    }
  }

  const allowanceSum = template.fixedAllowances.reduce(
    (acc, item) => acc + (item.amount || 0),
    0,
  );
  const deductionSum = (template.deductions ?? []).reduce(
    (acc, item) => acc + (item.amount || 0),
    0,
  );

  if (allowanceSum > 0 || deductionSum > 0) {
    const parts: string[] = [];
    if (allowanceSum > 0) {
      parts.push(`suma ${formatMxCurrency(allowanceSum)} fijos`);
    }
    if (deductionSum > 0) {
      parts.push(`descuenta ${formatMxCurrency(deductionSum)}`);
    }
    lines.push(`Cada periodo ${parts.join(" y ")}.`);
  }

  return lines;
}
