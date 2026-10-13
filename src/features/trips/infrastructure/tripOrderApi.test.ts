import { describe, expect, it } from "vitest";
import {
  mapGenerateTripOrderResult,
  mapTripOrderStatus,
  parseTripOrderContentDispositionFileName,
} from "./tripOrderApi";

describe("mapTripOrderStatus", () => {
  it("mapea snake_case del API a camelCase", () => {
    const view = mapTripOrderStatus({
      trip_id: "t1",
      enabled: true,
      threshold: { met: false, missing: ["vehicle", "driver"] },
      eligibility: {
        can_generate: false,
        can_regenerate: false,
        can_download: false,
        reason_code: "TRIP_ORDER_THRESHOLD_INCOMPLETE",
      },
      current_emission: null,
      emission_count: 0,
    });

    expect(view.tripId).toBe("t1");
    expect(view.threshold.missing).toEqual(["vehicle", "driver"]);
    expect(view.eligibility.canGenerate).toBe(false);
    expect(view.eligibility.reasonCode).toBe("TRIP_ORDER_THRESHOLD_INCOMPLETE");
    expect(view.currentEmission).toBeNull();
    expect(view.emissionCount).toBe(0);
  });

  it("mapea emisión vigente con outdated del API", () => {
    const view = mapTripOrderStatus({
      trip_id: "t1",
      enabled: true,
      threshold: { met: true, missing: [] },
      eligibility: {
        can_generate: false,
        can_regenerate: true,
        can_download: true,
        reason_code: null,
      },
      current_emission: {
        id: "e1",
        version: 2,
        issued_at: "2026-10-12T18:00:00.000Z",
        issued_by_user_id: "u1",
        issued_by_name: "Ana",
        trip_status_at_issue: "scheduled",
        outdated: true,
        filename: "orden-viaje-V-1-v2.pdf",
      },
      emission_count: 2,
    });

    expect(view.currentEmission?.version).toBe(2);
    expect(view.currentEmission?.outdated).toBe(true);
    expect(view.currentEmission?.issuedByName).toBe("Ana");
    expect(view.eligibility.canRegenerate).toBe(true);
  });
});

describe("mapGenerateTripOrderResult", () => {
  it("envuelve emisión + message", () => {
    const result = mapGenerateTripOrderResult({
      data: {
        id: "e1",
        version: 1,
        issued_at: "2026-10-12T18:00:00.000Z",
        issued_by_user_id: null,
        issued_by_name: null,
        trip_status_at_issue: "scheduled",
        outdated: false,
        filename: "orden-viaje-x-v1.pdf",
      },
      message: "Orden de viaje generada",
    });
    expect(result.emission.version).toBe(1);
    expect(result.message).toBe("Orden de viaje generada");
  });
});

describe("parseTripOrderContentDispositionFileName", () => {
  it("decodifica filename* UTF-8", () => {
    expect(
      parseTripOrderContentDispositionFileName(
        "attachment; filename*=UTF-8''orden-viaje-V-2026-0042-v2.pdf",
      ),
    ).toBe("orden-viaje-V-2026-0042-v2.pdf");
  });

  it("acepta filename entre comillas", () => {
    expect(
      parseTripOrderContentDispositionFileName(
        'attachment; filename="orden-viaje.pdf"',
      ),
    ).toBe("orden-viaje.pdf");
  });

  it("null si falta header", () => {
    expect(parseTripOrderContentDispositionFileName(undefined)).toBeNull();
  });
});
