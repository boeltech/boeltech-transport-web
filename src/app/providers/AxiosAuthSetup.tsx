import type { ReactNode } from "react";

/**
 * Los interceptores se registran en `bootstrapAuthInterceptors()` (app/index.tsx)
 * antes del primer render. Este wrapper se conserva por compatibilidad de árbol.
 */
export function AxiosAuthSetup({ children }: { children: ReactNode }) {
  return children;
}
