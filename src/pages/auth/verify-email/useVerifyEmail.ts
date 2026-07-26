import { useQuery } from "@tanstack/react-query";
import { authApi, tokenStorage } from "@features/auth/infrastructure";
import { mapBackendError } from "@shared/utils/errorMapper";
import { verifyEmailCopy } from "./verifyEmailCopy";

export const verifyEmailQueryKey = (token: string) =>
  ["auth", "verify-email", token] as const;

export function useVerifyEmail(token: string | null) {
  const trimmed = token?.trim() ?? "";

  const query = useQuery({
    queryKey: verifyEmailQueryKey(trimmed),
    queryFn: async () => {
      const result = await authApi.verifyEmail(trimmed);
      const stored = tokenStorage.getUser();
      if (stored) {
        tokenStorage.setUser({
          ...stored,
          emailVerifiedAt: result.emailVerifiedAt,
        });
      }
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
      ? verifyEmailCopy.error.missingToken
      : query.isError
        ? mapBackendError(query.error).message
        : null,
  };
}
