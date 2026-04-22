/**
 * Hook para mostrar la etiqueta de un código de régimen fiscal SAT (c_RegimenFiscal).
 * Usa el mismo catálogo que RegimenFiscalSelect (sat_regimen_fiscal).
 */

import { useMemo } from "react";

import { CatalogTypeCode, type CatalogTypeCodeValue } from "../../domain";
import { useCatalogOptions } from "./useCatalogSearch";

export interface UseRegimenFiscalLabelResult {
  /** Texto "código - nombre" si existe en catálogo; si no, el código; sin código → null */
  label: string | null;
  isLoading: boolean;
  isError: boolean;
}

export function useRegimenFiscalLabel(
  code: string | null | undefined,
): UseRegimenFiscalLabelResult {
  const trimmed = code?.trim() ?? "";

  const { data: options, isLoading, isError } = useCatalogOptions(
    CatalogTypeCode.SAT_REGIMEN_FISCAL as CatalogTypeCodeValue,
  );

  const label = useMemo(() => {
    if (!trimmed) return null;
    const item = options?.find((o) => o.code === trimmed);
    if (item) return `${item.code} - ${item.name}`;
    return trimmed;
  }, [trimmed, options]);

  return { label, isLoading, isError };
}
