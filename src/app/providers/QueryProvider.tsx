import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider = ({ children }: QueryProviderProps) => {
  // useState garantiza una instancia única por cliente (importante para SSR futuro)
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Tiempo que los datos se consideran "frescos"
            staleTime: 5 * 60 * 1000, // 5 minutos

            // Tiempo que los datos inactivos permanecen en cache
            gcTime: 10 * 60 * 1000, // 10 minutos (antes era cacheTime)

            // Reintentos en caso de error
            retry: (failureCount, error: any) => {
              // No reintentar errores 4xx (cliente)
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              return failureCount < 3;
            },

            // Refetch automático
            refetchOnWindowFocus: true, // Al volver a la pestaña
            refetchOnReconnect: true, // Al recuperar conexión
            refetchOnMount: true, // Al montar componente
          },
          mutations: {
            // Reintentos para mutaciones
            retry: 1,

            // Callback global de error (opcional)
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
        <ReactQueryDevtools initialIsOpen={false} position={"bottom"} />
      )}
    </QueryClientProvider>
  );
};
