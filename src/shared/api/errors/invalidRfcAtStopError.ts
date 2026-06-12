import { isApiError } from "@shared/api/interceptors/error-handler";

export type InvalidRfcAtStopDetails = {
  stopId: string | null;
  currentRfc: string | null;
  stopOrder: number | null;
};

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parseInvalidRfcAtStopDetails(
  error: unknown,
): InvalidRfcAtStopDetails | null {
  if (!isApiError(error) || error.code !== "INVALID_RFC_AT_STOP") {
    return null;
  }

  const details = error.details;
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return { stopId: null, currentRfc: null, stopOrder: null };
  }

  const record = details as Record<string, unknown>;
  return {
    stopId: readString(record.stopId),
    currentRfc: readString(record.currentRfc),
    stopOrder: readNumber(record.stopOrder),
  };
}
