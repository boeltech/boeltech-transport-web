import { useMemo } from "react";
import { CatalogTypeCode, useCatalogOptions } from "@features/catalogs";
import { resolveTrailerTypeLabel } from "./resolveTrailerTypeLabel";

export function useTrailerTypeLabels() {
  const query = useCatalogOptions(CatalogTypeCode.SAT_SUB_TIPO_REM);

  return useMemo(
    () => ({
      isLoading: query.isLoading,
      labelFor: (code: string | null | undefined) =>
        resolveTrailerTypeLabel(query.data, code),
    }),
    [query.data, query.isLoading],
  );
}
