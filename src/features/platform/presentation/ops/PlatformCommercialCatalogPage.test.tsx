import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { PlatformCommercialCatalogPage } from "./PlatformCommercialCatalogPage";
import { opsCopy } from "./opsCopy";

vi.mock("../../application/hooks/usePlatformTenants", () => ({
  usePlatformPlans: () => ({
    data: [
      {
        code: "operacion_crecimiento",
        name: "Operación Crecimiento",
        isActive: true,
        bandQMin: 11,
        bandQMax: 30,
        stampsPerMotriz: 30,
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  usePlatformTenants: () => ({
    data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } },
    isLoading: false,
  }),
}));

vi.mock("../../application/hooks/usePlatformBilling", () => ({
  usePlatformModules: () => ({
    data: [{ code: "liquidaciones", name: "Liquidaciones" }],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  usePlatformStampPackCatalog: () => ({
    data: [
      {
        code: "pack_500",
        name: "Pack 500",
        stamps: 500,
        isActive: true,
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("PlatformCommercialCatalogPage", () => {
  it("lists plans with thead and Usar en empresa CTA", () => {
    renderWithTheme(<PlatformCommercialCatalogPage />, {
      route: ["/platform/plans"],
    });

    expect(
      screen.getByTestId("platform-commercial-catalog"),
    ).toBeInTheDocument();
    expect(screen.getByText(opsCopy.catalog.pricePending)).toBeInTheDocument();
    expect(screen.getByText("Operación Crecimiento")).toBeInTheDocument();
    const table = screen.getByTestId("ops-table");
    const heads = within(table).getAllByRole("columnheader");
    expect(heads.map((h) => h.textContent)).toEqual([
      opsCopy.catalog.columns.name,
      opsCopy.catalog.columns.code,
      opsCopy.catalog.columns.capacity,
      opsCopy.catalog.columns.stamps,
      opsCopy.catalog.columns.action,
    ]);
    expect(
      screen.getByRole("button", { name: opsCopy.catalog.useInTenant }),
    ).toBeInTheDocument();
  });

  it("shows Precio column on packs tab (not Acción)", async () => {
    const user = userEvent.setup();
    renderWithTheme(<PlatformCommercialCatalogPage />, {
      route: ["/platform/plans"],
    });

    await user.click(
      screen.getByRole("tab", { name: opsCopy.catalog.tabs.packs }),
    );

    const table = screen.getByTestId("ops-table");
    const heads = within(table).getAllByRole("columnheader");
    expect(heads.map((h) => h.textContent)).toEqual([
      opsCopy.catalog.columns.name,
      opsCopy.catalog.columns.code,
      opsCopy.catalog.columns.stamps,
      opsCopy.catalog.columns.price,
    ]);
    expect(screen.getByText("Pack 500")).toBeInTheDocument();
    expect(
      within(table).getByText(opsCopy.catalog.pricePending),
    ).toBeInTheDocument();
  });
});
