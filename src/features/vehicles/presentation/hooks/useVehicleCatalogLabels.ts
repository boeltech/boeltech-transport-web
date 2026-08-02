import { useMemo } from "react";
import {
  CatalogTypeCode,
  useCatalogOptions,
  type CatalogOption,
} from "@features/catalogs";

/**
 * Resuelve código de catálogo → nombre humano.
 * Nunca expone el código en UI (D5 handoff detalle vehículo).
 */
export function resolveCatalogOptionLabel(
  options: readonly CatalogOption[] | undefined,
  code: string | null | undefined,
): string | null {
  const trimmed = code?.trim();
  if (!trimmed) return null;
  const match = options?.find((option) => option.code === trimmed);
  const name = match?.name?.trim();
  return name ? name : null;
}

export function useVehicleCatalogLabels() {
  const tipoPermiso = useCatalogOptions(CatalogTypeCode.SAT_TIPO_PERMISO);
  const configVehicular = useCatalogOptions(
    CatalogTypeCode.SAT_CONFIG_AUTOTRANSPORTE,
  );
  const subTipoRem = useCatalogOptions(CatalogTypeCode.SAT_SUB_TIPO_REM);

  const isLoading =
    tipoPermiso.isLoading || configVehicular.isLoading || subTipoRem.isLoading;

  return useMemo(
    () => ({
      isLoading,
      tipoPermisoLabel: (code: string | null | undefined) =>
        resolveCatalogOptionLabel(tipoPermiso.data, code),
      configVehicularLabel: (code: string | null | undefined) =>
        resolveCatalogOptionLabel(configVehicular.data, code),
      subTipoRemLabel: (code: string | null | undefined) =>
        resolveCatalogOptionLabel(subTipoRem.data, code),
    }),
    [isLoading, tipoPermiso.data, configVehicular.data, subTipoRem.data],
  );
}
