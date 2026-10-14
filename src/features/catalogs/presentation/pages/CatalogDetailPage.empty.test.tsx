import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import { CatalogDetailPage } from "./CatalogDetailPage";
import { catalogsCopy } from "../copy/catalogsCopy";

const NOW = new Date("2026-07-01T12:00:00.000Z");

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => false,
  }),
}));

vi.mock("@shared/ui/page-shells", () => ({
  SettingsPageShell: ({
    children,
    hideSidebar,
  }: {
    children: ReactNode;
    hideSidebar?: boolean;
  }) => (
    <div>
      <span data-testid="hide-sidebar">{String(Boolean(hideSidebar))}</span>
      {children}
    </div>
  ),
}));

vi.mock("@features/settings/presentation/components/SettingsLayout", () => ({
  SettingsCard: ({
    children,
    title,
  }: {
    children: ReactNode;
    title?: string;
  }) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {children}
    </section>
  ),
}));

vi.mock("../../application/hooks", () => ({
  useCatalogTypes: () => ({
    data: [
      {
        id: "type-1",
        code: "sat_forma_pago",
        name: "Formas de pago",
        description: "Catálogo de prueba",
        source: "SAT",
        parentTypeCode: null,
        isHierarchical: false,
        isGlobal: true,
        metadataSchema: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCatalogStatistics: () => ({
    data: [
      {
        typeCode: "sat_forma_pago",
        typeName: "Formas de pago",
        itemCount: 0,
        source: "SAT",
        currentVersion: null,
      },
    ],
    isLoading: false,
  }),
  useCatalogItems: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useCatalogSearch: () => ({
    data: { items: [], total: 0 },
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("CatalogDetailPage empty", () => {
  it("muestra EmptyState único cuando no hay valores (D6)", () => {
    render(
      <MemoryRouter initialEntries={["/settings/catalogs/sat_forma_pago"]}>
        <Routes>
          <Route
            path="/settings/catalogs/:typeCode"
            element={<CatalogDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("hide-sidebar")).toHaveTextContent("true");
    expect(
      screen.getByText(catalogsCopy.table.emptyAllTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(catalogsCopy.table.emptyAllDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByText(catalogsCopy.readOnlyNotice.detailTitle),
    ).toBeInTheDocument();
  });
});
