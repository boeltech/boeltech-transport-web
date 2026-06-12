import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { parseInvalidRfcAtStopDetails } from "./invalidRfcAtStopError";

describe("parseInvalidRfcAtStopDetails", () => {
  it("parses structured INVALID_RFC_AT_STOP details", () => {
    const error = new ApiError(
      "RFC inválido en una parada del viaje",
      422,
      "INVALID_RFC_AT_STOP",
      {
        stopId: "stop-2",
        currentRfc: "CRN140902QW3",
        stopOrder: 2,
      },
    );

    expect(parseInvalidRfcAtStopDetails(error)).toEqual({
      stopId: "stop-2",
      currentRfc: "CRN140902QW3",
      stopOrder: 2,
    });
  });

  it("returns null for non-fiscal errors", () => {
    const error = new ApiError("Otro", 422, "PAC_VALIDATION_ERROR");
    expect(parseInvalidRfcAtStopDetails(error)).toBeNull();
  });

  it("returns null ids when details are missing", () => {
    const error = new ApiError(
      "RFC inválido",
      422,
      "INVALID_RFC_AT_STOP",
    );
    expect(parseInvalidRfcAtStopDetails(error)).toEqual({
      stopId: null,
      currentRfc: null,
      stopOrder: null,
    });
  });
});
