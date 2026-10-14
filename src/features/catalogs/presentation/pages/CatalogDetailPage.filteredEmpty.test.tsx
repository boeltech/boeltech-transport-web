import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import { CatalogDetailPage } from "./CatalogDetailPage";
import { catalogsCopy } from "../copy/catalogsCopy";

const NOW = new Date("2026-07-01T12:00:00.000Z");

vi.mock("@shared/hooks/use-debounce", () => ({
  useDebounce: <T,>(value: T) => value,
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});

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
        itemCount: 2,
        source: "SAT",
        currentVersion: null,
      },
    ],
    isLoading: false,
  }),
  useCatalogItems: () => ({
    data: [
      {
        id: "item-1",
        tenantId: null,
        catalogTypeId: "type-1",
        code: "01",
        name: "Efectivo",
        description: null,
        parentCode: null,
        sortOrder: 0,
        isActive: true,
        validFrom: null,
        validTo: null,
        metadata: null,
        createdAt: NOW,
        updatedAt: NOW,
      },
    ],
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

describe("CatalogDetailPage empty filtrado", () => {
  it("muestra EmptyState con CTA limpiar búsqueda (CA5)", async () => {
    const user = userEvent.setup();

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

    await user.type(
      screen.getByPlaceholderText(catalogsCopy.detail.searchPlaceholder),
      "zzz-sin-match",
    );

    expect(
      screen.getByText(catalogsCopy.table.emptySearchTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(catalogsCopy.table.emptySearchDescription),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: catalogsCopy.detail.clearSearch }),
    );

    expect(
      screen.queryByText(catalogsCopy.table.emptySearchTitle),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Efectivo")).toBeInTheDocument();
  });
});
