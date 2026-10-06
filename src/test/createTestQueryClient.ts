import { QueryClient, type QueryClientConfig } from "@tanstack/react-query";

/**
 * QueryClient aislado por test: sin reintentos y con `gcTime: 0` para que el
 * caché no sobreviva al test. Ojo: con `gcTime: 0`, un `setQueryData` sin
 * observadores se recolecta en el siguiente macrotask; si siembras datos y
 * luego haces `await` antes de montar, pasa un `gcTime` mayor.
 */
export function createTestQueryClient(config: QueryClientConfig = {}): QueryClient {
  const { defaultOptions, ...rest } = config;
  return new QueryClient({
    ...rest,
    defaultOptions: {
      ...defaultOptions,
      queries: { retry: false, gcTime: 0, ...defaultOptions?.queries },
      mutations: { retry: false, ...defaultOptions?.mutations },
    },
  });
}
