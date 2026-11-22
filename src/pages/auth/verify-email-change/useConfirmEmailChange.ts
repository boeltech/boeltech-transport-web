import { useQuery } from "@tanstack/react-query";
import { authApi, tokenStorage } from "@features/auth/infrastructure";
import { mapBackendError } from "@shared/utils/errorMapper";
import { verifyEmailChangeCopy } from "./verifyEmailChangeCopy";

export const confirmEmailChangeQueryKey = (token: string) =>
  ["auth", "confirm-email-change", token] as const;

export function useConfirmEmailChange(token: string | null) {
  const trimmed = token?.trim() ?? "";

  const query = useQuery({
    queryKey: confirmEmailChangeQueryKey(trimmed),
    queryFn: async () => {
      const result = await authApi.confirmEmailChange(trimmed);
      // Confirm revoca todas las sesiones; limpia tokens locales (no
      // removeQueries(['auth']) aquí: borraría esta misma query).
      tokenStorage.clear();
      return result;
    },
    enabled: trimmed.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const isMissingToken = trimmed.length === 0;

  return {
    isMissingToken,
    isLoading: !isMissingToken && query.isPending,
    isSuccess: query.isSuccess,
    isError: isMissingToken || query.isError,
    errorMessage: isMissingToken
      ? verifyEmailChangeCopy.error.missingToken
      : query.isError
        ? mapBackendError(query.error).message
        : null,
  };
}
