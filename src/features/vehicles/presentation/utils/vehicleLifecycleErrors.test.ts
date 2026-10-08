import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import {
  toDeactivateErrorView,
  toRestoreErrorView,
} from "./vehicleLifecycleErrors";

describe("toDeactivateErrorView", () => {
  it("extrae viajes activos y total del 409", () => {
    const view = toDeactivateErrorView(
      new ApiError("Viajes activos.", 409, "VEHICLE_ASSIGNED_TO_ACTIVE_TRIP", {
        active_trip_count: 4,
        active_trips: [
          { id: "t1", trip_code: "VJ-0012" },
          { id: "t2", trip_code: "VJ-0019" },
          { id: null, trip_code: "inválido" },
        ],
      }),
    );

    expect(view).toEqual({
      kind: "active_trips",
      trips: [
        { id: "t1", tripCode: "VJ-0012" },
        { id: "t2", tripCode: "VJ-0019" },
      ],
      total: 4,
      message: "Viajes activos.",
    });
  });

  it("409 sin detalles de viajes conserva el mensaje para el fallback", () => {
    const view = toDeactivateErrorView(
      new ApiError("Viajes activos.", 409, "VEHICLE_ASSIGNED_TO_ACTIVE_TRIP"),
    );
    expect(view).toMatchObject({ kind: "active_trips", trips: [], total: 0 });
  });

  it("otros códigos son genéricos", () => {
    expect(
      toDeactivateErrorView(new ApiError("No encontrada", 404, "NOT_FOUND")),
    ).toEqual({ kind: "generic", message: "No encontrada" });
  });
});

describe("toRestoreErrorView", () => {
  it("UNIT_NUMBER_EXISTS con id en conflicto", () => {
    expect(
      toRestoreErrorView(
        new ApiError("Ya existe", 400, "UNIT_NUMBER_EXISTS", {
          conflicting_vehicle_id: "v-9",
          unit_number: "T-12",
        }),
      ),
    ).toEqual({
      kind: "conflict",
      field: "unit_number",
      value: "T-12",
      conflictingVehicleId: "v-9",
      message: "Ya existe",
    });
  });

  it("LICENSE_PLATE_EXISTS sin id deja el enlace fuera", () => {
    expect(
      toRestoreErrorView(
        new ApiError("Ya existe", 400, "LICENSE_PLATE_EXISTS", {
          license_plate: "ABC-123",
        }),
      ),
    ).toMatchObject({
      kind: "conflict",
      field: "license_plate",
      value: "ABC-123",
      conflictingVehicleId: null,
    });
  });

  it("422 se presenta como unidad no operable sin punto final", () => {
    expect(
      toRestoreErrorView(new ApiError("Falta la póliza.", 422, "X_CODE")),
    ).toEqual({ kind: "not_operable", message: "Falta la póliza" });
  });

  it("VEHICLE_ALREADY_ACTIVE es genérico", () => {
    expect(
      toRestoreErrorView(
        new ApiError("La unidad ya está activa.", 409, "VEHICLE_ALREADY_ACTIVE"),
      ),
    ).toEqual({ kind: "generic", message: "La unidad ya está activa." });
  });
});
