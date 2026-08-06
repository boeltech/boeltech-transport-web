/**
 * Kill-switch UX de registro self-serve (ADR-0070 Fase 2).
 * Espejo de `PUBLIC_SELF_SERVE_REGISTER` en API; SoT de enforcement = API.
 *
 * Usa React Query para deduplicar GET /onboarding/registration-status entre
 * landing (varios consumidores), login y register — evita 429 del authRateLimit.
 */
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@shared/api";
import config from "@shared/config/env";

export const publicSelfServeRegisterQueryKey = [
  "onboarding",
  "registration-status",
] as const;

interface RegistrationStatusBody {
  data?: {
    self_serve_register_open?: boolean;
  };
  self_serve_register_open?: boolean;
}

async function fetchRegistrationStatusOpen(): Promise<boolean> {
  const body = await apiClient.get<RegistrationStatusBody>(
    "/onboarding/registration-status",
  );
  // apiClient.get devuelve el JSON crudo `{ data: { self_serve_register_open } }`.
  if (typeof body.data?.self_serve_register_open === "boolean") {
    return body.data.self_serve_register_open;
  }
  if (typeof body.self_serve_register_open === "boolean") {
    return body.self_serve_register_open;
  }
  // Fail-open solo si el shape no responde; SoT = GET registration-status / API kill-switch
  // (production API defaults closed when PUBLIC_SELF_SERVE_REGISTER unset).
  return true;
}

export function usePublicSelfServeRegister(): {
  open: boolean;
  resolved: boolean;
} {
  const viteOpen = config.auth.publicSelfServeRegister;

  const query = useQuery({
    queryKey: publicSelfServeRegisterQueryKey,
    queryFn: fetchRegistrationStatusOpen,
    enabled: viteOpen,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (!viteOpen) {
    return { open: false, resolved: true };
  }

  return {
    // Mientras carga o si falla: fail-open (true) como el catch previo
    open: query.data ?? true,
    resolved: !query.isPending,
  };
}
