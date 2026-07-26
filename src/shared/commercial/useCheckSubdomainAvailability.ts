/**
 * Disponibilidad de subdomain (registro self-serve).
 * GET /onboarding/check-subdomain — under authRateLimit; RQ + debounce evita ráfagas.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api";
import { useDebounce } from "@shared/hooks";

export const checkSubdomainQueryKey = (subdomain: string) =>
  ["onboarding", "check-subdomain", subdomain] as const;

export type SubdomainCheckResult = {
  available: boolean;
  subdomain: string;
  suggestion: string | null;
};

async function fetchSubdomainAvailability(
  subdomain: string,
): Promise<SubdomainCheckResult> {
  const response = await apiClient.get<{
    message: string;
    data: {
      available: boolean;
      subdomain: string;
      suggestion?: string;
    };
  }>(`/onboarding/check-subdomain?subdomain=${encodeURIComponent(subdomain)}`);

  return {
    available: Boolean(response.data.available),
    subdomain: response.data.subdomain,
    suggestion: response.data.suggestion ?? null,
  };
}

/**
 * @param subdomain valor en vivo del input (se debouncea internamente 500ms)
 */
export function useCheckSubdomainAvailability(subdomain: string | undefined) {
  const normalized = (subdomain ?? "").trim().toLowerCase();
  const debounced = useDebounce(normalized, 500);
  const enabled = debounced.length >= 3;

  const query = useQuery({
    queryKey: checkSubdomainQueryKey(debounced),
    queryFn: () => fetchSubdomainAvailability(debounced),
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const isChecking =
    enabled &&
    (query.isFetching || (normalized !== debounced && normalized.length >= 3));

  return {
    available: enabled ? (query.data?.available ?? null) : null,
    suggestion: enabled ? (query.data?.suggestion ?? null) : null,
    isChecking,
    isError: query.isError,
    refetch: query.refetch,
    debouncedSubdomain: debounced,
  };
}
