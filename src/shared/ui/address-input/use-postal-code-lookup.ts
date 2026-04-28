import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api";

interface PostalLookupRowApi {
  code?: string;
  name?: string;
}

interface PostalLookupApi {
  postal_code?: string;
  state_code?: string | null;
  state_name?: string | null;
  municipality_code?: string | null;
  municipality_name?: string | null;
  localities?: PostalLookupRowApi[];
  neighborhoods?: PostalLookupRowApi[];
}

export interface PostalLookupRow {
  code: string;
  name: string;
}

export interface PostalCodeLookupResult {
  postalCode: string;
  found: boolean;
  stateCode: string | null;
  stateName: string | null;
  municipalityCode: string | null;
  municipalityName: string | null;
  localities: PostalLookupRow[];
  neighborhoods: PostalLookupRow[];
}

const normalizeRows = (rows: PostalLookupRowApi[] | undefined): PostalLookupRow[] =>
  (rows ?? [])
    .filter((row): row is Required<PostalLookupRowApi> => Boolean(row.code && row.name))
    .map((row) => ({
      code: row.code,
      name: row.name,
    }));

const normalizeLookup = (apiData: PostalLookupApi): PostalCodeLookupResult => ({
  postalCode: apiData.postal_code ?? "",
  found: true,
  stateCode: apiData.state_code ?? null,
  stateName: apiData.state_name ?? null,
  municipalityCode: apiData.municipality_code ?? null,
  municipalityName: apiData.municipality_name ?? null,
  localities: normalizeRows(apiData.localities),
  neighborhoods: normalizeRows(apiData.neighborhoods),
});

const emptyLookup = (postalCode: string): PostalCodeLookupResult => ({
  postalCode,
  found: false,
  stateCode: null,
  stateName: null,
  municipalityCode: null,
  municipalityName: null,
  localities: [],
  neighborhoods: [],
});

function getHttpStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: unknown }).response !== null &&
    "status" in ((error as { response: { status?: unknown } }).response) &&
    typeof ((error as { response: { status: unknown } }).response.status) ===
      "number"
  ) {
    return (error as { response: { status: number } }).response.status;
  }

  return undefined;
}

export function usePostalCodeLookup(postalCode: string) {
  const normalizedPostalCode = postalCode.trim();
  const isPostalCodeReady = /^\d{5}$/.test(normalizedPostalCode);

  return useQuery({
    queryKey: ["address-postal-lookup", normalizedPostalCode],
    queryFn: async (): Promise<PostalCodeLookupResult> => {
      try {
        const response = await apiClient.get<{ data: PostalLookupApi }>(
          `/catalogs/sat/by-postal-code/${normalizedPostalCode}`,
        );
        return normalizeLookup(response.data);
      } catch (error) {
        if (getHttpStatus(error) === 404) {
          return emptyLookup(normalizedPostalCode);
        }
        throw error;
      }
    },
    enabled: isPostalCodeReady,
    retry: false,
    staleTime: 5 * 60_000,
  });
}
