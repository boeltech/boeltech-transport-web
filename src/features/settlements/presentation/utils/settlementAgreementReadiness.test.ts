import { describe, expect, it } from "vitest";
import {
  resolveSettlementAgreementReadiness,
  isSettlementAgreementReady,
} from "./settlementAgreementReadiness";

describe("resolveSettlementAgreementReadiness", () => {
  it("marca ready con sueldo fijo usable", () => {
    expect(
      resolveSettlementAgreementReadiness({
        hasFixedSalary: true,
        fixedSalaryAmount: 15000,
        fixedSalaryPeriod: "monthly",
        calculationType: "salary_only",
        rules: [],
        currency: "MXN",
      }),
    ).toBe("ready");
  });

  it("marca ready con comisión legacy usable", () => {
    expect(
      resolveSettlementAgreementReadiness({
        hasFixedSalary: false,
        calculationType: "percentage_of_freight",
        percentageRate: 15,
        currency: "MXN",
      }),
    ).toBe("ready");
  });

  it("marca ready con regla de ruta con comisión", () => {
    expect(
      resolveSettlementAgreementReadiness({
        hasFixedSalary: false,
        rules: [
          {
            routeType: "long_haul",
            commissionType: "rate_per_km",
            rateValue: 3,
          },
        ],
        currency: "MXN",
      }),
    ).toBe("ready");
  });

  it("marca missing_agreement para el fallback sintético del API", () => {
    expect(
      resolveSettlementAgreementReadiness({
        has_fixed_salary: false,
        fixed_salary_amount: 0,
        fixed_salary_period: "none",
        is_salary_guaranteed: true,
        rules: [],
        calculation_type: "salary_only",
        base_rate: 15000,
        currency: "MXN",
      }),
    ).toBe("missing_agreement");
    expect(
      isSettlementAgreementReady({
        calculationType: "salary_only",
        hasFixedSalary: false,
        fixedSalaryPeriod: "none",
        rules: [],
        currency: "MXN",
      }),
    ).toBe(false);
  });

  it("marca incomplete_agreement cuando hay estructura pero no montos útiles", () => {
    expect(
      resolveSettlementAgreementReadiness({
        hasFixedSalary: false,
        fixedSalaryPeriod: "weekly",
        calculationType: "salary_only",
        rules: [
          {
            routeType: "local",
            commissionType: "none",
            rateValue: 0,
          },
        ],
        currency: "MXN",
      }),
    ).toBe("incomplete_agreement");
  });

  it("marca missing_agreement si no hay acuerdo", () => {
    expect(resolveSettlementAgreementReadiness(undefined)).toBe("missing_agreement");
    expect(resolveSettlementAgreementReadiness(null)).toBe("missing_agreement");
  });
});
