import type { OperationalPlanCatalogItem } from "./operationalPlanCatalog";
import type { PublicOperationalPlan } from "./publicOperationalPlan.types";

function formatMxnWhole(cents: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatCount(n: number): string {
  return new Intl.NumberFormat("es-MX").format(n);
}

function unitsLabelFromFeatures(
  features: Record<string, unknown>,
): string {
  const raw = features.units_range;
  if (typeof raw !== "string" || !raw.trim()) return "";
  const range = raw.replace(/-/g, "–");
  return `${range} unidades`;
}

function shortNameFromPlanName(name: string): string {
  return name.replace(/^Operación\s+/i, "").trim() || name;
}

/**
 * Convierte un plan de GET /onboarding/plans al shape de UI del embudo.
 */
export function formatOperationalPlanForFunnel(
  plan: PublicOperationalPlan,
): OperationalPlanCatalogItem {
  const listFloor = plan.features.list_floor === true;
  const priceCore = formatMxnWhole(plan.monthlyPriceCents);
  const priceAmount = listFloor ? `desde ${priceCore}` : priceCore;
  const pricePeriod = "/mes";
  const priceLabel = `${priceAmount} ${pricePeriod}`.replace("  ", " ");

  const usersUnlimited = plan.maxUsers == null;
  const branchesUnlimited = plan.maxBranches == null;

  const stampsFormatted = formatCount(plan.includedStamps);
  const stampsBadge = listFloor ? `≥${stampsFormatted}` : stampsFormatted;
  const stampsLabel = listFloor
    ? `≥${stampsFormatted} timbres/mes`
    : `${stampsFormatted} timbres/mes`;

  return {
    code: plan.code,
    name: plan.name,
    shortName: shortNameFromPlanName(plan.name),
    priceAmount,
    pricePeriod,
    unitsLabel: unitsLabelFromFeatures(plan.features),
    priceLabel,
    usersLabel: usersUnlimited
      ? "Usuarios ilimitados"
      : `${formatCount(plan.maxUsers!)} usuarios`,
    branchesLabel: branchesUnlimited
      ? "Sucursales ilimitadas"
      : `${formatCount(plan.maxBranches!)} ${plan.maxBranches === 1 ? "sucursal" : "sucursales"}`,
    stampsLabel,
    usersBadge: usersUnlimited ? "∞" : formatCount(plan.maxUsers!),
    branchesBadge: branchesUnlimited ? "∞" : formatCount(plan.maxBranches!),
    stampsBadge,
  };
}
