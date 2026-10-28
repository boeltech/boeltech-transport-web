import { isApiError } from "@shared/api/interceptors/error-handler";

export type InvalidRfcAtStopResolution =
  | "identified"
  | "ambiguous"
  | "unknown";

export type InvalidRfcAtStopCandidate = {
  stopId: string;
  stopOrder: number;
  tipoUbicacion: "Origen" | "Destino" | null;
  currentRfc: string | null;
};

export type InvalidRfcAtStopDetails = {
  stopId: string | null;
  currentRfc: string | null;
  stopOrder: number | null;
  resolution: InvalidRfcAtStopResolution | null;
  candidateStops: InvalidRfcAtStopCandidate[];
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

function readResolution(value: unknown): InvalidRfcAtStopResolution | null {
  if (value === "identified" || value === "ambiguous" || value === "unknown") {
    return value;
  }
  return null;
}

function readTipoUbicacion(value: unknown): "Origen" | "Destino" | null {
  if (value === "Origen" || value === "Destino") return value;
  return null;
}

function parseCandidate(raw: unknown): InvalidRfcAtStopCandidate | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const stopId = readString(record.stop_id) ?? readString(record.stopId);
  if (!stopId) return null;
  const stopOrder =
    readNumber(record.stop_order) ?? readNumber(record.stopOrder);
  return {
    stopId,
    stopOrder: stopOrder ?? 0,
    tipoUbicacion:
      readTipoUbicacion(record.tipo_ubicacion) ??
      readTipoUbicacion(record.tipoUbicacion),
    currentRfc:
      readString(record.current_rfc) ?? readString(record.currentRfc),
  };
}

function parseCandidateStops(value: unknown): InvalidRfcAtStopCandidate[] {
  if (!Array.isArray(value)) return [];
  const out: InvalidRfcAtStopCandidate[] = [];
  for (const entry of value) {
    const candidate = parseCandidate(entry);
    if (candidate) out.push(candidate);
  }
  return out;
}

export function parseInvalidRfcAtStopDetails(
  error: unknown,
): InvalidRfcAtStopDetails | null {
  if (!isApiError(error) || error.code !== "INVALID_RFC_AT_STOP") {
    return null;
  }

  const details = error.details;
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {
      stopId: null,
      currentRfc: null,
      stopOrder: null,
      resolution: null,
      candidateStops: [],
    };
  }

  const record = details as Record<string, unknown>;
  const candidateStops = parseCandidateStops(
    record.candidate_stops ?? record.candidateStops,
  );

  return {
    stopId: readString(record.stopId) ?? readString(record.stop_id),
    currentRfc: readString(record.currentRfc) ?? readString(record.current_rfc),
    stopOrder: readNumber(record.stopOrder) ?? readNumber(record.stop_order),
    resolution: readResolution(record.resolution),
    candidateStops,
  };
}
