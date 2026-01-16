import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// ============================================
// Tipos
// ============================================

interface QueryProviderProps {
  children: ReactNode;
}

// ============================================
// Provider
// ============================================

/**
 * QueryProvider
 *
 * Configura React Query (TanStack Query) para toda la aplicación.
 * Maneja el cache global, fetching, sincronización y actualizaciones en background.
 */
export const QueryProvider = ({ children }: QueryProviderProps) => {
  // useState garantiza una instancia única por cliente
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Tiempo que los datos se consideran "frescos"
            staleTime: 5 * 60 * 1000, // 5 minutos

            // Tiempo que los datos inactivos permanecen en cache
            gcTime: 10 * 60 * 1000, // 10 minutos

            // Reintentos en caso de error
            retry: (failureCount, error: any) => {
              // No reintentar errores 4xx (cliente)
              const status = error?.response?.status || error?.status;
              if (status >= 400 && status < 500) {
                return false;
              }
              return failureCount < 3;
            },

            // Refetch automático
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
            refetchOnMount: true,
          },
          mutations: {
            // Reintentos para mutaciones
            retry: 1,

            // Callback global de error
            onError: (error) => {
              console.error("Mutation error:", error);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}

      {/* DevTools solo en desarrollo */}
      {import.meta.env.DEV && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};
