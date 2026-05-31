/**
 * Validación previa al envío de payloads de viaje contra los esquemas Zod
 * compartidos con la API (`@boeltech/cfdi-domain/validadores/trips`).
 *
 * ## Flujo en el wizard (`TripFormPage`)
 *
 * 1. `buildCreateTripInputFromWizardValues` / `buildUpdateTripInputFromWizardValues`
 *    (`wizardToCreateTripInput.ts`, `wizardToUpdateTripInput.ts`) arman `CreateTripInput` /
 *    `UpdateTripInput` desde `TripWizardFormValues`.
 * 2. Este módulo valida ese objeto **antes** de `tripRepository.create` / `update`
 *    (el cliente HTTP serializa camelCase → snake_case con `deepToSnake` aquí para
 *    coincidir con lo que parsea el schema del paquete).
 *
 * ## Matriz: viaje (`CreateTripInput` ← wizard)
 *
 * | Campo API (CreateTripInput) | Origen en el wizard |
 * |----------------------------|----------------------|
 * | `vehicleId`, `driverId`, `clientId` | Paso 1 — `TripWizardFormValues` |
 * | `cfdiDocumentIntent` | Paso 1 — default `ingreso` si falta |
 * | `scheduledDeparture`, `scheduledArrival` | Paso 1 — `localInputToUtcIso` |
 * | `startMileage` | Paso 1 |
 * | `originCity`, `originState` | Derivado de la parada **origen**: `buildTripEndpointSummary` en `wizardStopPayload.ts` |
 * | `destinationCity`, `destinationState` | Derivado de la parada **destino**: mismo helper |
 * | `cargoDescription` | Primer elemento de `cargos[].description` |
 * | `cargoWeight`, `cargoValue` | Sumas sobre `cargos` |
 * | `numTotalMercancias`, `pesoBrutoTotal`, `unidadPeso` | `buildMercanciasHeaderSummary` (`wizardCargoPayload.ts` → `cfdi-domain`) |
 * | `baseRate`, `notes` | Pasos costos / resumen |
 * | `internalStaff` | `internalStaff[]` — cada ítem: `employeeId`, `internalRole: "helper"`, pago |
 * | `stops` | `mapWizardStopsToCreateInput` — tabla siguiente |
 * | `cargos` | `mapWizardCargosToCreateInput` — delegado en `cfdi-domain` |
 * | `estimatedExpenses` | `expenses[]` mapeados a gastos estimados |
 *
 * **No** los rellena el builder actual (revisar si el contrato API los exige en algún flujo):
 * `CreateTripInput.options`, `cargoVolume`, `cargoUnits`.
 *
 * ## Matriz: paradas (`CreateStopInput` ← cada `TripStopFormValues`)
 *
 * Construcción en `mapWizardStopsToCreateInput` (`wizardStopPayload.ts`). Resumen:
 *
 * | Campo | Origen |
 * |-------|--------|
 * | `sequenceOrder`, `stopType` | Parada |
 * | `addressId` | Solo si `stopHasUnifiedAddressId` (UUID catálogo unificado) |
 * | `address`, `city`, `state` | `buildTripEndpointSummary` (texto operativo / resumen de ruta) |
 * | `postalCode`, `locationName` | Parada |
 * | `satCountryCode`, `satStateCode`, `satMunicipalityCode`, `satLocalityCode`, `satNeighborhoodCode` | Parada (SAT) |
 * | `colonia` | `neighborhoodName` del wizard |
 * | `street`, `exteriorNumber`, `interiorNumber`, `reference` | Parada |
 * | `rfcRemitenteDestinatario`, `nombreRemitenteDestinatario` | Parada (persistencia fiscal en dirección vía API) |
 * | `deliveryRfcRemitenteDestinatario`, `deliveryNombreRemitenteDestinatario` | Parada (override en `trip_stops`) |
 * | `remitentePartnerId`, `destinatarioPartnerId` | Parada |
 * | `distanceFromPreviousKm`, `distanceSource`, `distanceProvider`, `distanceConfidence`, `distanceComputedAt` | Parada |
 * | `latitude`, `longitude` | Parada |
 * | `estimatedArrival` | Parada → ISO UTC vía `localInputToUtcIso` |
 * | `contactName`, `contactPhone`, `notes` | Parada |
 * | `clientId`, `clientAddressId` | Parada |
 *
 * `idUbicacion` es opcional en el contrato; el mapper del wizard no lo envía hoy.
 *
 * ## `UpdateTripInput`
 *
 * `buildUpdateTripInputFromWizardValues` copia los mismos campos de negocio que create
 * (mismos builders de paradas/cargos/gastos). Campos solo-update (p. ej. `totalDistRec`)
 * no los setea el wizard; el backend puede seguir siendo la fuente de verdad.
 *
 * @see `wizardToCreateTripInput.ts` — ensamblado del body de alta
 * @see `wizardToUpdateTripInput.ts` — ensamblado del body de edición
 * @see `wizardStopPayload.ts` — paradas y resumen de extremos
 * @see `wizardCargoPayload.ts` — mercancías y encabezado CP
 * @see ADR-0043 — esquemas en `@boeltech/cfdi-domain/validadores/trips`
 */

import type {
  CreateTripInput,
  UpdateTripInput,
  UpdateTripStatusInput,
} from "@features/trips/domain";
import {
  createTripSchema,
  formatZodError,
  tripQuerySchema,
  updateTripSchema,
  updateTripStatusSchema,
} from "@boeltech/cfdi-domain/validadores/trips";
import { deepToSnake } from "@shared/api/utils/case-transformer";

export type TripApiPayloadValidation =
  | { ok: true }
  | { ok: false; fieldErrors: Record<string, string> };

function parseSchemaResult(
  result:
    | { success: true }
    | { success: false; error: Parameters<typeof formatZodError>[0] },
): TripApiPayloadValidation {
  if (result.success) return { ok: true };
  return { ok: false, fieldErrors: formatZodError(result.error) };
}

/**
 * Valida el mismo cuerpo que enviará `apiClient` (camelCase → snake_case)
 * contra los esquemas compartidos del backend.
 */
export function validateCreateTripApiPayload(
  input: CreateTripInput,
): TripApiPayloadValidation {
  return parseSchemaResult(createTripSchema.safeParse(deepToSnake(input)));
}

export function validateUpdateTripApiPayload(
  input: UpdateTripInput,
): TripApiPayloadValidation {
  return parseSchemaResult(updateTripSchema.safeParse(deepToSnake(input)));
}

export function validateUpdateTripStatusApiPayload(
  input: UpdateTripStatusInput,
): TripApiPayloadValidation {
  return parseSchemaResult(updateTripStatusSchema.safeParse(deepToSnake(input)));
}

export function validateTripQueryApiPayload(
  query: Record<string, unknown>,
): TripApiPayloadValidation {
  return parseSchemaResult(tripQuerySchema.safeParse(query));
}

function snakeSegmentToCamel(segment: string): string {
  if (/^\d+$/.test(segment)) return segment;
  return segment.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/** Convierte paths de error del payload API (snake) a paths de formulario (camel). */
export function apiValidationPathToFormPath(path: string): (string | number)[] {
  return path.split(".").map((part) => {
    if (/^\d+$/.test(part)) return Number(part);
    return snakeSegmentToCamel(part);
  });
}

/** Texto breve para toast (rutas snake_case alineadas con el API). */
export function summarizeTripApiPayloadErrors(
  fieldErrors: Record<string, string>,
  maxLines = 3,
): string {
  const lines = Object.entries(fieldErrors).map(([path, msg]) =>
    path ? `${path}: ${msg}` : msg,
  );
  if (lines.length === 0) return "Revisa los datos del viaje.";
  return lines.slice(0, maxLines).join(" · ");
}

/**
 * Mensajes de validación API en lenguaje no técnico (edición contextual y toasts).
 * Si no reconoce rutas concretas, delega en `summarizeTripApiPayloadErrors`.
 */
export function formatTripApiValidationForUser(
  fieldErrors: Record<string, string>,
  maxLines = 4,
): string {
  const keys = Object.keys(fieldErrors);
  if (keys.length === 0) return "Revisa los datos del viaje.";

  const bullets: string[] = [];
  const add = (text: string) => {
    if (!bullets.includes(text)) bullets.push(text);
  };

  for (const path of keys) {
    if (/internal_staff\.\d+\.internal_role/i.test(path)) {
      add(
        "El personal de apoyo tiene un rol que no coincide con el formato actual. Corrígelo en edición completa.",
      );
    } else if (/internal_staff/i.test(path)) {
      add("Revisa el personal de apoyo del viaje en edición completa.");
    } else if (/stops\.\d+\.city/i.test(path)) {
      add(
        "Una parada no tiene ciudad válida (mínimo 2 caracteres). Completa la dirección en edición completa.",
      );
    } else if (/^stops\.\d+\./i.test(path)) {
      add("Hay datos de una parada que no cumplen el formato. Revisa la ruta en edición completa.");
    }
  }

  if (bullets.length === 0) {
    return `No se puede guardar: ${summarizeTripApiPayloadErrors(fieldErrors, maxLines)}`;
  }
  return bullets.slice(0, maxLines).join(" ");
}
