import { useMemo } from "react";

import type { TripStop } from "@features/trips/domain";
import { useCatalogOptions } from "@features/catalogs";
import { usePostalCodeLookup } from "@shared/ui/address-input/use-postal-code-lookup";
import {
  composeStopLocalityLine,
  resolveCatalogNameByCode,
} from "../stopLocalityDisplay";

export function useTripStopLocalityLine(stop: TripStop): string {
  const postalCode = stop.postalCode?.trim() ?? "";
  const postalLookup = usePostalCodeLookup(postalCode);
  const { data: stateOptions = [] } = useCatalogOptions("sat_estado");
  const stateCode =
    stop.satEstadoCode?.trim() || postalLookup.data?.stateCode || undefined;
  const { data: municipalityOptions = [] } = useCatalogOptions("sat_municipio", {
    parentCode: stateCode,
    enabled: Boolean(stateCode),
  });

  return useMemo(() => {
    const municipalityName =
      resolveCatalogNameByCode(stop.satMunicipioCode, municipalityOptions) ??
      postalLookup.data?.municipalityName ??
      null;
    const stateName =
      resolveCatalogNameByCode(stop.satEstadoCode, stateOptions) ??
      postalLookup.data?.stateName ??
      null;

    return composeStopLocalityLine(stop, {
      municipalityName,
      stateName,
    });
  }, [
    municipalityOptions,
    postalLookup.data,
    stateOptions,
    stop,
  ]);
}
