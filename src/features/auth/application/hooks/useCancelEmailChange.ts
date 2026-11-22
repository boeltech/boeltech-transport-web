/**
 * Mutación DELETE /auth/email-change — cancela la solicitud viva.
 */

import { useMutation } from "@tanstack/react-query";
import { useCallback, useContext } from "react";
import {
  AuthContext,
  type AuthContextType,
} from "../../presentation/ui/authContext";
import { authApi } from "../../infrastructure/api/authApi";

function useAuthContextStrict(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useCancelEmailChange must be used within an AuthProvider");
  }
  return ctx;
}

export function useCancelEmailChange() {
  const { refreshProfile } = useAuthContextStrict();

  const mutation = useMutation({
    mutationFn: () => authApi.cancelEmailChange(),
    onSuccess: async () => {
      await refreshProfile();
    },
  });

  const cancelEmailChange = useCallback(
    () => mutation.mutateAsync(),
    [mutation],
  );

  return {
    cancelEmailChange,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
