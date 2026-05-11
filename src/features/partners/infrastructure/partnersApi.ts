/**
 * API de partners — contrato esperado:
 * GET /partners?search=&page=&limit=
 * POST /partners { legalName, taxId }
 */

import { apiClient } from "@shared/api/client/apiClient";
import {
  mapPaginatedResponse,
  mapSingleResponse,
} from "@shared/api/mappers/response-mapper";
import type {
  ApiPaginatedResponse,
  ApiSingleResponse,
} from "@shared/api/types/api-response.types";

import type { Partner } from "../domain/entities";

interface ApiPartnerRow {
  id: string;
  legal_name: string;
  tax_id: string;
}

export async function searchPartners(search: string): Promise<Partner[]> {
  const q = search.trim();
  if (q.length < 2) return [];

  try {
    const raw = await apiClient.get<ApiPaginatedResponse<ApiPartnerRow>>(
      `/partners`,
      {
        params: { search: q, limit: 25, page: 1 },
      },
    );
    const { data } = mapPaginatedResponse(raw);
    return data as unknown as Partner[];
  } catch {
    return [];
  }
}

export async function createPartner(input: {
  legalName: string;
  taxId: string;
}): Promise<Partner> {
  const raw = await apiClient.post<ApiSingleResponse<ApiPartnerRow>>(
    `/partners`,
    input,
  );
  const { data } = mapSingleResponse(raw);
  return data as unknown as Partner;
}
