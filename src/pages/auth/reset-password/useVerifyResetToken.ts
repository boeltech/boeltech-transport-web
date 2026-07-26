/**
 * Verifica token de reset de contraseña (GET /auth/verify-reset-token/:token).
 * Lectura idempotente — React Query dedupea StrictMode / remounts.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api";

export const verifyResetTokenQueryKey = (token: string) =>
  ["auth", "verify-reset-token", token] as const;

export type VerifyResetTokenResult =
  | { valid: true }
  | { valid: false; error: string };

async function fetchVerifyResetToken(
  token: string,
): Promise<VerifyResetTokenResult> {
  const response = await apiClient.get<{
    message: string;
    data: {
      valid: boolean;
      error?: string;
    };
  }>(`/auth/verify-reset-token/${encodeURIComponent(token)}`);

  if (response.data.valid) {
    return { valid: true };
  }
  return {
    valid: false,
    error: response.data.error || "Enlace inválido o expirado",
  };
}

export function useVerifyResetToken(token: string | null) {
  const trimmed = token?.trim() ?? "";

  const query = useQuery({
    queryKey: verifyResetTokenQueryKey(trimmed),
    queryFn: () => fetchVerifyResetToken(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return {
    isLoading: trimmed.length > 0 && query.isPending,
    isMissingToken: trimmed.length === 0,
    result: query.data,
    isError: query.isError,
    errorMessage:
      query.isError
        ? "Enlace inválido o expirado"
        : query.data && !query.data.valid
          ? query.data.error
          : null,
  };
}
