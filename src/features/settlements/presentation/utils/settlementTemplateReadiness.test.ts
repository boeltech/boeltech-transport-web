import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { resolveSettlementCompensationReadiness } from "./settlementTemplateReadiness";
import type { SettlementPreview } from "../../domain/entities";

const basePreview: SettlementPreview = {
  employeeId: "emp-1",
  employeeName: "Ana López",
  periodStart: "2026-09-01",
  periodEnd: "2026-09-07",
  agreement: { currency: "MXN", rules: [] },
  eligibleTrips: [],
  openAdvances: [],
  summary: {
    totalCommissions: 0,
    totalBaseSalary: 4500,
    totalFixedAllowances: 500,
    totalReimbursements: 0,
    suggestedAdvanceDeduction: 0,
    grossAmount: 5000,
    netAmount: 5000,
  },
  template: {
    id: "tpl-1",
    name: "Operador foráneo",
    assignmentId: "assign-1",
  },
};

describe("resolveSettlementCompensationReadiness", () => {
  it("marca missing_scheme cuando el API responde 422", () => {
    const error = new ApiError("Sin esquema", 422, "MISSING_COMPENSATION_SCHEME");
    expect(resolveSettlementCompensationReadiness(undefined, error)).toBe("missing_scheme");
  });

  it("marca ready con plantilla y prestaciones del período", () => {
    expect(resolveSettlementCompensationReadiness(basePreview)).toBe("ready");
  });

  it("marca missing_scheme sin plantilla aunque exista snapshot legacy", () => {
    expect(
      resolveSettlementCompensationReadiness({
        ...basePreview,
        template: undefined,
        agreement: {
          currency: "MXN",
          calculationType: "salary_only",
          hasFixedSalary: false,
          fixedSalaryPeriod: "none",
          rules: [],
        },
      }),
    ).toBe("missing_scheme");
  });

  it("marca incomplete cuando la plantilla no define montos liquidables", () => {
    expect(
      resolveSettlementCompensationReadiness({
        ...basePreview,
        summary: {
          ...basePreview.summary,
          totalBaseSalary: 0,
          totalCommissions: 0,
          totalFixedAllowances: 0,
        },
        fixedAllowances: [],
        agreement: { currency: "MXN", rules: [] },
      }),
    ).toBe("incomplete");
  });
});
