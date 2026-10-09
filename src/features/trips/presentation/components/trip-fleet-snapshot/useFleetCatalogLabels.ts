import { useMemo } from "react";
import { useCatalogOptions } from "@features/catalogs/application";
import { CatalogTypeCode, type CatalogOption } from "@features/catalogs/domain";
import type { FleetCatalogLabels } from "./tripFleetSnapshotHelpers";

function resolveLabel(
  options: readonly CatalogOption[] | undefined,
  code: string | null | undefined,
): string | null {
  const trimmed = code?.trim();
  if (!trimmed) return null;
  const name = options?.find((option) => option.code === trimmed)?.name?.trim();
  return name || null;
}

/** Descripción de configuración vehicular y tipo de permiso (catálogos SAT públicos). */
export function useFleetCatalogLabels(enabled: boolean): FleetCatalogLabels {
  const configVehicular = useCatalogOptions(CatalogTypeCode.SAT_CONFIG_AUTOTRANSPORTE, {
    enabled,
  });
  const tipoPermiso = useCatalogOptions(CatalogTypeCode.SAT_TIPO_PERMISO, { enabled });

  return useMemo(
    () => ({
      configVehicularLabel: (code) => resolveLabel(configVehicular.data, code),
      tipoPermisoLabel: (code) => resolveLabel(tipoPermiso.data, code),
    }),
    [configVehicular.data, tipoPermiso.data],
  );
}
