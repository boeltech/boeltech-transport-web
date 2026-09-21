import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type {
  BillingCommercialSummary,
  BillingSubscription,
} from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import { BillingCostsCard } from "./BillingCostsCard";

const V5_PILOTO_SUB: BillingSubscription = {
  planCode: "operacion_pequena",
  planName: "Operación Pequeña",
  status: "active",
  billingCycle: "monthly",
  monthlyPriceCents: 0,
  includedStamps: 420,
  stampsUsedThisPeriod: 12,
  quotaPolicy: "soft_cap",
  currentPeriodStart: "2026-09-01T06:00:00.000Z",
  currentPeriodEnd: "2026-10-01T05:59:59.999Z",
  trialEndsAt: null,
  notes: null,
  limits: { maxUsers: 10, maxBranches: 3, historyMonths: 12 },
  capacityBandCode: "operacion_pequena",
  pendingCapacityBandCode: null,
  capacity: {
    bandCode: "operacion_pequena",
    pendingBandCode: null,
    users: {
      granted: 10,
      usage: null,
      limitReached: false,
      overQuota: false,
      overQuotaCount: 0,
      status: "within_limit",
    },
    branches: {
      granted: 3,
      usage: null,
      limitReached: false,
      overQuota: false,
      overQuotaCount: 0,
      status: "within_limit",
    },
    historyMonths: { granted: 12 },
  },
  profitabilityLevel: "L0",
  pricePerMotrizCents: 31900,
  stampsPerMotriz: 30,
  bandQMin: 6,
  bandQMax: 30,
  overagePriceCents: 500,
  qFact: 14,
};

/** API SoT F3b: 14 × 31900 = 446600 + IVA 16%. */
const MOTRIZ_SUMMARY: BillingCommercialSummary = {
  planMonthlyPriceCents: 446600,
  modulesTotalCents: 0,
  overageTotalCents: 0,
  subtotalCents: 446600,
  ivaCents: 71456,
  estimatedTotalCents: 518056,
  currency: "MXN",
  periodKey: "2026-09",
  billingCycle: "monthly",
};

describe("BillingCostsCard (SoT v5 F3b)", () => {
  it("muestra totales desde commercial_summary API (sin fallback Q×P+IVA)", () => {
    render(
      <BillingCostsCard
        summary={MOTRIZ_SUMMARY}
        isLoading={false}
        billingCycle="monthly"
        subscription={V5_PILOTO_SUB}
      />,
    );

    expect(screen.getByText(billingCopy.costs.rows.motrizCargo)).toBeInTheDocument();
    expect(screen.getByText(/14 motrizes × \$319\.00/)).toBeInTheDocument();
    // Cargo plan + estimado con IVA vienen del summary, no del cliente
    expect(screen.getAllByText(/\$4,466\.00/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/\$5,180\.56/)).toBeInTheDocument();
  });

  it("no inventa Q×P cuando el summary trae plan=0 (API soft-fail / sin patch)", () => {
    render(
      <BillingCostsCard
        summary={{
          ...MOTRIZ_SUMMARY,
          planMonthlyPriceCents: 0,
          subtotalCents: 0,
          ivaCents: 0,
          estimatedTotalCents: 0,
        }}
        isLoading={false}
        subscription={V5_PILOTO_SUB}
      />,
    );

    expect(screen.getByText(billingCopy.costs.rows.motrizCargo)).toBeInTheDocument();
    // Hero total + filas en $0 desde summary; no hay patch a 14×319
    expect(screen.getAllByText("$0.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/\$4,466\.00/)).not.toBeInTheDocument();
  });
});
