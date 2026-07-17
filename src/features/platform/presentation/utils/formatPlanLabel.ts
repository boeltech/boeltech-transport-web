import type { PlatformBillingPlan } from "../../domain/entities";

export const formatPlanPriceCents = (cents: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

export const formatPlanSelectLabel = (plan: PlatformBillingPlan): string => {
  const price = formatPlanPriceCents(plan.monthlyPriceCents);
  return `${plan.name} · ${price}/mes · ${plan.includedStamps} timbres`;
};

export const resolvePlanDisplayName = (
  planCode: string,
  plans?: readonly Pick<PlatformBillingPlan, "code" | "name">[],
): string => {
  const match = plans?.find((plan) => plan.code === planCode);
  return match?.name ?? planCode.replaceAll("_", " ");
};
