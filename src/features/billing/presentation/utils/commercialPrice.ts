import type { BillingCatalogItem } from "../../domain/entities";

export type CommercialPriceTier = "ea" | "ga";

export interface ResolvedCatalogListPrice {
  cents: number;
  tier: CommercialPriceTier;
}

export function isCatalogItemInEaWindow(
  item: Pick<BillingCatalogItem, "kind" | "maturity" | "memberCodes" | "code">,
  catalogByCode: ReadonlyMap<string, BillingCatalogItem>,
): boolean {
  if (item.kind === "addon") {
    return item.maturity === "beta";
  }

  if (item.maturity === "beta") {
    return true;
  }

  if (!item.memberCodes.length) {
    return false;
  }

  return item.memberCodes.some(
    (code) => catalogByCode.get(code)?.maturity === "beta",
  );
}

export function resolveCatalogListPrice(
  item: Pick<
    BillingCatalogItem,
    "kind" | "maturity" | "memberCodes" | "code" | "priceEaCents" | "priceGaCents"
  >,
  catalogByCode: ReadonlyMap<string, BillingCatalogItem>,
): ResolvedCatalogListPrice {
  const useEa = isCatalogItemInEaWindow(item, catalogByCode);
  const cents = useEa ? item.priceEaCents : item.priceGaCents;
  return {
    cents: cents ?? 0,
    tier: useEa ? "ea" : "ga",
  };
}
