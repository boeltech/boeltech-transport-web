import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";

import { CatalogDetailPage } from "./CatalogDetailPage";
import { catalogsCopy } from "../copy/catalogsCopy";

const NOW = new Date("2026-07-01T12:00:00.000Z");

const hasPermission = vi.fn(() => false);

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (resource: string, action: string) =>
      hasPermission(resource, action),
  }),
}));

vi.mock("@shared/ui/page-shells", () => ({
  SettingsPageShell: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@features/settings/presentation/components/SettingsLayout", () => ({
  SettingsCard: ({
    children,
    title,
    actions,
  }: {
    children: ReactNode;
    title?: string;
    actions?: ReactNode;
  }) => (
    <section>
      {title ? <h2>{title}</h2> : null}
      {actions}
      {children}
    </section>
  ),
}));

vi.mock("../components/CatalogItemFormSheet", () => ({
  CatalogItemFormSheet: ({
    open,
    item,
  }: {
    open: boolean;
    item?: { code: string } | null;
  }) => (
    <div data-testid="catalog-item-form-sheet">
      <span data-testid="sheet-open">{String(open)}</span>
      <span data-testid="sheet-item">{item?.code ?? "create"}</span>
    </div>
  ),
}));

vi.mock("../../application/hooks/useCatalogItemMutations", () => ({
  useDeleteCatalogItem: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useCreateCatalogItem: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateCatalogItem: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("../../application/hooks", () => ({
  useCatalogTypes: () => ({
    data: [
      {
        id: "type-mutable",
        code: "tenant_custom",
        name: "Catálogo mutable",
        description: "Solo prueba",
        source: null,
        parentTypeCode: null,
        isHierarchical: false,
        isGlobal: false,
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
        typeCode: "tenant_custom",
        typeName: "Catálogo mutable",
        itemCount: 1,
        source: null,
        currentVersion: null,
      },
    ],
    isLoading: false,
  }),
  useCatalogItems: () => ({
    data: [
      {
        id: "item-1",
        tenantId: "t1",
        catalogTypeId: "type-mutable",
        code: "A1",
        name: "Valor A",
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

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={["/settings/catalogs/tenant_custom"]}>
      <Routes>
        <Route
          path="/settings/catalogs/:typeCode"
          element={<CatalogDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CatalogDetailPage Sheet (D9/D10 · CA8)", () => {
  beforeEach(() => {
    hasPermission.mockReset();
  });

  it("monta Sheet con create y abre el mismo al editar desde ⋯", async () => {
    const user = userEvent.setup();
    hasPermission.mockImplementation(
      (resource: string, action: string) =>
        resource === "catalogs" &&
        (action === "create" || action === "update" || action === "delete"),
    );

    renderDetail();

    expect(screen.getByTestId("catalog-item-form-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("sheet-open")).toHaveTextContent("false");

    await user.click(
      screen.getByRole("button", { name: catalogsCopy.detail.addRecord }),
    );
    expect(screen.getByTestId("sheet-open")).toHaveTextContent("true");
    expect(screen.getByTestId("sheet-item")).toHaveTextContent("create");

    await user.click(screen.getByRole("button", { name: "Acciones" }));
    await user.click(
      screen.getByRole("menuitem", { name: catalogsCopy.itemActions.edit }),
    );

    expect(screen.getByTestId("sheet-open")).toHaveTextContent("true");
    expect(screen.getByTestId("sheet-item")).toHaveTextContent("A1");
  });

  it("monta Sheet al editar aunque no haya permiso create (D10)", async () => {
    const user = userEvent.setup();
    hasPermission.mockImplementation(
      (resource: string, action: string) =>
        resource === "catalogs" &&
        (action === "update" || action === "delete"),
    );

    renderDetail();

    expect(
      screen.queryByTestId("catalog-item-form-sheet"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: catalogsCopy.detail.addRecord }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Acciones" }));
    await user.click(
      screen.getByRole("menuitem", { name: catalogsCopy.itemActions.edit }),
    );

    expect(screen.getByTestId("catalog-item-form-sheet")).toBeInTheDocument();
    expect(screen.getByTestId("sheet-open")).toHaveTextContent("true");
    expect(screen.getByTestId("sheet-item")).toHaveTextContent("A1");
  });
});
