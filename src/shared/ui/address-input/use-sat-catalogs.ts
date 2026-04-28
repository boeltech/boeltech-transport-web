import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api";

interface CatalogOptionApi {
  code: string;
  name: string;
}

interface CatalogOption {
  code: string;
  name: string;
}

const MEX_COUNTRY_OPTION: CatalogOption = {
  code: "MEX",
  name: "Mexico",
};

const mapCatalogOptions = (items: CatalogOptionApi[]): CatalogOption[] =>
  items.map((item) => ({
    code: item.code,
    name: item.name,
  }));

const fetchCatalogOptions = async (
  typeCode: string,
  parentCode?: string,
): Promise<CatalogOption[]> => {
  const params = parentCode ? { parent_code: parentCode } : undefined;

  const response = await apiClient.get<{ data: CatalogOptionApi[] }>(
    `/catalogs/${typeCode}/options`,
    { params },
  );

  return mapCatalogOptions(response.data);
};

export function useSatCatalogs(stateCode?: string, postalCode?: string) {
  const normalizedStateCode = stateCode?.trim() || "";
  const normalizedPostalCode = postalCode?.trim() || "";

  const statesQuery = useQuery({
    queryKey: ["address-sat-states"],
    queryFn: () => fetchCatalogOptions("sat_estado"),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 60 * 60_000,
  });

  const municipalitiesQuery = useQuery({
    queryKey: ["address-sat-municipalities", normalizedStateCode],
    queryFn: () => fetchCatalogOptions("sat_municipio", normalizedStateCode),
    enabled: Boolean(normalizedStateCode),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 60 * 60_000,
  });

  const neighborhoodsByPostalCodeQuery = useQuery({
    queryKey: ["address-sat-neighborhoods", normalizedPostalCode],
    queryFn: () => fetchCatalogOptions("sat_colonia", normalizedPostalCode),
    enabled: /^\d{5}$/.test(normalizedPostalCode),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 60 * 60_000,
  });

  return {
    countries: [MEX_COUNTRY_OPTION],
    states: statesQuery.data ?? [],
    municipalities: municipalitiesQuery.data ?? [],
    neighborhoodsByPostalCode: neighborhoodsByPostalCodeQuery.data ?? [],
    isLoadingStates: statesQuery.isLoading,
    isLoadingMunicipalities: municipalitiesQuery.isLoading,
    isLoadingNeighborhoodsByPostalCode: neighborhoodsByPostalCodeQuery.isLoading,
  };
}

export type { CatalogOption };
