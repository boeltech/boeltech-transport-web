import type { SettlementItem } from "../../domain/entities";
import { SETTLEMENT_ITEM_TYPE_LABELS, type SettlementItemType } from "../../domain/enums";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { settlementsCopy } from "../copy/settlementsCopy";

/** Prefijos con que el API redacta las partidas que vienen de la tarifa. */
const TEMPLATE_DEDUCTION_PREFIX = "Deducción de plantilla:";
const FIXED_ALLOWANCE_PREFIX = "Prestación fija:";

type SettlementItemLike = Pick<SettlementItem, "itemType" | "description" | "calculationDetails">;

const copy = settlementsCopy.detailPage.items;
const capCopy = settlementsCopy.settlementFlow.deductionsCap;

function itemSource(item: SettlementItemLike): string | null {
  return item.calculationDetails?.source ?? null;
}

function stripPrefix(description: string, prefix: string): string {
  if (!description.startsWith(prefix)) return description;
  return description.slice(prefix.length).trim() || description;
}

export function getSettlementItemCategoryLabel(item: SettlementItemLike): string {
  const source = itemSource(item);
  if (source === "template_deduction" && item.itemType === "adjustment") {
    return copy.templateDeductionCategory;
  }
  if (source === "fixed_allowance" && item.itemType === "bonus") {
    return copy.fixedAllowanceCategory;
  }
  return SETTLEMENT_ITEM_TYPE_LABELS[item.itemType as SettlementItemType] ?? item.itemType;
}

/**
 * Título y subtítulo de partidas de tarifa; `null` si la partida no viene de la tarifa.
 * Si el bruto no alcanzó, el subtítulo dice cuánto no se aplicó.
 */
export function getSettlementItemOriginTitle(
  item: SettlementItemLike,
): { title: string; subtitle: string | null } | null {
  const source = itemSource(item);
  if (source === "template_deduction") {
    const omitted = item.calculationDetails?.omittedAmount ?? 0;
    return {
      title: stripPrefix(item.description, TEMPLATE_DEDUCTION_PREFIX),
      subtitle:
        omitted > 0
          ? capCopy.templateOmitted(formatMxCurrency(omitted))
          : item.itemType === "adjustment"
            ? copy.templateDeductionSubtitle
            : null,
    };
  }
  if (source === "fixed_allowance") {
    return {
      title: stripPrefix(item.description, FIXED_ALLOWANCE_PREFIX),
      subtitle: null,
    };
  }
  return null;
}

function deductionGroup(item: SettlementItemLike): number {
  if (item.itemType === "advance_deduction") return 0;
  if (itemSource(item) === "template_deduction") return 1;
  return 2;
}

/** Anticipos, luego deducciones de tarifa, luego ajustes en contra; estable dentro de cada grupo. */
export function orderSettlementDeductions<T extends SettlementItemLike>(items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index, group: deductionGroup(item) }))
    .sort((a, b) => a.group - b.group || a.index - b.index)
    .map(({ item }) => item);
}
