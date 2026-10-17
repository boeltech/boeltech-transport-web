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
} from "../domain";
import {
  mapDocumentExpiryList,
  type ApiDocumentExpiryItem,
} from "./mappers";

const ENDPOINT = "/fleet/document-expiries";

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
};
