import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
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
    data: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}));

describe("PlatformCommercialCatalogPage", () => {
  it("lists plans with Usar en empresa CTA and price pending copy", () => {
    renderWithTheme(<PlatformCommercialCatalogPage />, {
      route: ["/platform/plans"],
    });

    expect(
      screen.getByTestId("platform-commercial-catalog"),
    ).toBeInTheDocument();
    expect(screen.getByText(opsCopy.catalog.pricePending)).toBeInTheDocument();
    expect(screen.getByText("Operación Crecimiento")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: opsCopy.catalog.useInTenant }),
    ).toBeInTheDocument();
  });
});
