import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import {
  parseMissingCompensationSchemeError,
  resolveMissingSchemeCopy,
  resolveSettlementCompensationReadiness,
} from "./settlementTemplateReadiness";
import { settlementsCopy } from "../copy/settlementsCopy";
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

  it("api#59: el 422 con details.reason sigue siendo missing_scheme", () => {
    const error = new ApiError("Desactivada", 422, "MISSING_COMPENSATION_SCHEME", {
      reason: "template_deactivated",
    });
    expect(resolveSettlementCompensationReadiness(undefined, error)).toBe("missing_scheme");
  });
});

describe("api#59 — 422 MISSING_COMPENSATION_SCHEME por motivo", () => {
  const empty = settlementsCopy.createPage.empty;
  const schemeError = (details?: Record<string, unknown>) =>
    new ApiError("x", 422, "MISSING_COMPENSATION_SCHEME", details);

  it("template_deactivated con nombre y versión", () => {
    const error = schemeError({
      reason: "template_deactivated",
      template_id: "tpl-1",
      template_name: "Operador foráneo",
      template_version: 2,
      assignment_id: "asg-1",
    });
    expect(parseMissingCompensationSchemeError(error)).toEqual({
      reason: "template_deactivated",
      templateName: "Operador foráneo",
      templateVersion: 2,
    });
    expect(resolveMissingSchemeCopy(error)).toEqual({
      title: "Tarifa desactivada",
      description:
        "Operador foráneo versión 2 fue desactivada y no se usa para calcular pagos. Reasigna al operador o corrige la vigencia en Esquemas de compensación.",
    });
  });

  it("template_draft con nombre y versión", () => {
    const error = schemeError({
      reason: "template_draft",
      template_name: "Operador foráneo",
      template_version: 3,
    });
    expect(resolveMissingSchemeCopy(error)).toEqual({
      title: "Tarifa en borrador",
      description:
        "Operador foráneo versión 3 está en borrador y no se usa para calcular pagos. Actívala o reasigna al operador en Esquemas de compensación.",
    });
  });

  it("sin versión muestra solo el nombre; sin nombre usa «La tarifa asignada»", () => {
    expect(
      resolveMissingSchemeCopy(
        schemeError({ reason: "template_deactivated", template_name: "Operador foráneo" }),
      ).description,
    ).toBe(
      "Operador foráneo fue desactivada y no se usa para calcular pagos. Reasigna al operador o corrige la vigencia en Esquemas de compensación.",
    );
    expect(resolveMissingSchemeCopy(schemeError({ reason: "template_draft" })).description).toBe(
      "La tarifa asignada está en borrador y no se usa para calcular pagos. Actívala o reasigna al operador en Esquemas de compensación.",
    );
  });

  it.each([
    ["no_assignment", schemeError({ reason: "no_assignment" })],
    ["sin details (API anterior / plantilla inexistente)", schemeError()],
    ["motivo desconocido", schemeError({ reason: "brand_new_reason" })],
    ["otro código", new ApiError("x", 422, "OTHER", { reason: "template_deactivated" })],
    ["error no API", new Error("x")],
  ])("%s → copy actual", (_label, error) => {
    expect(parseMissingCompensationSchemeError(error)).toBeNull();
    expect(resolveMissingSchemeCopy(error)).toEqual({
      title: empty.missingSchemeTitle,
      description: empty.missingSchemeDescription,
    });
  });
});
