import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";

import { TripOperationalOutcome, TripStatus } from "@features/trips/domain";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { fleetSnapshotCopy } from "../../copy/tripDetail/fleetSnapshotCopy";
import {
  classifyFleetRefreshError,
  describeBlockDisabledReason,
  describeRefreshBlockedReason,
  formatCatalogCode,
  formatCpInvoiceFolio,
  formatGrossWeight,
  formatInsurance,
  resolveFleetSnapshotCardMode,
  shouldQueryTripFleetSnapshot,
  validateFleetRefreshReason,
} from "./tripFleetSnapshotHelpers";

const card = fleetSnapshotCopy.card;
const sheet = fleetSnapshotCopy.sheet;

describe("shouldQueryTripFleetSnapshot", () => {
  const visible = { canRead: true, isClientPortalView: false };
  const withCp = {
    cfdiEmissionIntent: "emitir_cfdi",
    operationalOutcome: TripOperationalOutcome.STANDARD,
  } as const;

  it("consulta en viajes con Carta Porte si hay permiso de lectura", () => {
    expect(shouldQueryTripFleetSnapshot(withCp, visible)).toBe(true);
  });

  it("no consulta sin permiso, en el portal, sin CFDI efectivo ni en viaje en falso", () => {
    expect(shouldQueryTripFleetSnapshot(withCp, { ...visible, canRead: false })).toBe(false);
    expect(shouldQueryTripFleetSnapshot(withCp, { ...visible, isClientPortalView: true })).toBe(
      false,
    );
    expect(
      shouldQueryTripFleetSnapshot({ ...withCp, cfdiEmissionIntent: "sin_cfdi_efectivo" }, visible),
    ).toBe(false);
    expect(
      shouldQueryTripFleetSnapshot(
        { ...withCp, operationalOutcome: TripOperationalOutcome.FALSE_TRIP },
        visible,
      ),
    ).toBe(false);
  });
});

describe("resolveFleetSnapshotCardMode", () => {
  const snapshot = { id: "snap-1" } as never;

  it("con foto siempre muestra datos", () => {
    expect(resolveFleetSnapshotCardMode({ readEnabled: true, snapshot }, TripStatus.SCHEDULED)).toBe(
      "data",
    );
  });

  it("sin foto: vacío solo si el viaje ya salió", () => {
    expect(
      resolveFleetSnapshotCardMode({ readEnabled: true, snapshot: null }, TripStatus.IN_PROGRESS),
    ).toBe("empty");
    expect(
      resolveFleetSnapshotCardMode({ readEnabled: true, snapshot: null }, TripStatus.COMPLETED),
    ).toBe("empty");
    expect(
      resolveFleetSnapshotCardMode({ readEnabled: true, snapshot: null }, TripStatus.SCHEDULED),
    ).toBe("hidden");
  });

  it("función apagada para el tenant: oculta", () => {
    expect(
      resolveFleetSnapshotCardMode({ readEnabled: false, snapshot }, TripStatus.IN_PROGRESS),
    ).toBe("hidden");
  });
});

describe("formatos", () => {
  it("peso bruto con dos decimales en toneladas", () => {
    expect(formatGrossWeight(18)).toBe("18.00 t");
    expect(formatGrossWeight("17.5")).toBe("17.50 t");
    expect(formatGrossWeight(null)).toBeNull();
  });

  it("clave de catálogo con descripción si existe", () => {
    expect(formatCatalogCode("C2", () => "Camión unitario")).toBe("C2 · Camión unitario");
    expect(formatCatalogCode("C2", () => null)).toBe("C2");
    expect(formatCatalogCode("", () => "x")).toBeNull();
  });

  it("seguro con póliza", () => {
    expect(formatInsurance("GNP", "MA-1")).toBe("GNP · Póliza MA-1");
    expect(formatInsurance("GNP", null)).toBe("GNP");
    expect(formatInsurance(null, null)).toBeNull();
  });

  it("folio de la factura con serie", () => {
    expect(formatCpInvoiceFolio({ id: "inv-1", serie: "A", folio: 15, stampedAt: null })).toBe(
      "A-15",
    );
    expect(formatCpInvoiceFolio({ id: "inv-1", serie: null, folio: 15, stampedAt: null })).toBe(
      "15",
    );
    expect(formatCpInvoiceFolio({ id: "inv-1", serie: null, folio: null, stampedAt: null })).toBe(
      "inv-1",
    );
  });
});

describe("motivos de bloqueo", () => {
  it("tarjeta: texto por código del API", () => {
    expect(describeRefreshBlockedReason("TRIP_CANCELLED")).toBe(card.blocked.cancelled);
    expect(describeRefreshBlockedReason("INVOICE_STAMPING_IN_PROGRESS")).toBe(card.blocked.stamping);
    expect(describeRefreshBlockedReason("FLEET_SNAPSHOT_VEHICLE_MISMATCH")).toBe(
      card.blocked.vehicleMismatch,
    );
    expect(describeRefreshBlockedReason("FLEET_SNAPSHOT_NO_CHANGES")).toBeNull();
    expect(describeRefreshBlockedReason(null)).toBeNull();
  });

  it("panel: sin cambios y catálogo inválido por bloque", () => {
    expect(describeBlockDisabledReason("FLEET_SNAPSHOT_NO_CHANGES")).toBe(sheet.blockNoChanges);
    expect(describeBlockDisabledReason("FLEET_MASTER_NOT_CP31_VALID")).toBe(sheet.blockInvalid);
    expect(describeBlockDisabledReason("TRIP_CANCELLED")).toBe(card.blocked.cancelled);
  });
});

describe("validateFleetRefreshReason", () => {
  it("exige entre 10 y 500 caracteres sin contar espacios de las orillas", () => {
    expect(validateFleetRefreshReason("   ")).toBe(sheet.reason.required);
    expect(validateFleetRefreshReason("  corto   ")).toBe(sheet.reason.tooShort);
    expect(validateFleetRefreshReason("1234567890")).toBeNull();
    expect(validateFleetRefreshReason("x".repeat(500))).toBeNull();
    expect(validateFleetRefreshReason("x".repeat(501))).toBe(sheet.reason.tooLong);
  });
});

describe("classifyFleetRefreshError", () => {
  it.each([
    ["FLEET_SNAPSHOT_STALE", 409, "stale"],
    ["FLEET_MASTER_CHANGED", 409, "stale"],
    ["FLEET_MASTER_NOT_CP31_VALID", 422, "invalid"],
    ["FLEET_SNAPSHOT_REFRESH_NOT_ALLOWED", 409, "notAllowed"],
    ["INVOICE_STAMPING_IN_PROGRESS", 409, "notAllowed"],
    ["FLEET_SNAPSHOT_NO_CHANGES", 409, "notAllowed"],
    ["FLEET_SNAPSHOT_DRIVER_MISMATCH", 409, "notAllowed"],
    ["REASON_REQUIRED", 400, "generic"],
    ["FORBIDDEN", 403, "forbidden"],
  ] as const)("%s (%i) → %s", (code, status, kind) => {
    expect(classifyFleetRefreshError(new ApiError("x", status, code))).toBe(kind);
  });

  it("un 403 crudo de axios cuenta como prohibido", () => {
    const error = new AxiosError("Forbidden", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 403,
      statusText: "Forbidden",
      data: {},
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    expect(classifyFleetRefreshError(error)).toBe("forbidden");
  });

  it("errores desconocidos son genéricos", () => {
    expect(classifyFleetRefreshError(new Error("boom"))).toBe("generic");
  });
});
