/**
 * Mutación POST /auth/email-change — solicita cambio de correo con contraseña.
 */

import { useMutation } from "@tanstack/react-query";
import { useCallback, useContext } from "react";
import {
  AuthContext,
  type AuthContextType,
} from "../../presentation/ui/authContext";
import { authApi } from "../../infrastructure/api/authApi";
import type { RequestEmailChangePayload } from "../../domain";

function useAuthContextStrict(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useRequestEmailChange must be used within an AuthProvider");
  }
  return ctx;
}

export function useRequestEmailChange() {
  const { refreshProfile } = useAuthContextStrict();

  const mutation = useMutation({
    mutationFn: (payload: RequestEmailChangePayload) =>
      authApi.requestEmailChange(payload),
    onSuccess: async () => {
      await refreshProfile();
    },
  });

  const requestEmailChange = useCallback(
    (payload: RequestEmailChangePayload) => mutation.mutateAsync(payload),
    [mutation],
  );

  return {
    requestEmailChange,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
