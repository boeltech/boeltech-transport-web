/**
 * Implementación REST de `CatalogProvider` contra GET /api/v1/catalogs/:type/:code.
 * ADR-0043 WS-A3 — consumo alineado con el contrato del paquete compartido.
 */
import type {
  CatalogItem,
  CatalogProvider,
} from "@boeltech/cfdi-domain";

import { apiClient } from "@shared/api/client/apiClient";
import { isAxiosError } from "axios";

type CatalogSingleResponse = {
  data: {
    code: string;
    name: string;
    metadata?: Record<string, unknown> | null;
  };
};

type PostalLookupResponse = {
  data: {
    postal_code: string;
    state_code?: string | null;
    municipality_code?: string | null;
    localities?: Array<{ code: string; name: string }>;
    neighborhoods?: Array<{ code: string; name: string }>;
  };
};

export function createCatalogProviderRest(): CatalogProvider {
  return {
    async getCatalogItem(
      catalogTypeCode: string,
      itemCode: string,
    ): Promise<CatalogItem | null> {
      const type = encodeURIComponent(catalogTypeCode);
      const code = encodeURIComponent(itemCode);
      try {
        const res = await apiClient.get<CatalogSingleResponse>(
          `/catalogs/${type}/${code}`,
        );
        const row = res.data;
        if (!row?.code) return null;
        return {
          code: row.code,
          name: row.name,
          metadata: row.metadata ?? null,
        };
      } catch (e) {
        if (isAxiosError(e) && e.response?.status === 404) {
          return null;
        }
        throw e;
      }
    },
    async getPostalCodeLookup(postalCode: string) {
      const cp = encodeURIComponent(postalCode);
      try {
        const res = await apiClient.get<PostalLookupResponse>(
          `/catalogs/sat/by-postal-code/${cp}`,
        );
        const row = res.data;
        return {
          postal_code: row.postal_code,
          found: true,
          state_code: row.state_code ?? null,
          municipality_code: row.municipality_code ?? null,
          localities: row.localities ?? [],
          neighborhoods: row.neighborhoods ?? [],
        };
      } catch (e) {
        if (isAxiosError(e) && e.response?.status === 404) {
          return {
            postal_code: postalCode,
            found: false,
            state_code: null,
            municipality_code: null,
            localities: [],
            neighborhoods: [],
          };
        }
        throw e;
      }
    },
  };
}
