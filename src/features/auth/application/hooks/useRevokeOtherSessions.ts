/**
 * Mutación POST /auth/sessions/revoke-others — preparado para UI F3.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { authApi } from "../../infrastructure/api/authApi";

const SESSIONS_QUERY_KEY = ["auth", "sessions"] as const;

export function useRevokeOtherSessions() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => authApi.revokeOtherSessions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
    },
  });

  const revokeOtherSessions = useCallback(
    () => mutation.mutateAsync(),
    [mutation],
  );

  return {
    revokeOtherSessions,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
    data: mutation.data,
  };
}
