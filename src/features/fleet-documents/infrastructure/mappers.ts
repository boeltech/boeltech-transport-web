/**
 * Fleet document expiries — API (snake_case) → domain (camelCase).
 */

import type {
  ApiPaginatedResponse,
  MappedPaginatedResult,
} from "@shared/api";
import type {
  DocumentExpiryDocTypeValue,
  DocumentExpiryEntityTypeValue,
  DocumentExpiryItem,
  DocumentExpirySeverityValue,
} from "../domain";

export interface ApiDocumentExpiryItem {
  entity_type: string;
  entity_id: string;
  entity_label: string;
  doc_type: string;
  expires_on: string | null;
  days_remaining: number | null;
  severity: string;
}

export function mapDocumentExpiryItem(
  raw: ApiDocumentExpiryItem,
): DocumentExpiryItem {
  return {
    entityType: raw.entity_type as DocumentExpiryEntityTypeValue,
    entityId: raw.entity_id,
    entityLabel: raw.entity_label,
    docType: raw.doc_type as DocumentExpiryDocTypeValue,
    expiresOn: raw.expires_on,
    daysRemaining: raw.days_remaining,
    severity: raw.severity as DocumentExpirySeverityValue,
  };
}

export function mapDocumentExpiryList(
  response: ApiPaginatedResponse<ApiDocumentExpiryItem>,
): MappedPaginatedResult<DocumentExpiryItem> {
  return {
    data: response.data.map(mapDocumentExpiryItem),
    pagination: {
      page: response.pagination.page,
      limit: response.pagination.limit,
      total: response.pagination.total,
      totalPages: response.pagination.total_pages,
    },
  };
}
