/**
 * Verifica token de invitación (GET /invitations/verify/:token).
 */
import { useQuery } from "@tanstack/react-query";
import { invitationsApi } from "../../infrastructure/invitationsApi";
import type { InvitationVerifyPayload } from "../../domain/entities";

export const verifyInvitationQueryKey = (token: string) =>
  ["invitations", "verify", token] as const;

export function useVerifyInvitation(token: string | null) {
  const trimmed = token?.trim() ?? "";

  const query = useQuery({
    queryKey: verifyInvitationQueryKey(trimmed),
    queryFn: () => invitationsApi.verify(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const isMissingToken = trimmed.length === 0;
  const data = query.data as InvitationVerifyPayload | undefined;

  return {
    isLoading: !isMissingToken && query.isPending,
    isMissingToken,
    isError: query.isError,
    data,
    isValid: Boolean(data?.valid),
    errorMessage: isMissingToken
      ? "No se proporcionó un enlace válido"
      : query.isError
        ? "No se pudo validar la invitación"
        : data && !data.valid
          ? data.error || "Invitación no disponible"
          : null,
  };
}
