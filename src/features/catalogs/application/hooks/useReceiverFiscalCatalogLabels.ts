import { useCallback } from "react";
import { CatalogTypeCode, type CatalogOption } from "../../domain";
import { useCatalogOptions } from "./useCatalogSearch";

export type ReceiverFiscalCatalogLabels = {
  /** «616 · Sin obligaciones fiscales»; solo el código si el catálogo no cargó. */
  taxRegimeLabel: (code: string | null | undefined) => string;
  /** «S01 · Sin efectos fiscales»; solo el código si el catálogo no cargó. */
  cfdiUsageLabel: (code: string | null | undefined) => string;
};

function codeNameLabel(
  options: readonly CatalogOption[] | undefined,
  code: string | null | undefined,
): string {
  const trimmed = code?.trim() ?? "";
  if (!trimmed) return "";
  const name = options?.find((option) => option.code === trimmed)?.name?.trim();
  return name ? `${trimmed} · ${name}` : trimmed;
}

/** Etiquetas «código · nombre» de régimen fiscal y uso CFDI del receptor (catálogos SAT). */
export function useReceiverFiscalCatalogLabels(
  enabled = true,
): ReceiverFiscalCatalogLabels {
  const regimen = useCatalogOptions(CatalogTypeCode.SAT_REGIMEN_FISCAL, {
    enabled,
  });
  const usoCfdi = useCatalogOptions(CatalogTypeCode.SAT_USO_CFDI, { enabled });

  const taxRegimeLabel = useCallback(
    (code: string | null | undefined) => codeNameLabel(regimen.data, code),
    [regimen.data],
  );
  const cfdiUsageLabel = useCallback(
    (code: string | null | undefined) => codeNameLabel(usoCfdi.data, code),
    [usoCfdi.data],
  );

  return { taxRegimeLabel, cfdiUsageLabel };
}
