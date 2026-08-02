/**
 * Hook para mostrar la etiqueta de un código de régimen fiscal SAT (c_RegimenFiscal).
 * Usa el mismo catálogo que RegimenFiscalSelect (sat_regimen_fiscal).
 */

import { useMemo } from "react";

import { CatalogTypeCode, type CatalogTypeCodeValue } from "../../domain";
import { useCatalogOptions } from "./useCatalogSearch";

export interface UseRegimenFiscalLabelResult {
  /**
   * - `code-name` (default): "código - nombre" (facturación)
   * - `name`: solo nombre humano (detalle operativo de cliente)
   * Si no hay match: el código; sin código → null
   */
  label: string | null;
  isLoading: boolean;
  isError: boolean;
}

export function useRegimenFiscalLabel(
  code: string | null | undefined,
  options?: {
    enabled?: boolean;
    format?: "name" | "code-name";
  },
): UseRegimenFiscalLabelResult {
  const trimmed = code?.trim() ?? "";
  const enabled = options?.enabled ?? true;
  const format = options?.format ?? "code-name";

  const { data: catalogOptions, isLoading, isError } = useCatalogOptions(
    CatalogTypeCode.SAT_REGIMEN_FISCAL as CatalogTypeCodeValue,
    { enabled: enabled && !!trimmed },
  );

  const label = useMemo(() => {
    if (!trimmed) return null;
    const item = catalogOptions?.find((o) => o.code === trimmed);
    if (!item) return trimmed;
    if (format === "name") return item.name?.trim() || trimmed;
    return `${item.code} - ${item.name}`;
  }, [trimmed, catalogOptions, format]);

  return { label, isLoading, isError };
}
