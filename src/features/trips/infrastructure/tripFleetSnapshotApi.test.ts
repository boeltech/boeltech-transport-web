import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildRefreshTripFleetSnapshotBody,
  mapRefreshTripFleetSnapshotResult,
  mapTripFleetSnapshotView,
  tripFleetSnapshotApi,
} from "./tripFleetSnapshotApi";

const { mockGet, mockPost } = vi.hoisted(() => ({ mockGet: vi.fn(), mockPost: vi.fn() }));

vi.mock("@shared/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/api")>()),
  apiClient: { get: mockGet, post: mockPost },
}));

const rawView = {
  trip_id: "trip-1",
  read_enabled: true,
  snapshot: {
    id: "snap-1",
    vehicle: { vehicle_id: "veh-1", license_plate: "ABC1234", source: "freeze_start" },
    driver: { driver_id: "drv-1", driver_full_name: "Ana López", source: "freeze_start" },
    created_at: "2026-10-01T14:00:00.000Z",
    updated_at: "2026-10-01T14:00:00.000Z",
  },
  diff: {
    vehicle: [{ field: "license_plate", snapshot: "ABC1234", master: "ABC1243" }],
    driver: [],
  },
  master_fingerprint: { vehicle: "fp-veh-1", driver: "fp-drv-1" },
  cp_invoice: { id: "inv-1", serie: "A", folio: 15, stamped_at: null },
  cp_invoice_outdated: true,
  refresh: {
    allowed: true,
    reason_code: null,
    vehicle: { allowed: true, reason_code: null },
    driver: { allowed: false, reason_code: "FLEET_SNAPSHOT_NO_CHANGES" },
  },
};

describe("tripFleetSnapshotApi", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it("mapea la vista a camelCase y conserva el nombre de columna en diff[].field", () => {
    const view = mapTripFleetSnapshotView(rawView);
    expect(view.tripId).toBe("trip-1");
    expect(view.snapshot?.vehicle.licensePlate).toBe("ABC1234");
    expect(view.snapshot?.updatedAt).toBe("2026-10-01T14:00:00.000Z");
    expect(view.diff.vehicle[0]?.field).toBe("license_plate");
    expect(view.masterFingerprint.vehicle).toBe("fp-veh-1");
    expect(view.cpInvoiceOutdated).toBe(true);
    expect(view.refresh.driver.reasonCode).toBe("FLEET_SNAPSHOT_NO_CHANGES");
  });

  it("GET usa /trips/:id/fleet-snapshot y desenvuelve data", async () => {
    mockGet.mockResolvedValue({ data: rawView });
    const view = await tripFleetSnapshotApi.get("trip-1");
    expect(mockGet).toHaveBeenCalledWith("/trips/trip-1/fleet-snapshot");
    expect(view.snapshot?.id).toBe("snap-1");
  });

  it("el cuerpo solo lleva la huella de los bloques pedidos y el motivo recortado", () => {
    expect(
      buildRefreshTripFleetSnapshotBody({
        blocks: { vehicle: true, driver: false },
        reason: "  La placa se capturó mal.  ",
        expected: {
          snapshotUpdatedAt: "2026-10-01T14:00:00.000Z",
          masterFingerprint: { vehicle: "fp-veh-1", driver: "fp-drv-1" },
        },
      }),
    ).toEqual({
      blocks: { vehicle: true, driver: false },
      reason: "La placa se capturó mal.",
      expected: {
        snapshotUpdatedAt: "2026-10-01T14:00:00.000Z",
        masterFingerprint: { vehicle: "fp-veh-1" },
      },
    });
  });

  it("POST usa …/fleet-snapshot:refresh y mapea la respuesta", async () => {
    mockPost.mockResolvedValue({
      data: {
        fleet_snapshot: rawView.snapshot,
        refreshed_blocks: ["vehicle"],
        changed_fields: ["license_plate"],
        requires_fiscal_attention: false,
        audit_log_id: "audit-1",
      },
      message: "Datos para Carta Porte refrescados",
    });

    const result = await tripFleetSnapshotApi.refresh("trip-1", {
      blocks: { vehicle: true, driver: true },
      reason: "Corrección de captura en el catálogo.",
      expected: {
        snapshotUpdatedAt: "2026-10-01T14:00:00.000Z",
        masterFingerprint: { vehicle: "fp-veh-1", driver: "fp-drv-1" },
      },
    });

    expect(mockPost).toHaveBeenCalledWith("/trips/trip-1/fleet-snapshot:refresh", {
      blocks: { vehicle: true, driver: true },
      reason: "Corrección de captura en el catálogo.",
      expected: {
        snapshotUpdatedAt: "2026-10-01T14:00:00.000Z",
        masterFingerprint: { vehicle: "fp-veh-1", driver: "fp-drv-1" },
      },
    });
    expect(result).toMatchObject({
      refreshedBlocks: ["vehicle"],
      changedFields: ["license_plate"],
      requiresFiscalAttention: false,
      auditLogId: "audit-1",
      message: "Datos para Carta Porte refrescados",
    });
    expect(result.fleetSnapshot.vehicle.licensePlate).toBe("ABC1234");
  });

  it("respuesta mínima: listas vacías y bandera en false", () => {
    expect(mapRefreshTripFleetSnapshotResult({ data: { fleet_snapshot: null } })).toMatchObject({
      refreshedBlocks: [],
      changedFields: [],
      requiresFiscalAttention: false,
      auditLogId: null,
      message: "",
    });
  });
});
