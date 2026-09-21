import type { PlatformBillingPlan } from "../../domain/entities";

export const formatPlanPriceCents = (cents: number): string =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

/** Precio de lista motriz (SoT v5) cuando el plan publica $/motriz. */
export const isMotrizListPrice = (
  plan: Pick<PlatformBillingPlan, "pricePerMotrizCents">,
): boolean =>
  plan.pricePerMotrizCents != null && plan.pricePerMotrizCents > 0;

export const formatPlanSelectLabel = (plan: PlatformBillingPlan): string => {
  if (isMotrizListPrice(plan)) {
    const price = formatPlanPriceCents(plan.pricePerMotrizCents!);
    return `${plan.name} · ${price}/motriz · ${plan.stampsPerMotriz} timbres/motriz`;
  }
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
