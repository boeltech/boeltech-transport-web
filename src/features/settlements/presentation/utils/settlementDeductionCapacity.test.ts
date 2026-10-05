import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import {
  allocateAdvancesFifo,
  deductionCapacityErrors,
  deductionsExceedErrorsFromServer,
  parseDeductionsExceedGrossError,
  remainingAdvanceRoom,
} from "./settlementDeductionCapacity";

const API_MESSAGE =
  "Los descuentos superan lo que el operador ganó en este corte. Reduce el anticipo a descontar; el resto queda pendiente en el anticipo para el siguiente corte.";

function exceedError(details: Record<string, unknown>, message = API_MESSAGE) {
  return new ApiError(message, 422, "SETTLEMENT_DEDUCTIONS_EXCEED_GROSS", details);
}

describe("parseDeductionsExceedGrossError", () => {
  it("path advances_to_apply → bloque de anticipos con el máximo del API", () => {
    expect(
      parseDeductionsExceedGrossError(
        exceedError({
          gross_amount: 2000,
          total_advances_deducted: 2500,
          total_other_deductions: 0,
          excess_amount: 500,
          max_advance_deductible: 2000,
          excess_source: "advances",
          path: ["advances_to_apply"],
        }),
      ),
    ).toEqual({ target: "advances", message: API_MESSAGE, maxAdvanceDeductible: 2000 });
  });

  it("path custom_items → bloque de descuentos manuales", () => {
    expect(
      parseDeductionsExceedGrossError(
        exceedError({ max_advance_deductible: 0, excess_source: "manual_deductions", path: ["custom_items"] }),
      )?.target,
    ).toBe("manual_items");
  });

  it("otro código o error no-API → null", () => {
    expect(parseDeductionsExceedGrossError(new ApiError("x", 422, "OTHER"))).toBeNull();
    expect(parseDeductionsExceedGrossError(new Error("x"))).toBeNull();
  });
});

describe("deductionCapacityErrors / deductionsExceedErrorsFromServer", () => {
  it("excedente de anticipos con el máximo formateado; sin excedente, nada", () => {
    expect(
      deductionCapacityErrors({ maxAdvanceDeductible: 2000, excessAmount: 500, excessSource: "advances" }),
    ).toEqual({
      advances:
        "Los anticipos superan lo que cabe en este pago (máximo $2,000.00). El resto queda pendiente en el anticipo para el siguiente corte.",
    });
    expect(
      deductionCapacityErrors({ maxAdvanceDeductible: 2000, excessAmount: 0, excessSource: null }),
    ).toEqual({});
  });

  it("anticipos bloqueados: el excedente se marca en las partidas manuales", () => {
    expect(
      deductionCapacityErrors(
        { maxAdvanceDeductible: 0, excessAmount: 100, excessSource: "advances" },
        { advancesEditable: false },
      ),
    ).toEqual({ manualItems: "Los descuentos manuales superan lo que ganó el operador en este corte." });
  });

  it("422 en borrador usa el copy local; fuera de borrador, el texto del API", () => {
    const parsed = { target: "advances" as const, message: API_MESSAGE, maxAdvanceDeductible: 1700 };
    expect(deductionsExceedErrorsFromServer(parsed, { useServerMessage: false }).advances).toContain(
      "máximo $1,700.00",
    );
    expect(deductionsExceedErrorsFromServer(parsed, { useServerMessage: true })).toEqual({
      advances: API_MESSAGE,
    });
  });
});

describe("allocateAdvancesFifo", () => {
  it("un anticipo de 2,500 con máximo 2,000 → 2,000", () => {
    expect(
      allocateAdvancesFifo([{ advanceId: "a", available: 2500, disbursedAt: "2026-10-01" }], 2000),
    ).toEqual({ a: 2000 });
  });

  it("dos anticipos (1,500 antes, 1,000 después) con máximo 2,000 → 1,500 y 500", () => {
    expect(
      allocateAdvancesFifo(
        [
          { advanceId: "later", available: 1000, disbursedAt: "2026-10-05T10:00:00Z" },
          { advanceId: "earlier", available: 1500, disbursedAt: "2026-10-01T10:00:00Z" },
        ],
        2000,
      ),
    ).toEqual({ earlier: 1500, later: 500 });
  });

  it("los que no alcanzan nada quedan fuera; sin fecha va al final", () => {
    expect(
      allocateAdvancesFifo(
        [
          { advanceId: "no-date", available: 300, disbursedAt: null },
          { advanceId: "dated", available: 1000, disbursedAt: "2026-10-01" },
        ],
        1000,
      ),
    ).toEqual({ dated: 1000 });
  });

  it("máximo 0 → nada; trabaja en centavos", () => {
    expect(allocateAdvancesFifo([{ advanceId: "a", available: 100, disbursedAt: null }], 0)).toEqual({});
    expect(
      allocateAdvancesFifo(
        [
          { advanceId: "a", available: 0.1, disbursedAt: "2026-01-01" },
          { advanceId: "b", available: 0.2, disbursedAt: "2026-01-02" },
        ],
        0.3,
      ),
    ).toEqual({ a: 0.1, b: 0.2 });
  });
});

describe("remainingAdvanceRoom", () => {
  it("topa al saldo libre y a lo que queda del máximo", () => {
    expect(remainingAdvanceRoom({ available: 2500, maxDeductible: 2000, otherAdvancesTotal: 0 })).toBe(2000);
    expect(remainingAdvanceRoom({ available: 1000, maxDeductible: 2000, otherAdvancesTotal: 1500 })).toBe(500);
    expect(remainingAdvanceRoom({ available: 1000, maxDeductible: 2000, otherAdvancesTotal: 2500 })).toBe(0);
  });
});
