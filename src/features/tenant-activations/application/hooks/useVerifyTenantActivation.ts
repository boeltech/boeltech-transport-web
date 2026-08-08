import { useQuery } from "@tanstack/react-query";
import { tenantActivationQueryKeys } from "../../domain/entities";
import { tenantActivationsApi } from "../../infrastructure/tenantActivationsApi";

export function useVerifyTenantActivation(token: string | null) {
  const trimmed = token?.trim() ?? "";

  const query = useQuery({
    queryKey: tenantActivationQueryKeys.verify(trimmed),
    queryFn: () => tenantActivationsApi.verify(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isMissingToken = trimmed.length === 0;

  return {
    isLoading: !isMissingToken && query.isPending,
    isMissingToken,
    isError: query.isError,
    data: query.data,
    isValid: Boolean(query.data?.subdomain),
    errorMessage: isMissingToken
      ? "No se proporcionó un enlace válido"
      : query.isError
        ? "No se pudo validar la activación"
        : null,
  };
}
