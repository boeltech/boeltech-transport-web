import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { compensationCopy } from "../copy/compensationCopy";
import {
  getCompensationLifecycleErrorMessage,
  isTemplateConfigLockedError,
  readAssignmentPeriodSettledError,
} from "./compensationLifecycleErrors";

const errors = compensationCopy.templateActions.errors;

function lockedError(details?: Record<string, unknown>) {
  return new ApiError("Configuración bloqueada", 409, "TEMPLATE_CONFIG_LOCKED", details);
}

describe("getCompensationLifecycleErrorMessage — 409 TEMPLATE_CONFIG_LOCKED", () => {
  it("details.reason superseded: dice que los cambios no se guardaron", () => {
    expect(getCompensationLifecycleErrorMessage(lockedError({ reason: "superseded" }))).toBe(
      "Esta versión ya fue reemplazada y tus cambios no se guardaron. Crea una nueva versión y vuelve a capturarlos.",
    );
  });

  it.each([
    ["used_in_settlements", { reason: "used_in_settlements" }],
    ["sin details", undefined],
    ["motivo desconocido", { reason: "otro" }],
  ])("%s: mensaje actual", (_label, details) => {
    expect(getCompensationLifecycleErrorMessage(lockedError(details))).toBe(
      errors.TEMPLATE_CONFIG_LOCKED,
    );
  });

  it("isTemplateConfigLockedError solo con ese código", () => {
    expect(isTemplateConfigLockedError(lockedError())).toBe(true);
    expect(
      isTemplateConfigLockedError(new ApiError("x", 409, "TEMPLATE_NOT_ACTIVATABLE")),
    ).toBe(false);
    expect(isTemplateConfigLockedError(new Error("x"))).toBe(false);
  });
});

describe("readAssignmentPeriodSettledError — 409 ASSIGNMENT_PERIOD_SETTLED (api#62)", () => {
  const apiMessage =
    "La liquidación LIQ-0012 (aprobada) ya pagó del 01-sep-2026 al 15-sep-2026. Puedes cerrarla desde el 15-sep-2026.";

  function settledError(details?: Record<string, unknown>) {
    return new ApiError(apiMessage, 409, "ASSIGNMENT_PERIOD_SETTLED", details);
  }

  it("convierte details snake_case a camelCase", () => {
    const result = readAssignmentPeriodSettledError(
      settledError({
        employee_id: "emp-1",
        code: "ASSIGNMENT_PERIOD_SETTLED",
        existing_assignment_id: "asg-1",
        blocking_settlements: [
          {
            settlement_id: "set-1",
            settlement_number: "LIQ-0012",
            status: "approved",
            period_start: "2026-09-01",
            period_end: "2026-09-15",
          },
        ],
        blocking_settlements_total: 3,
        min_effective_to: "2026-09-15",
        suggested_effective_from: "2026-09-16",
        message: apiMessage,
      }),
    );

    expect(result).toEqual({
      message: apiMessage,
      existingAssignmentId: "asg-1",
      blockingSettlements: [
        {
          settlementId: "set-1",
          settlementNumber: "LIQ-0012",
          status: "approved",
          periodStart: "2026-09-01",
          periodEnd: "2026-09-15",
        },
      ],
      blockingSettlementsTotal: 3,
      minEffectiveTo: "2026-09-15",
      suggestedEffectiveFrom: "2026-09-16",
    });
  });

  it("sin details usa el mensaje del error y deja los remedios en null", () => {
    expect(readAssignmentPeriodSettledError(settledError())).toEqual({
      message: apiMessage,
      existingAssignmentId: null,
      blockingSettlements: [],
      blockingSettlementsTotal: 0,
      minEffectiveTo: null,
      suggestedEffectiveFrom: null,
    });
  });

  it("descarta liquidaciones incompletas y el total nunca queda por debajo de las listadas", () => {
    const result = readAssignmentPeriodSettledError(
      settledError({
        blocking_settlements: [
          { settlement_id: "set-1", settlement_number: "LIQ-1", status: "draft", period_start: "2026-09-01", period_end: "2026-09-07" },
          { settlement_id: "set-2" },
          "basura",
        ],
        blocking_settlements_total: 0,
      }),
    );

    expect(result?.blockingSettlements.map((s) => s.settlementId)).toEqual(["set-1"]);
    expect(result?.blockingSettlementsTotal).toBe(1);
  });

  it.each([
    ["otro código 409", new ApiError("x", 409, "OVERLAPPING_ACTIVE_ASSIGNMENT", { message: "x" })],
    ["config bloqueada", lockedError({ reason: "superseded" })],
    ["sin código", new ApiError("x", 500)],
    ["Error genérico", new Error("ASSIGNMENT_PERIOD_SETTLED")],
    ["valor no error", { code: "ASSIGNMENT_PERIOD_SETTLED" }],
  ])("%s → null", (_label, error) => {
    expect(readAssignmentPeriodSettledError(error)).toBeNull();
  });
});
