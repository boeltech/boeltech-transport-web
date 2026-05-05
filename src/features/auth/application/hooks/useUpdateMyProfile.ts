/**
 * Mutación para actualizar el perfil del usuario autenticado (PATCH /auth/profile).
 */

import { useMutation } from "@tanstack/react-query";
import { useCallback, useContext, useMemo } from "react";
import {
  AuthContext,
  type AuthContextType,
} from "../../presentation/ui/AuthProvider";
import { AuthRepository } from "../../infrastructure/repositories/AuthRepository";
import type { UpdateMyProfilePayload } from "../../domain";

function useAuthContextStrict(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useUpdateMyProfile must be used within an AuthProvider");
  }
  return ctx;
}

export function useUpdateMyProfile() {
  const { replaceSessionUser } = useAuthContextStrict();
  const repository = useMemo(() => new AuthRepository(), []);

  const mutation = useMutation({
    mutationFn: (payload: UpdateMyProfilePayload) =>
      repository.updateProfile(payload),
    onSuccess: ({ user, accessToken }) => {
      replaceSessionUser(user, accessToken);
    },
  });

  const updateProfile = useCallback(
    (payload: UpdateMyProfilePayload) => mutation.mutateAsync(payload),
    [mutation],
  );

  return {
    updateProfile,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
