import { isApiError, isAxiosError } from "@shared/api/interceptors/error-handler";
import { formatDate } from "@shared/utils/dateUtils";
import {
  TripOperationalOutcome,
  TripStatus,
  type Trip,
  type TripFleetCpInvoice,
  type TripFleetDiffFieldKey,
  type TripFleetDriverValues,
  type TripFleetRefreshReasonCode,
  type TripFleetSnapshotBlock,
  type TripFleetSnapshotView,
  type TripFleetValue,
  type TripFleetVehicleValues,
} from "@features/trips/domain";
import { fleetSnapshotCopy } from "../../copy/tripDetail/fleetSnapshotCopy";

const cardCopy = fleetSnapshotCopy.card;
const sheetCopy = fleetSnapshotCopy.sheet;

export const FLEET_REFRESH_REASON_MIN_LENGTH = 10;
export const FLEET_REFRESH_REASON_MAX_LENGTH = 500;

// ============================================================================
// Visibilidad (PRD D2)
// ============================================================================

/** Sin Carta Porte (`sin_cfdi_efectivo`, viaje en falso) o portal cliente: no se consulta. */
export function shouldQueryTripFleetSnapshot(
  trip: Pick<Trip, "cfdiEmissionIntent" | "operationalOutcome">,
  { canRead, isClientPortalView }: { canRead: boolean; isClientPortalView: boolean },
): boolean {
  if (!canRead || isClientPortalView) return false;
  if (trip.cfdiEmissionIntent === "sin_cfdi_efectivo") return false;
  if (trip.operationalOutcome === TripOperationalOutcome.FALSE_TRIP) return false;
  return true;
}

/** Sin foto la tarjeta solo aparece cuando el viaje ya salió. */
export function tripExpectsFleetSnapshot(status: Trip["status"]): boolean {
  return status === TripStatus.IN_PROGRESS || status === TripStatus.COMPLETED;
}

export type FleetSnapshotCardMode = "hidden" | "data" | "empty";

export function resolveFleetSnapshotCardMode(
  view: Pick<TripFleetSnapshotView, "readEnabled" | "snapshot">,
  status: Trip["status"],
): FleetSnapshotCardMode {
  if (!view.readEnabled) return "hidden";
  if (view.snapshot) return "data";
  return tripExpectsFleetSnapshot(status) ? "empty" : "hidden";
}

// ============================================================================
// Campos (orden de la comparación y de la tarjeta)
// ============================================================================

export type FleetFieldKind = "text" | "date" | "weight" | "config" | "permit";

export interface VehicleFleetFieldDef {
  key: TripFleetDiffFieldKey;
  prop: keyof TripFleetVehicleValues;
  label: string;
  kind: FleetFieldKind;
}

export interface DriverFleetFieldDef {
  key: TripFleetDiffFieldKey;
  prop: keyof TripFleetDriverValues;
  label: string;
  kind: FleetFieldKind;
}

export const VEHICLE_FLEET_FIELDS: readonly VehicleFleetFieldDef[] = [
  { key: "license_plate", prop: "licensePlate", label: cardCopy.label.plate, kind: "text" },
  {
    key: "sat_config_autotransporte_code",
    prop: "satConfigAutotransporteCode",
    label: cardCopy.label.config,
    kind: "config",
  },
  {
    key: "sat_tipo_permiso_code",
    prop: "satTipoPermisoCode",
    label: cardCopy.label.permitType,
    kind: "permit",
  },
  {
    key: "sct_permit_number",
    prop: "sctPermitNumber",
    label: cardCopy.label.permitNumber,
    kind: "text",
  },
  { key: "year", prop: "year", label: cardCopy.label.year, kind: "text" },
  {
    key: "peso_bruto_vehicular",
    prop: "pesoBrutoVehicular",
    label: cardCopy.label.grossWeight,
    kind: "weight",
  },
  {
    key: "insurance_company",
    prop: "insuranceCompany",
    label: cardCopy.label.rcInsurer,
    kind: "text",
  },
  {
    key: "insurance_policy",
    prop: "insurancePolicy",
    label: cardCopy.label.rcPolicy,
    kind: "text",
  },
  {
    key: "insurance_expiry",
    prop: "insuranceExpiry",
    label: cardCopy.label.rcExpiry,
    kind: "date",
  },
  {
    key: "sct_permit_expiry",
    prop: "sctPermitExpiry",
    label: cardCopy.label.permitExpiry,
    kind: "date",
  },
  {
    key: "asegura_medio_ambiente",
    prop: "aseguraMedioAmbiente",
    label: cardCopy.label.envInsurance,
    kind: "text",
  },
  {
    key: "poliza_medio_ambiente",
    prop: "polizaMedioAmbiente",
    label: cardCopy.label.envPolicy,
    kind: "text",
  },
  { key: "asegura_carga", prop: "aseguraCarga", label: cardCopy.label.cargoInsurance, kind: "text" },
  { key: "poliza_carga", prop: "polizaCarga", label: cardCopy.label.cargoPolicy, kind: "text" },
];

export const DRIVER_FLEET_FIELDS: readonly DriverFleetFieldDef[] = [
  {
    key: "driver_full_name",
    prop: "driverFullName",
    label: cardCopy.label.driverName,
    kind: "text",
  },
  { key: "driver_rfc", prop: "driverRfc", label: cardCopy.label.driverRfc, kind: "text" },
  {
    key: "driver_license_number",
    prop: "driverLicenseNumber",
    label: cardCopy.label.driverLicense,
    kind: "text",
  },
];

export interface FleetCatalogLabels {
  configVehicularLabel: (code: string | null | undefined) => string | null;
  tipoPermisoLabel: (code: string | null | undefined) => string | null;
}

function isBlank(value: TripFleetValue | undefined): boolean {
  return value === null || value === undefined || String(value).trim() === "";
}

export function formatGrossWeight(value: TripFleetValue | undefined): string | null {
  if (isBlank(value)) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return cardCopy.format.grossWeight(n.toFixed(2));
}

export function formatCatalogCode(
  code: TripFleetValue | undefined,
  resolve: (code: string) => string | null,
): string | null {
  if (isBlank(code)) return null;
  const text = String(code).trim();
  const label = resolve(text);
  return label ? cardCopy.format.catalogCode(text, label) : text;
}

/** Texto para mostrar; `null` = vacío (lo pinta como «—»). */
export function formatFleetValue(
  kind: FleetFieldKind,
  value: TripFleetValue | undefined,
  labels: FleetCatalogLabels,
): string | null {
  if (isBlank(value)) return null;
  switch (kind) {
    case "date": {
      const formatted = formatDate(String(value));
      return formatted === "-" ? String(value) : formatted;
    }
    case "weight":
      return formatGrossWeight(value);
    case "config":
      return formatCatalogCode(value, (code) => labels.configVehicularLabel(code));
    case "permit":
      return formatCatalogCode(value, (code) => labels.tipoPermisoLabel(code));
    default:
      return String(value).trim();
  }
}

export function formatInsurance(
  insurer: TripFleetValue | undefined,
  policy: TripFleetValue | undefined,
): string | null {
  if (isBlank(insurer) && isBlank(policy)) return null;
  if (isBlank(policy)) return String(insurer);
  return cardCopy.format.insurance(
    isBlank(insurer) ? cardCopy.value.empty : String(insurer),
    String(policy),
  );
}

export function diffFieldSet(
  view: Pick<TripFleetSnapshotView, "diff">,
  block: TripFleetSnapshotBlock,
): ReadonlySet<TripFleetDiffFieldKey> {
  return new Set((view.diff?.[block] ?? []).map((entry) => entry.field));
}

// ============================================================================
// Factura con CP y motivos de bloqueo
// ============================================================================

export function formatCpInvoiceFolio(invoice: TripFleetCpInvoice): string {
  const folio = invoice.folio == null ? "" : String(invoice.folio);
  const serie = invoice.serie?.trim();
  if (serie && folio) return `${serie}-${folio}`;
  return serie || folio || invoice.id;
}

/** Texto apagado de la tarjeta cuando el API no permite refrescar (ADR-0043: la regla es del API). */
export function describeRefreshBlockedReason(
  reason: TripFleetRefreshReasonCode | null,
): string | null {
  switch (reason) {
    case "TRIP_CANCELLED":
      return cardCopy.blocked.cancelled;
    case "INVOICE_STAMPING_IN_PROGRESS":
      return cardCopy.blocked.stamping;
    case "FLEET_MASTER_NOT_CP31_VALID":
      return cardCopy.blocked.invalid;
    case "FLEET_SNAPSHOT_VEHICLE_MISMATCH":
      return cardCopy.blocked.vehicleMismatch;
    case "FLEET_SNAPSHOT_DRIVER_MISMATCH":
      return cardCopy.blocked.driverMismatch;
    default:
      return null;
  }
}

/** Razón de una casilla deshabilitada en el panel. */
export function describeBlockDisabledReason(
  reason: TripFleetRefreshReasonCode | null,
): string | null {
  switch (reason) {
    case "FLEET_SNAPSHOT_NO_CHANGES":
      return sheetCopy.blockNoChanges;
    case "FLEET_MASTER_NOT_CP31_VALID":
      return sheetCopy.blockInvalid;
    default:
      return describeRefreshBlockedReason(reason);
  }
}

// ============================================================================
// Motivo (UX; el API valida 10–500 con el schema del paquete)
// ============================================================================

export function validateFleetRefreshReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (!trimmed) return sheetCopy.reason.required;
  if (trimmed.length < FLEET_REFRESH_REASON_MIN_LENGTH) return sheetCopy.reason.tooShort;
  if (trimmed.length > FLEET_REFRESH_REASON_MAX_LENGTH) return sheetCopy.reason.tooLong;
  return null;
}

// ============================================================================
// Errores del POST
// ============================================================================

export type FleetRefreshErrorKind = "forbidden" | "stale" | "invalid" | "notAllowed" | "generic";

const STALE_CODES = new Set(["FLEET_SNAPSHOT_STALE", "FLEET_MASTER_CHANGED"]);
const NOT_ALLOWED_CODES = new Set([
  "FLEET_SNAPSHOT_REFRESH_NOT_ALLOWED",
  "INVOICE_STAMPING_IN_PROGRESS",
  "FLEET_SNAPSHOT_NO_CHANGES",
  "FLEET_SNAPSHOT_VEHICLE_MISMATCH",
  "FLEET_SNAPSHOT_DRIVER_MISMATCH",
]);

export function classifyFleetRefreshError(error: unknown): FleetRefreshErrorKind {
  if (isAxiosError(error) && error.response?.status === 403) return "forbidden";
  if (isApiError(error)) {
    if (error.status === 403) return "forbidden";
    const code = error.code ?? "";
    if (STALE_CODES.has(code)) return "stale";
    if (code === "FLEET_MASTER_NOT_CP31_VALID") return "invalid";
    if (NOT_ALLOWED_CODES.has(code)) return "notAllowed";
  }
  return "generic";
}

export function isForbiddenError(error: unknown): boolean {
  if (isAxiosError(error)) return error.response?.status === 403;
  return isApiError(error) && error.status === 403;
}
