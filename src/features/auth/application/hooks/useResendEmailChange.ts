/**
 * Mutación POST /auth/email-change/resend — rota token y reenvía enlace.
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
    throw new Error("useResendEmailChange must be used within an AuthProvider");
  }
  return ctx;
}

export function useResendEmailChange() {
  const { refreshProfile } = useAuthContextStrict();

  const mutation = useMutation({
    mutationFn: () => authApi.resendEmailChange(),
    onSuccess: async () => {
      await refreshProfile();
    },
  });

  const resendEmailChange = useCallback(
    () => mutation.mutateAsync(),
    [mutation],
  );

  return {
    resendEmailChange,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
