/* eslint-disable react-refresh/only-export-components */
import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@shared/ui/tooltip";
import { BranchesListPage } from "../presentation/pages/BranchesListPage";
import { BranchDetailPage } from "../presentation/pages/BranchDetailPage";
import { BranchCreatePage } from "../presentation/pages/BranchCreatePage";

export type BranchesRoute =
  | "/branches"
  | "/branches/new"
  | `/branches/${string}`;

interface RenderBranchesOptions extends Omit<RenderOptions, "wrapper"> {
  initialEntry?: BranchesRoute;
  withCreateRoute?: boolean;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function BranchesRoutes({ withCreateRoute = true }: { withCreateRoute?: boolean }) {
  return (
    <Routes>
      <Route path="/branches" element={<BranchesListPage />} />
      {withCreateRoute ? (
        <Route path="/branches/new" element={<BranchCreatePage />} />
      ) : null}
      <Route path="/branches/:id" element={<BranchDetailPage />} />
    </Routes>
  );
}

export function BranchesTestProviders({
  children,
  initialEntry = "/branches",
}: {
  children: ReactNode;
  initialEntry?: string;
}) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export function renderWithBranchesProviders(
  ui?: ReactElement,
  {
    initialEntry = "/branches",
    withCreateRoute = true,
    ...options
  }: RenderBranchesOptions = {},
) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          {ui ?? <BranchesRoutes withCreateRoute={withCreateRoute} />}
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
    options,
  );
}
