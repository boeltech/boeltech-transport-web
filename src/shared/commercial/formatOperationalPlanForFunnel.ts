import type { OperationalPlanCatalogItem } from "./operationalPlanCatalog";
import {
  isPublicMotrizPlan,
  type PublicOperationalPlan,
} from "./publicOperationalPlan.types";

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

function unitsLabelFromBand(
  bandQMin: number | null,
  bandQMax: number | null,
): string {
  if (bandQMin == null && bandQMax == null) return "";
  if (bandQMin != null && bandQMax == null) {
    return `${formatCount(bandQMin)}+ unidades`;
  }
  if (bandQMin != null && bandQMax != null) {
    return `${formatCount(bandQMin)}–${formatCount(bandQMax)} unidades`;
  }
  if (bandQMax != null) return `hasta ${formatCount(bandQMax)} unidades`;
  return "";
}

function shortNameFromPlanName(name: string): string {
  return name.replace(/^Operación\s+/i, "").trim() || name;
}

function resolvePrice(plan: PublicOperationalPlan): {
  priceAmount: string;
  pricePeriod: string;
  priceLabel: string;
} {
  const motrizCents = plan.pricePerMotrizCents;
  const listFloor = plan.features.list_floor === true;
  const isMotriz = isPublicMotrizPlan(plan);

  // SoT v5: P > 0 → tipográfico $/motriz (nunca $0 por monthly flat=0).
  if (motrizCents != null && motrizCents > 0) {
    const priceCore = formatMxnWhole(motrizCents);
    const priceAmount = listFloor ? `desde ${priceCore}` : priceCore;
    const pricePeriod = "/motriz · mes";
    return {
      priceAmount,
      pricePeriod,
      priceLabel: `${priceAmount} ${pricePeriod}`.replace(/\s+/g, " ").trim(),
    };
  }

  // Grande / cotización motriz (P null) o list_floor sin P.
  const isQuote =
    plan.code === "operacion_grande" ||
    (isMotriz && (motrizCents == null || motrizCents <= 0)) ||
    (listFloor && !(plan.monthlyPriceCents > 0));

  if (isQuote) {
    return {
      priceAmount: "Cotización",
      pricePeriod: "",
      priceLabel: "Cotización",
    };
  }

  // Legacy flat grandfather: monthly > 0 sin motriz.
  if (plan.monthlyPriceCents > 0) {
    const priceCore = formatMxnWhole(plan.monthlyPriceCents);
    const priceAmount = listFloor ? `desde ${priceCore}` : priceCore;
    const pricePeriod = "/mes";
    return {
      priceAmount,
      pricePeriod,
      priceLabel: `${priceAmount} ${pricePeriod}`.replace(/\s+/g, " ").trim(),
    };
  }

  return {
    priceAmount: "Cotización",
    pricePeriod: "",
    priceLabel: "Cotización",
  };
}

function resolveStamps(plan: PublicOperationalPlan): {
  stampsLabel: string;
  stampsBadge: string;
} {
  const listFloor = plan.features.list_floor === true;

  if (plan.stampsPerMotriz > 0) {
    const n = formatCount(plan.stampsPerMotriz);
    return {
      stampsBadge: n,
      stampsLabel: `${n} timbres/motriz`,
    };
  }

  if (plan.includedStamps > 0) {
    const stampsFormatted = formatCount(plan.includedStamps);
    const stampsBadge = listFloor ? `≥${stampsFormatted}` : stampsFormatted;
    const stampsLabel = listFloor
      ? `≥${stampsFormatted} timbres/mes`
      : `${stampsFormatted} timbres/mes`;
    return { stampsBadge, stampsLabel };
  }

  // No mostrar "0 timbres" cuando included_stamps=0 en planes motriz.
  return { stampsBadge: "", stampsLabel: "" };
}

function resolveHistoryLabel(
  historyMonths: number | null,
): string | undefined {
  if (historyMonths == null) return undefined;
  if (historyMonths <= 0) return undefined;
  return `${formatCount(historyMonths)} meses`;
}

/**
 * Convierte un plan de GET /onboarding/plans al shape de UI del embudo.
 */
export function formatOperationalPlanForFunnel(
  plan: PublicOperationalPlan,
): OperationalPlanCatalogItem {
  const { priceAmount, pricePeriod, priceLabel } = resolvePrice(plan);
  const { stampsLabel, stampsBadge } = resolveStamps(plan);

  const usersUnlimited = plan.maxUsers == null;
  const branchesUnlimited = plan.maxBranches == null;
  const isSowLimits =
    plan.code === "operacion_grande" && usersUnlimited && branchesUnlimited;

  const unitsFromFeatures = unitsLabelFromFeatures(plan.features);
  const unitsLabel =
    unitsFromFeatures ||
    unitsLabelFromBand(plan.bandQMin, plan.bandQMax);

  return {
    code: plan.code,
    name: plan.name,
    shortName: shortNameFromPlanName(plan.name),
    priceAmount,
    pricePeriod,
    unitsLabel,
    priceLabel,
    usersLabel: isSowLimits
      ? "Según SOW"
      : usersUnlimited
        ? "Usuarios ilimitados"
        : `${formatCount(plan.maxUsers!)} usuarios`,
    branchesLabel: isSowLimits
      ? "SOW"
      : branchesUnlimited
        ? "Sucursales ilimitadas"
        : `${formatCount(plan.maxBranches!)} ${plan.maxBranches === 1 ? "sucursal" : "sucursales"}`,
    stampsLabel,
    usersBadge: isSowLimits
      ? "SOW"
      : usersUnlimited
        ? "∞"
        : formatCount(plan.maxUsers!),
    branchesBadge: isSowLimits
      ? "SOW"
      : branchesUnlimited
        ? "∞"
        : formatCount(plan.maxBranches!),
    stampsBadge,
    historyLabel: isSowLimits
      ? "SOW"
      : resolveHistoryLabel(plan.historyMonths),
  };
}
