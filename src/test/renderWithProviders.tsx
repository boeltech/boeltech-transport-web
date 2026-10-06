/* eslint-disable react-refresh/only-export-components */
import { useState, type ReactElement, type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  type MemoryRouterProps,
} from "react-router-dom";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { createTestQueryClient } from "./createTestQueryClient";

export interface TestProvidersOptions {
  /** Cliente propio (p. ej. para espiar `invalidateQueries`). Por defecto uno nuevo por render. */
  queryClient?: QueryClient;
  /** `false` omite el QueryClientProvider. */
  withQueryClient?: boolean;
  /** `false` omite el MemoryRouter (componentes que montan su propio router). */
  withRouter?: boolean;
  /** Ruta inicial; atajo de `initialEntries: [route]`. */
  route?: string;
  initialEntries?: MemoryRouterProps["initialEntries"];
  /** Patrón de ruta (`/trips/:id`) para que `useParams` resuelva sobre `route`. */
  path?: string;
}

export function TestProviders({
  children,
  queryClient,
  withQueryClient = true,
  withRouter = true,
  route,
  initialEntries,
  path,
}: TestProvidersOptions & { children: ReactNode }) {
  const [client] = useState(() => queryClient ?? createTestQueryClient());

  let content = children;
  if (withRouter) {
    const entries = initialEntries ?? [route ?? "/"];
    content = (
      <MemoryRouter initialEntries={entries}>
        {path ? (
          <Routes>
            <Route path={path} element={children} />
          </Routes>
        ) : (
          children
        )}
      </MemoryRouter>
    );
  }

  if (!withQueryClient) return <>{content}</>;
  return <QueryClientProvider client={client}>{content}</QueryClientProvider>;
}

/** Wrapper para `renderHook(..., { wrapper })` con los mismos providers. */
export function createTestWrapper(options: TestProvidersOptions = {}) {
  const queryClient = options.queryClient ?? createTestQueryClient();
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestProviders {...options} queryClient={queryClient}>
        {children}
      </TestProviders>
    );
  }
  return { Wrapper, queryClient };
}

export interface RenderWithProvidersOptions
  extends TestProvidersOptions,
    Omit<RenderOptions, "wrapper" | "queries"> {}

/**
 * `render` con QueryClient de test + MemoryRouter. Devuelve también el
 * `queryClient` usado; `rerender` conserva el mismo cliente.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient: providedClient,
    withQueryClient,
    withRouter,
    route,
    initialEntries,
    path,
    ...renderOptions
  }: RenderWithProvidersOptions = {},
) {
  const { Wrapper, queryClient } = createTestWrapper({
    queryClient: providedClient,
    withQueryClient,
    withRouter,
    route,
    initialEntries,
    path,
  });
  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient };
}
