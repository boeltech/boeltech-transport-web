/**
 * Orden de viaje operativa.
 * GET /trips/:tripId/trip-order · POST …/trip-order:generate · GET …/trip-order/file
 * Documento operativo — NO es CFDI ni Carta Porte 3.1.
 */
import { apiClient, deepToCamel } from "@shared/api";
import type {
  GenerateTripOrderResult,
  TripOrderEmission,
  TripOrderStatus,
} from "@features/trips/domain";

const tripOrderEndpoint = (tripId: string) => `/trips/${tripId}/trip-order`;

type Envelope = { data: unknown; message?: string };

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/** Parsea `Content-Disposition` (filename* UTF-8 o filename="…"). */
export function parseTripOrderContentDispositionFileName(
  header: string | undefined | null,
): string | null {
  if (!header) return null;
  const utf8 = /filename\*=(?:UTF-8''|utf-8'')([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    const encoded = utf8[1].trim().replace(/^"|"$/g, "");
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(header);
  if (quoted?.[1]) return quoted[1];
  const plain = /filename=([^;]+)/i.exec(header);
  return plain?.[1]?.trim().replace(/^"|"$/g, "") ?? null;
}

export function mapTripOrderStatus(raw: unknown): TripOrderStatus {
  return deepToCamel(raw) as TripOrderStatus;
}

export function mapTripOrderEmission(raw: unknown): TripOrderEmission {
  return deepToCamel(raw) as TripOrderEmission;
}

export function mapGenerateTripOrderResult(
  envelope: Envelope,
): GenerateTripOrderResult {
  return {
    emission: mapTripOrderEmission(envelope.data),
    message: envelope.message ?? "",
  };
}

export const tripOrderApi = {
  async getStatus(tripId: string): Promise<TripOrderStatus> {
    const response = await apiClient.get<Envelope>(tripOrderEndpoint(tripId));
    return mapTripOrderStatus(response.data);
  },

  async generate(tripId: string): Promise<GenerateTripOrderResult> {
    const response = await apiClient.post<Envelope>(
      `${tripOrderEndpoint(tripId)}:generate`,
      {},
    );
    return mapGenerateTripOrderResult(response);
  },

  /**
   * Descarga el PDF de la emisión vigente.
   * Preferir filename del header; fallback al de la emisión (GET status).
   */
  async downloadFile(tripId: string, fallbackFileName?: string): Promise<void> {
    const axios = apiClient.getAxiosInstance();
    const response = await axios.get<Blob>(`${tripOrderEndpoint(tripId)}/file`, {
      responseType: "blob",
    });
    const header =
      response.headers["content-disposition"] ??
      response.headers["Content-Disposition"];
    const fileName =
      parseTripOrderContentDispositionFileName(
        typeof header === "string" ? header : undefined,
      ) ??
      fallbackFileName ??
      "orden-viaje.pdf";
    triggerBlobDownload(
      new Blob([response.data], { type: "application/pdf" }),
      fileName,
    );
  },
};
