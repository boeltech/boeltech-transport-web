/**
 * Hook para mostrar la etiqueta de un código de método de pago SAT (c_MetodoPago).
 * Usa el mismo catálogo que MetodoPagoSelect (sat_metodo_pago).
 */

import { useMemo } from "react";

import { CatalogTypeCode, type CatalogTypeCodeValue } from "../../domain";
import { useCatalogOptions } from "./useCatalogSearch";

export interface UseMetodoPagoLabelResult {
  /** Texto "código - nombre" si existe en catálogo; si no, el código; sin código → null */
  label: string | null;
  isLoading: boolean;
  isError: boolean;
}

export function useMetodoPagoLabel(
  code: string | null | undefined,
  options?: { enabled?: boolean },
): UseMetodoPagoLabelResult {
  const trimmed = code?.trim() ?? "";
  const enabled = options?.enabled ?? true;

  const { data: catalogOptions, isLoading, isError } = useCatalogOptions(
    CatalogTypeCode.SAT_METODO_PAGO as CatalogTypeCodeValue,
    { enabled: enabled && !!trimmed },
  );

  const label = useMemo(() => {
    if (!trimmed) return null;
    const item = catalogOptions?.find((o) => o.code === trimmed);
    if (item) return `${item.code} - ${item.name}`;
    return trimmed;
  }, [trimmed, catalogOptions]);

  return { label, isLoading, isError };
}
