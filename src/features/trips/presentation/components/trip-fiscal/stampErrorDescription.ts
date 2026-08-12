import {
  getErrorMessage,
  isApiError,
  type ApiError,
} from "@shared/api/interceptors/error-handler";
import { tripFiscalCopy } from "../../copy/tripFiscalCopy";

type Cp31Detail = {
  code?: string;
  path?: string;
  message?: string;
};

const VEHICLE_PRESTAMP_CODES = new Set([
  "CP31_VEHICLE_INCOMPLETE",
  "CP31_VEHICLE_PLATE_PRESTAMP_FAILED",
  "CP31_REMOLQUES_REQUIRED",
]);

const VEHICLE_DETAIL_CODES = new Set([
  "CP31_VEHICLE_INCOMPLETE",
  "CP31_VEHICLE_NOT_FOUND",
  "CP31_VEHICLE_PLATE_INVALID",
  "CP31_REMOLQUE_PLATE_INVALID",
  "CP31_REMOLQUES_REQUIRED",
]);

function formatCp31Path(path: string): string {
  const tripStop =
    /^trip\.([^.\s]+)\.stop\.(\d+)\.distance_from_previous_km$/.exec(path);
  if (tripStop) {
    return `Viaje ${tripStop[1]} · parada ${tripStop[2]}: distancia previa`;
  }
  const tripTotal = /^trip\.([^.\s]+)\.total_dist_rec$/.exec(path);
  if (tripTotal) {
    return `Viaje ${tripTotal[1]}: distancia total`;
  }
  const tripDistance = /^trip\.([^.\s]+)\.distancia_recorrida$/.exec(path);
  if (tripDistance) {
    return `Viaje ${tripDistance[1]}: distancia recorrida`;
  }
  const cargoWeight = /^cargo\.(\d+)\.weight_in_kg$/.exec(path);
  if (cargoWeight) {
    return `Carga ${Number(cargoWeight[1]) + 1}: peso (kg)`;
  }
  const cargoUnits = /^cargo\.(\d+)\.units$/.exec(path);
  if (cargoUnits) {
    return `Carga ${Number(cargoUnits[1]) + 1}: unidades`;
  }
  return path.replaceAll(".", " > ");
}

function readCp31Details(error: ApiError): Cp31Detail[] {
  const raw = error.details;
  if (Array.isArray(raw)) return raw as Cp31Detail[];
  if (Array.isArray(raw?.issues)) return raw.issues as Cp31Detail[];
  return [];
}

function firstVehicleDetailMessage(error: ApiError): string | undefined {
  const fromDetails = readCp31Details(error).find(
    (d) =>
      typeof d.code === "string" &&
      VEHICLE_DETAIL_CODES.has(d.code) &&
      typeof d.message === "string" &&
      d.message.trim().length > 0,
  )?.message?.trim();
  if (fromDetails) return fromDetails;

  return error.validationErrors
    .map((entry) => entry.message.trim())
    .find((message) => message.length > 0);
}

function isVehiclePrestampError(error: ApiError): boolean {
  if (error.code && VEHICLE_PRESTAMP_CODES.has(error.code)) return true;
  return readCp31Details(error).some(
    (d) => typeof d.code === "string" && VEHICLE_DETAIL_CODES.has(d.code),
  );
}

/**
 * Mensaje de toast/UI para errores de `POST .../stamp`.
 * Vehículo incompleto / placas / remolques → apunta al catálogo de vehículos.
 */
export function describeStampApiError(error: unknown): string {
  if (!isApiError(error)) {
    return getErrorMessage(error);
  }

  if (
    error.code === "STAMP_QUOTA_EXCEEDED" ||
    error.code === "TRIAL_ENDED" ||
    error.code === "SUBSCRIPTION_INACTIVE"
  ) {
    return error.message;
  }

  if (error.code === "CP31_INVALID_NUMERIC_DATA") {
    const details = readCp31Details(error);
    const invalids = details
      .filter(
        (d) =>
          d.code === "CP31_INVALID_NUMERIC_DATA" && typeof d.path === "string",
      )
      .map((d) => `• ${formatCp31Path(d.path!)}`);
    if (invalids.length === 0) {
      return error.message;
    }
    const preview = invalids.slice(0, 4);
    const more = invalids.length - preview.length;
    return [
      "Se detectaron valores numéricos inválidos en Carta Porte:",
      ...preview,
      ...(more > 0 ? [`• ...y ${more} campo(s) más`] : []),
    ].join("\n");
  }

  if (isVehiclePrestampError(error)) {
    return tripFiscalCopy.stamp.vehicleIncompleteDescription(
      firstVehicleDetailMessage(error) ?? error.message,
    );
  }

  const detailMessages = error.validationErrors
    .map((entry) => entry.message.trim())
    .filter((message) => message.length > 0);

  if (detailMessages.length === 1) {
    return detailMessages[0]!;
  }

  if (detailMessages.length > 1) {
    const preview = detailMessages.slice(0, 4).map((message) => `• ${message}`);
    const more = detailMessages.length - preview.length;
    return [
      error.message,
      ...preview,
      ...(more > 0 ? [`• ...y ${more} problema(s) más`] : []),
    ].join("\n");
  }

  // Defensa: si el mensaje quedó genérico pero el PAC envió hint (p. ej. CFDI40147).
  const hint =
    typeof error.details?.hint === "string" ? error.details.hint.trim() : "";
  if (
    hint &&
    error.code === "PAC_VALIDATION_ERROR" &&
    (error.message ===
      "El PAC rechazó el CFDI por validación fiscal/XSD." ||
      !error.message.includes(hint))
  ) {
    return error.message ===
      "El PAC rechazó el CFDI por validación fiscal/XSD."
      ? hint
      : `${error.message} ${hint}`;
  }

  return error.message || getErrorMessage(error);
}
