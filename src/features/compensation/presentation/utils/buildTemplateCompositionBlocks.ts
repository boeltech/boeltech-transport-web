import {
  AGREEMENT_COMMISSION_TYPE_LABELS,
  TRIP_ROUTE_TYPE_LABELS,
  type AgreementCommissionType,
} from "@features/settlements";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { CompensationTemplate } from "../../domain/entities";
import {
  FIXED_ALLOWANCE_PERIOD_LABELS,
} from "../../domain/enums";
import { compensationCopy } from "../copy/compensationCopy";
import { formatCorridorRouteHuman } from "./formatCorridorRoute";
import type { TemplateCompositionBlock } from "./templateCompositionTypes";

const copy = compensationCopy.compositionCanvas;

function formatRuleCommission(
  commissionType: AgreementCommissionType,
  rateValue: number,
): string {
  switch (commissionType) {
    case "rate_per_km":
      return `${formatMxCurrency(rateValue)}/km`;
    case "percentage_of_freight":
      return `${rateValue}% sobre flete`;
    case "fixed_per_trip":
      return `${formatMxCurrency(rateValue)} por viaje`;
    case "none":
      return AGREEMENT_COMMISSION_TYPE_LABELS.none;
    default:
      return formatMxCurrency(rateValue);
  }
}

function blockStatus(itemCount: number): TemplateCompositionBlock["status"] {
  return itemCount > 0 ? "complete" : "empty";
}

export function buildTemplateCompositionBlocks(
  template: CompensationTemplate,
): TemplateCompositionBlock[] {
  const ruleItems = template.rules.map((rule) => ({
    title: TRIP_ROUTE_TYPE_LABELS[rule.routeType] ?? rule.routeType,
    subtitle: formatRuleCommission(rule.commissionType, rule.rateValue),
    amount:
      rule.minimumGuaranteedAmount > 0
        ? `Mín. ${formatMxCurrency(rule.minimumGuaranteedAmount)}`
        : undefined,
  }));

  const allowanceItems = template.fixedAllowances.map((allowance) => ({
    title: allowance.label,
    subtitle: FIXED_ALLOWANCE_PERIOD_LABELS[allowance.period],
    amount: formatMxCurrency(allowance.amount),
  }));

  const corridorItems =
    template.corridors.length > 0
      ? template.corridors.map((corridor) => ({
          title: corridor.name,
          subtitle: formatCorridorRouteHuman(corridor),
          amount: formatMxCurrency(corridor.fixedAmount),
        }))
      : template.corridorIds.map((corridorId) => ({
          title: copy.corridorFallbackTitle,
          subtitle: corridorId,
        }));

  return [
    {
      id: "rules",
      label: copy.blocks.rules,
      status: blockStatus(ruleItems.length),
      items: ruleItems,
    },
    {
      id: "allowances",
      label: copy.blocks.allowances,
      status: blockStatus(allowanceItems.length),
      items: allowanceItems,
    },
    {
      id: "corridors",
      label: copy.blocks.corridors,
      status: blockStatus(corridorItems.length),
      items: corridorItems,
    },
  ];
}
