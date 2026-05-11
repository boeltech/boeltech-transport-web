/**
 * Hidrata banderas regulatorias (Carta Porte / sector) desde el catálogo SAT vía REST.
 * ADR-0043 WS-A3 — misma interfaz `CatalogProvider` que el dominio compartido.
 */
import type { CargoRegulatoryFlags } from "@boeltech/cfdi-domain";
import { extractCargoRegulatoryFlags } from "@boeltech/cfdi-domain";

import { createCatalogProviderRest } from "./catalogProviderRest";

/** Código de tipo en `catalog_types` (alineado con `ProductoServicioCPSearch`). */
export const SAT_CLAVE_PROD_SERV_CP_CATALOG_TYPE = "sat_clave_prod_serv_cp";

const catalog = createCatalogProviderRest();

export async function fetchRegulatoryFlagsForSatProductCp(
  productCode: string,
): Promise<CargoRegulatoryFlags> {
  const code = productCode.trim();
  if (!code) {
    return extractCargoRegulatoryFlags(null);
  }
  const item = await catalog.getCatalogItem(
    SAT_CLAVE_PROD_SERV_CP_CATALOG_TYPE,
    code,
  );
  const meta =
    item?.metadata && typeof item.metadata === "object"
      ? (item.metadata as Record<string, unknown>)
      : null;
  return extractCargoRegulatoryFlags(meta);
}
