import { apiClient } from "@shared/api";
import { setupAuthInterceptor } from "@features/auth/infrastructure/interceptors/authInterceptor";
import {
  notifyTenantUnauthorized,
  notifyTenantTokenRefreshed,
} from "@features/auth/infrastructure/sessionHandlers";

let teardown: (() => void) | undefined;

/**
 * Registra interceptores de auth antes del primer render.
 * Evita carrera en hard reload: AuthProvider verifica /auth/profile antes
 * de que un useEffect en un ancestro monte los interceptores.
 */
export function bootstrapAuthInterceptors(): void {
  if (teardown) return;

  teardown = setupAuthInterceptor(apiClient.getAxiosInstance(), {
    onUnauthorized: () => notifyTenantUnauthorized(),
    onForbidden: () => {
      /* 403 contextual — sin logout global */
    },
    onTokenRefreshed: (newToken) => notifyTenantTokenRefreshed(newToken),
  });
}

/** Solo tests — permite re-registrar interceptores tras reset del cliente. */
export function resetAuthInterceptorsForTests(): void {
  teardown?.();
  teardown = undefined;
}
