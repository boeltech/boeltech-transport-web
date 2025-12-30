// src/app/providers/QueryProvider.jsx

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

/**
 * Configuración del QueryClient
 * Define comportamientos por defecto para todas las queries y mutations
 */
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Tiempo que los datos se consideran "frescos" (no se refetchean automáticamente)
        staleTime: 5 * 60 * 1000, // 5 minutos

        // Tiempo que los datos se mantienen en caché después de que no se usan
        cacheTime: 10 * 60 * 1000, // 10 minutos

        // Refetch automático cuando la ventana recupera el foco
        refetchOnWindowFocus: false,

        // Refetch automático cuando se reconecta la red
        refetchOnReconnect: true,

        // Refetch automático al montar el componente
        refetchOnMount: true,

        // Número de reintentos en caso de error
        retry: 1,

        // Función de reintento (backoff exponencial)
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Mantener datos anteriores mientras se cargan nuevos (útil para paginación)
        keepPreviousData: false,

        // Función para determinar si un error debe marcar los datos como stale
        useErrorBoundary: false,

        // Función para manejar errores globalmente
        onError: (error) => {
          console.error('Query error:', error);
        },
      },

      mutations: {
        // Reintentos para mutations (generalmente no queremos reintentar)
        retry: 0,

        // Función para manejar errores en mutations
        onError: (error) => {
          console.error('Mutation error:', error);
        },
      },
    },
  });
};

/**
 * QueryProvider - Proveedor de React Query
 * Envuelve la aplicación y proporciona el cliente de React Query
 * 
 * @param {Object} props - Props del componente
 * @param {ReactNode} props.children - Componentes hijos
 */
export const QueryProvider = ({ children }) => {
  // Crear una instancia del QueryClient
  // useState asegura que solo se cree una vez
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      
      {/* DevTools solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};

/**
 * Hook personalizado para acceder al QueryClient
 * Útil para invalidar caché manualmente o realizar operaciones avanzadas
 */
import { useQueryClient } from '@tanstack/react-query';

export const useQueryClientHelper = () => {
  const queryClient = useQueryClient();

  return {
    queryClient,
    
    /**
     * Invalidar queries específicas
     * @param {string|string[]} queryKey - Key(s) de las queries a invalidar
     */
    invalidateQueries: (queryKey) => {
      return queryClient.invalidateQueries({ queryKey });
    },

    /**
     * Invalidar todas las queries
     */
    invalidateAll: () => {
      return queryClient.invalidateQueries();
    },

    /**
     * Resetear queries (borrar datos y estado)
     * @param {string|string[]} queryKey - Key(s) de las queries a resetear
     */
    resetQueries: (queryKey) => {
      return queryClient.resetQueries({ queryKey });
    },

    /**
     * Obtener datos de caché
     * @param {string|string[]} queryKey - Key de la query
     */
    getQueryData: (queryKey) => {
      return queryClient.getQueryData(queryKey);
    },

    /**
     * Setear datos de caché manualmente
     * @param {string|string[]} queryKey - Key de la query
     * @param {any} data - Datos a guardar
     */
    setQueryData: (queryKey, data) => {
      return queryClient.setQueryData(queryKey, data);
    },

    /**
     * Prefetch de datos (cargar antes de que se necesiten)
     * @param {Object} options - Opciones de prefetch
     */
    prefetchQuery: (options) => {
      return queryClient.prefetchQuery(options);
    },

    /**
     * Cancelar queries en progreso
     * @param {string|string[]} queryKey - Key de la query
     */
    cancelQueries: (queryKey) => {
      return queryClient.cancelQueries({ queryKey });
    },

    /**
     * Obtener todas las queries activas
     */
    getQueryCache: () => {
      return queryClient.getQueryCache();
    },

    /**
     * Limpiar toda la caché
     */
    clear: () => {
      return queryClient.clear();
    },
  };
};

/**
 * Hook personalizado para queries con configuración común
 * Wrapper útil para queries que comparten configuración
 */
export const useCommonQuery = (queryKey, queryFn, options = {}) => {
  return useQuery({
    queryKey,
    queryFn,
    ...options,
    // Configuraciones específicas que sobrescriben las defaults
    onError: (error) => {
      console.error(`Error in query [${queryKey}]:`, error);
      options.onError?.(error);
    },
  });
};

/**
 * Hook personalizado para mutations con configuración común
 */
export const useCommonMutation = (mutationFn, options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    ...options,
    onError: (error) => {
      console.error('Mutation error:', error);
      options.onError?.(error);
    },
    onSuccess: (data, variables, context) => {
      // Llamar a onSuccess personalizado si existe
      options.onSuccess?.(data, variables, context);
    },
  });
};

// Re-exportar hooks de React Query para conveniencia
export { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';