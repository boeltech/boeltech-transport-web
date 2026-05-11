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
  };
}
