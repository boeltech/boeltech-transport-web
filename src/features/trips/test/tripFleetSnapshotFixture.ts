import {
  TripOperationalOutcome,
  TripStatus,
  type Trip,
  type TripFleetSnapshotView,
} from "@features/trips/domain";

/**
 * Vista de «Datos para Carta Porte» (GET /trips/:id/fleet-snapshot) ya en camelCase.
 * Por defecto: placa distinta en el catálogo (unidad refrescable), operador sin cambios,
 * sin factura con Carta Porte.
 */
export function fleetSnapshotViewFixture(
  overrides: Partial<TripFleetSnapshotView> = {},
): TripFleetSnapshotView {
  return {
    tripId: "trip-1",
    readEnabled: true,
    snapshot: {
      id: "snap-1",
      vehicle: {
        vehicleId: "veh-1",
        satTipoPermisoCode: "TPAF01",
        sctPermitNumber: "SCT-123",
        satConfigAutotransporteCode: "C2",
        licensePlate: "ABC1234",
        year: 2020,
        pesoBrutoVehicular: 18,
        insuranceCompany: "Qualitas",
        insurancePolicy: "RC-001",
        aseguraMedioAmbiente: null,
        polizaMedioAmbiente: null,
        aseguraCarga: null,
        polizaCarga: null,
        sctPermitExpiry: "2027-01-31",
        insuranceExpiry: "2027-03-31",
        source: "freeze_start",
        snapshotAt: "2026-10-01T14:00:00.000Z",
      },
      driver: {
        driverId: "drv-1",
        driverFullName: "Ana López",
        driverLicenseNumber: "LIC-77",
        driverRfc: "LOAA800101AB1",
        source: "freeze_start",
        snapshotAt: "2026-10-01T14:00:00.000Z",
      },
      createdAt: "2026-10-01T14:00:00.000Z",
      updatedAt: "2026-10-01T14:00:00.000Z",
    },
    master: {
      vehicle: {
        vehicleId: "veh-1",
        unitNumber: "U-12",
        isActive: true,
        deactivatedAt: null,
        deactivationReasonCode: null,
        satTipoPermisoCode: "TPAF01",
        sctPermitNumber: "SCT-123",
        satConfigAutotransporteCode: "C2",
        licensePlate: "ABC1243",
        year: 2020,
        pesoBrutoVehicular: 18,
        insuranceCompany: "Qualitas",
        insurancePolicy: "RC-001",
        aseguraMedioAmbiente: null,
        polizaMedioAmbiente: null,
        aseguraCarga: null,
        polizaCarga: null,
        sctPermitExpiry: "2027-01-31",
        insuranceExpiry: "2027-03-31",
      },
      driver: {
        driverId: "drv-1",
        isActive: true,
        driverFullName: "Ana López",
        driverLicenseNumber: "LIC-77",
        driverRfc: "LOAA800101AB1",
      },
    },
    identity: { vehicleMatches: true, driverMatches: true },
    diff: {
      vehicle: [{ field: "license_plate", snapshot: "ABC1234", master: "ABC1243" }],
      driver: [],
    },
    masterValidation: { vehicle: [], driver: [] },
    masterFingerprint: { vehicle: "fp-veh-1", driver: "fp-drv-1" },
    fiscalImpact: { activeCpInvoiceCount: 0 },
    cpInvoice: null,
    cpInvoiceOutdated: false,
    lastRefresh: { vehicle: null, driver: null },
    warnings: {
      vehicle: [{ code: "identity_field_changed", fields: ["license_plate"] }],
      driver: [],
    },
    refresh: {
      allowed: true,
      reasonCode: null,
      vehicle: { allowed: true, reasonCode: null },
      driver: { allowed: false, reasonCode: "FLEET_SNAPSHOT_NO_CHANGES" },
    },
    ...overrides,
  };
}

/** Viaje mínimo para la tarjeta (en curso, con Carta Porte). */
export function fleetSnapshotTripFixture(overrides: Partial<Trip> = {}): Trip {
  return {
    id: "trip-1",
    tenantId: "tenant-1",
    tripCode: "VJ-001",
    status: TripStatus.IN_PROGRESS,
    scheduledDeparture: new Date("2026-10-01T08:00:00.000Z"),
    scheduledArrival: new Date("2026-10-01T18:00:00.000Z"),
    actualDeparture: null,
    actualArrival: null,
    mileage: { start: 100_000, end: null },
    clientId: "client-1",
    client: { id: "client-1", legalName: "Transportes Alfa" },
    cfdiDocumentIntent: "ingreso",
    cfdiEmissionIntent: "emitir_cfdi",
    operationalOutcome: TripOperationalOutcome.STANDARD,
    vehicleId: "veh-1",
    vehicle: { id: "veh-1", unitNumber: "U-12", licensePlate: "ABC1243" },
    driverId: "drv-1",
    driver: { id: "drv-1", fullName: "Ana López" },
    trailers: [],
    notes: null,
    statusHistory: [],
    ...overrides,
  } as Trip;
}
