import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import {
  isMissingDataAckRequiredError,
  parseNoRuleAckRequiredError,
  parsePeriodPartialOverlapError,
  parseTripInActiveSettlementError,
} from "./settlementCreateConflicts";

describe("settlementCreateConflicts", () => {
  it("TRIP_IN_ACTIVE_SETTLEMENT → viajes con folio y estado", () => {
    const error = new ApiError("x", 409, "TRIP_IN_ACTIVE_SETTLEMENT", {
      conflicts: [
        {
          trip_id: "t-1",
          trip_code: "TRP-1",
          settlement_id: "s-1",
          settlement_number: "LIQ-202610-0001",
          status: "approved",
        },
      ],
    });

    expect(parseTripInActiveSettlementError(error)).toEqual([
      {
        tripId: "t-1",
        tripCode: "TRP-1",
        settlementId: "s-1",
        settlementNumber: "LIQ-202610-0001",
        status: "approved",
      },
    ]);
  });

  it("PERIOD_PARTIAL_OVERLAP → folio, período y fecha sugerida", () => {
    const error = new ApiError("x", 409, "PERIOD_PARTIAL_OVERLAP", {
      settlement_id: "s-1",
      settlement_number: "LIQ-202610-0001",
      status: "draft",
      period_start: "2026-09-01",
      period_end: "2026-09-07",
      suggested_period_start: "2026-09-08",
    });

    expect(parsePeriodPartialOverlapError(error)).toEqual({
      settlementId: "s-1",
      settlementNumber: "LIQ-202610-0001",
      status: "draft",
      periodStart: "2026-09-01",
      periodEnd: "2026-09-07",
      suggestedPeriodStart: "2026-09-08",
    });
  });

  it("NO_RULE_TRIPS_ACK_REQUIRED → códigos de viaje", () => {
    const error = new ApiError("x", 422, "NO_RULE_TRIPS_ACK_REQUIRED", {
      trip_codes: ["TRP-1", "TRP-2"],
    });

    expect(parseNoRuleAckRequiredError(error)).toEqual(["TRP-1", "TRP-2"]);
  });

  it("ZERO_KM / ZERO_FREIGHT_ACK_REQUIRED → falta confirmar datos faltantes", () => {
    expect(isMissingDataAckRequiredError(new ApiError("x", 422, "ZERO_KM_ACK_REQUIRED"))).toBe(true);
    expect(
      isMissingDataAckRequiredError(
        new ApiError("x", 422, "ZERO_FREIGHT_ACK_REQUIRED", { trip_codes: ["TRP-1"] }),
      ),
    ).toBe(true);
    expect(
      isMissingDataAckRequiredError(new ApiError("x", 422, "NO_RULE_TRIPS_ACK_REQUIRED")),
    ).toBe(false);
    expect(isMissingDataAckRequiredError(new Error("x"))).toBe(false);
  });

  it("otro código o error genérico → null", () => {
    const other = new ApiError("x", 409, "SETTLEMENT_NOT_MUTABLE");
    expect(parseTripInActiveSettlementError(other)).toBeNull();
    expect(parsePeriodPartialOverlapError(other)).toBeNull();
    expect(parseNoRuleAckRequiredError(new Error("x"))).toBeNull();
  });
});
