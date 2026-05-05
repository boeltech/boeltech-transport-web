/**
 * Mutación para cambiar contraseña con sesión activa (POST /auth/change-password).
 */

import { useMutation } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { AuthRepository } from "../../infrastructure/repositories/AuthRepository";
import type { ChangePasswordPayload } from "../../domain";

export function useChangePassword() {
  const repository = useMemo(() => new AuthRepository(), []);

  const mutation = useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      repository.changePassword(payload),
  });

  const changePassword = useCallback(
    (payload: ChangePasswordPayload) => mutation.mutateAsync(payload),
    [mutation],
  );

  return {
    changePassword,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
