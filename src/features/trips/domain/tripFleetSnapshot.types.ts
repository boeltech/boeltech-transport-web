/**
 * Datos para Carta Porte del viaje: unidad y operador congelados
 * (`GET /trips/:tripId/fleet-snapshot`, `POST …/fleet-snapshot:refresh`).
 * Tipos en camelCase tras `deepToCamel`; los valores de `diff[].field`
 * conservan el nombre de columna del API (snake_case).
 */

export type TripFleetSnapshotBlock = "vehicle" | "driver";

export type TripFleetSnapshotSource =
  | "freeze_stamp"
  | "freeze_start"
  | "reassignment"
  | "substitution_correction"
  | "master_refresh"
  | "backfill_xml"
  | "backfill_master";

export interface TripFleetVehicleValues {
  vehicleId: string | null;
  satTipoPermisoCode: string | null;
  sctPermitNumber: string | null;
  satConfigAutotransporteCode: string | null;
  licensePlate: string | null;
  year: number | string | null;
  pesoBrutoVehicular: number | string | null;
  insuranceCompany: string | null;
  insurancePolicy: string | null;
  aseguraMedioAmbiente: string | null;
  polizaMedioAmbiente: string | null;
  aseguraCarga: string | null;
  polizaCarga: string | null;
  /** `YYYY-MM-DD` */
  sctPermitExpiry: string | null;
  /** `YYYY-MM-DD` */
  insuranceExpiry: string | null;
}

export interface TripFleetDriverValues {
  driverId: string | null;
  driverFullName: string | null;
  driverLicenseNumber: string | null;
  driverRfc: string | null;
}

export interface TripFleetSnapshotBlockMeta {
  source: TripFleetSnapshotSource;
  snapshotAt: string;
}

export interface TripFleetSnapshotData {
  id: string;
  vehicle: TripFleetVehicleValues & TripFleetSnapshotBlockMeta;
  driver: TripFleetDriverValues & TripFleetSnapshotBlockMeta;
  createdAt: string;
  updatedAt: string;
}

export interface TripFleetMasterVehicle extends TripFleetVehicleValues {
  unitNumber: string | null;
  isActive: boolean;
  deactivatedAt: string | null;
  deactivationReasonCode: string | null;
}

export interface TripFleetMasterDriver extends TripFleetDriverValues {
  isActive: boolean;
}

/** Columna del API (`license_plate`, `driver_rfc`, …). */
export type TripFleetDiffFieldKey =
  | "sat_tipo_permiso_code"
  | "sct_permit_number"
  | "sat_config_autotransporte_code"
  | "license_plate"
  | "year"
  | "peso_bruto_vehicular"
  | "insurance_company"
  | "insurance_policy"
  | "asegura_medio_ambiente"
  | "poliza_medio_ambiente"
  | "asegura_carga"
  | "poliza_carga"
  | "sct_permit_expiry"
  | "insurance_expiry"
  | "driver_full_name"
  | "driver_license_number"
  | "driver_rfc";

export type TripFleetValue = string | number | null;

export interface TripFleetDiffEntry {
  field: TripFleetDiffFieldKey;
  snapshot: TripFleetValue;
  master: TripFleetValue;
}

export interface TripFleetMasterValidationIssue {
  code: string;
  path: string | null;
  message: string;
}

export type TripFleetRefreshReasonCode =
  | "FLEET_SNAPSHOT_NOT_FOUND"
  | "TRIP_CANCELLED"
  | "INVOICE_STAMPING_IN_PROGRESS"
  | "FLEET_SNAPSHOT_VEHICLE_MISMATCH"
  | "FLEET_SNAPSHOT_DRIVER_MISMATCH"
  | "FLEET_MASTER_NOT_CP31_VALID"
  | "FLEET_SNAPSHOT_NO_CHANGES";

export interface TripFleetRefreshBlockState {
  allowed: boolean;
  reasonCode: TripFleetRefreshReasonCode | null;
}

export type TripFleetWarningCode =
  | "insurance_or_permit_changed"
  | "identity_field_changed"
  | "vehicle_deactivated_error_captura";

export interface TripFleetWarning {
  code: TripFleetWarningCode;
  fields: TripFleetDiffFieldKey[];
}

export interface TripFleetLastRefresh {
  at: string;
  byName: string | null;
  reason: string;
}

export interface TripFleetCpInvoice {
  id: string;
  serie: string | null;
  folio: number | string | null;
  stampedAt: string | null;
}

export type TripFleetPerBlock<T> = Record<TripFleetSnapshotBlock, T>;

export interface TripFleetSnapshotView {
  tripId: string;
  readEnabled: boolean;
  snapshot: TripFleetSnapshotData | null;
  master: {
    vehicle: TripFleetMasterVehicle;
    driver: TripFleetMasterDriver;
  } | null;
  identity: { vehicleMatches: boolean; driverMatches: boolean };
  diff: TripFleetPerBlock<TripFleetDiffEntry[]>;
  masterValidation: TripFleetPerBlock<TripFleetMasterValidationIssue[]>;
  masterFingerprint: TripFleetPerBlock<string | null>;
  fiscalImpact: { activeCpInvoiceCount: number };
  cpInvoice: TripFleetCpInvoice | null;
  cpInvoiceOutdated: boolean;
  lastRefresh: TripFleetPerBlock<TripFleetLastRefresh | null>;
  warnings: TripFleetPerBlock<TripFleetWarning[]>;
  refresh: {
    allowed: boolean;
    reasonCode: TripFleetRefreshReasonCode | null;
    vehicle: TripFleetRefreshBlockState;
    driver: TripFleetRefreshBlockState;
  };
}

export interface RefreshTripFleetSnapshotInput {
  blocks: TripFleetPerBlock<boolean>;
  reason: string;
  expected: {
    snapshotUpdatedAt: string;
    masterFingerprint: Partial<TripFleetPerBlock<string>>;
  };
}

export interface RefreshTripFleetSnapshotResult {
  fleetSnapshot: TripFleetSnapshotData;
  refreshedBlocks: TripFleetSnapshotBlock[];
  changedFields: string[];
  /** `true` solo si este refresco levantó la bandera; el aviso se decide con el GET re-consultado. */
  requiresFiscalAttention: boolean;
  auditLogId: string | null;
  message: string;
}
