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
        resolution: "identified",
        candidate_stops: [
          {
            stop_id: "stop-2",
            stop_order: 2,
            tipo_ubicacion: "Destino",
            current_rfc: "CRN140902QW3",
          },
        ],
      },
    );

    expect(parseInvalidRfcAtStopDetails(error)).toEqual({
      stopId: "stop-2",
      currentRfc: "CRN140902QW3",
      stopOrder: 2,
      resolution: "identified",
      candidateStops: [
        {
          stopId: "stop-2",
          stopOrder: 2,
          tipoUbicacion: "Destino",
          currentRfc: "CRN140902QW3",
        },
      ],
    });
  });

  it("parses ambiguous candidate_stops in snake_case", () => {
    const error = new ApiError(
      "RFC inválido en una parada del viaje",
      422,
      "INVALID_RFC_AT_STOP",
      {
        stopId: null,
        currentRfc: null,
        stopOrder: null,
        resolution: "ambiguous",
        candidate_stops: [
          {
            stop_id: "stop-origin",
            stop_order: 1,
            tipo_ubicacion: "Origen",
            current_rfc: "EKU9003173C9",
          },
          {
            stop_id: "stop-dest",
            stop_order: 2,
            tipo_ubicacion: "Destino",
            current_rfc: "URE180429TM6",
          },
        ],
      },
    );

    expect(parseInvalidRfcAtStopDetails(error)).toEqual({
      stopId: null,
      currentRfc: null,
      stopOrder: null,
      resolution: "ambiguous",
      candidateStops: [
        {
          stopId: "stop-origin",
          stopOrder: 1,
          tipoUbicacion: "Origen",
          currentRfc: "EKU9003173C9",
        },
        {
          stopId: "stop-dest",
          stopOrder: 2,
          tipoUbicacion: "Destino",
          currentRfc: "URE180429TM6",
        },
      ],
    });
  });

  it("accepts camelCase candidateStops for robustness", () => {
    const error = new ApiError(
      "RFC inválido",
      422,
      "INVALID_RFC_AT_STOP",
      {
        resolution: "ambiguous",
        candidateStops: [
          {
            stopId: "stop-1",
            stopOrder: 1,
            tipoUbicacion: "Origen",
            currentRfc: "AAA010101AAA",
          },
        ],
      },
    );

    expect(parseInvalidRfcAtStopDetails(error)?.candidateStops).toEqual([
      {
        stopId: "stop-1",
        stopOrder: 1,
        tipoUbicacion: "Origen",
        currentRfc: "AAA010101AAA",
      },
    ]);
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
      resolution: null,
      candidateStops: [],
    });
  });

  it("parses unknown with empty candidates", () => {
    const error = new ApiError("RFC inválido", 422, "INVALID_RFC_AT_STOP", {
      stopId: null,
      resolution: "unknown",
      candidate_stops: [],
    });
    expect(parseInvalidRfcAtStopDetails(error)).toMatchObject({
      resolution: "unknown",
      candidateStops: [],
    });
  });
});
