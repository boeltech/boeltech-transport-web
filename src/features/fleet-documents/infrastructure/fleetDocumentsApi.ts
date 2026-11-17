/**
 * Fleet documents API — GET /fleet/document-expiries
 */

import {
  apiClient,
  type ApiPaginatedResponse,
  type MappedPaginatedResult,
} from "@shared/api";
import type {
  DocumentExpiryItem,
  DocumentExpiryQueryParams,
  DocumentExpirySummary,
} from "../domain";
import {
  mapDocumentExpiryList,
  type ApiDocumentExpiryItem,
} from "./mappers";

const ENDPOINT = "/fleet/document-expiries";

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export const fleetDocumentsApi = {
  list: async (
    params?: DocumentExpiryQueryParams,
  ): Promise<MappedPaginatedResult<DocumentExpiryItem>> => {
    const searchParams = new URLSearchParams();

    if (params?.page != null) {
      searchParams.set("page", String(params.page));
    }
    if (params?.limit != null) {
      searchParams.set("limit", String(params.limit));
    }
    if (params?.withinDays != null) {
      searchParams.set("within_days", String(params.withinDays));
    }
    if (params?.docType) {
      searchParams.set("doc_type", params.docType);
    }
    if (params?.status) {
      searchParams.set("status", params.status);
    }

    const qs = searchParams.toString();
    const url = qs ? `${ENDPOINT}?${qs}` : ENDPOINT;
    const response = await apiClient.get(url);

    return mapDocumentExpiryList(
      response as unknown as ApiPaginatedResponse<ApiDocumentExpiryItem>,
    );
  },

  getSummary: async (): Promise<DocumentExpirySummary> => {
    const response = await apiClient.get(`${ENDPOINT}/summary`);
    const raw = (response as { data?: Record<string, unknown> }).data ?? {};
    const byType = (raw.by_type ?? {}) as Record<string, unknown>;
    return {
      withinDays: asNumber(raw.within_days) || 30,
      total: asNumber(raw.total),
      expired: asNumber(raw.expired),
      byType: {
        license: asNumber(byType.license),
        medicalCertificate: asNumber(byType.medical_certificate),
        insurance: asNumber(byType.insurance),
        sctPermit: asNumber(byType.sct_permit),
      },
    };
  },
};
