import { useMemo } from "react";
import {
  CatalogTypeCode,
  useCatalogOptions,
  type CatalogOption,
} from "@features/catalogs";

/**
 * Resuelve código de catálogo → nombre humano.
 * Nunca expone el código en UI (D6 handoff detalle cliente).
 */
export function resolveAddressCatalogLabel(
  options: readonly CatalogOption[] | undefined,
  code: string | null | undefined,
): string | null {
  const trimmed = code?.trim();
  if (!trimmed) return null;
  const match = options?.find((option) => option.code === trimmed);
  const name = match?.name?.trim();
  return name || null;
}

/** Resuelve estado/municipio SAT → nombre humano para lectura en detalle. */
export function useClientAddressLocationLabels(input: {
  satStateCode?: string | null;
  satMunicipalityCode?: string | null;
}) {
  const stateCode = input.satStateCode?.trim() ?? "";
  const municipalityCode = input.satMunicipalityCode?.trim() ?? "";

  const states = useCatalogOptions(CatalogTypeCode.SAT_ESTADO);
  const municipalities = useCatalogOptions(CatalogTypeCode.SAT_MUNICIPIO, {
    parentCode: stateCode || undefined,
    enabled: Boolean(stateCode),
  });

  return useMemo(
    () => ({
      isLoading:
        states.isLoading ||
        (Boolean(stateCode) && municipalities.isLoading),
      stateLabel: resolveAddressCatalogLabel(states.data, stateCode),
      municipalityLabel: resolveAddressCatalogLabel(
        municipalities.data,
        municipalityCode,
      ),
    }),
    [
      states.isLoading,
      states.data,
      municipalities.isLoading,
      municipalities.data,
      stateCode,
      municipalityCode,
    ],
  );
}
