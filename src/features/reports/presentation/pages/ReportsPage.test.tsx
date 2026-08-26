import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { ReportsPage } from "./ReportsPage";

const { permissionsState } = vi.hoisted(() => ({
  permissionsState: {
    hasPermission: (_module: string, _action?: string): boolean => true,
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => permissionsState,
}));

vi.mock("@features/finance", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/finance")>();
  return {
    ...actual,
    useAgingByClient: () => ({ data: [] }),
    useProfitabilityTrips: () => ({
      data: { data: [], pagination: { total: 0 } },
      isLoading: false,
    }),
    useExpensesByDimension: () => ({ data: [], isLoading: false }),
  };
});

vi.mock("../hooks/useExportTrips", () => ({
  useExportTrips: () => ({
    exportTrips: vi.fn(),
    isExporting: false,
  }),
}));

describe("ReportsPage", () => {
  beforeEach(() => {
    permissionsState.hasPermission = () => true;
  });

  it("renders business intelligence catalog entries for finance roles", () => {
    renderWithTheme(<ReportsPage />, { route: ["/reports"] });

    expect(
      screen.getByRole("heading", { name: "Inteligencia de negocio" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Rentabilidad y margen")).toBeInTheDocument();
    expect(screen.getByText("Cartera y cobranza")).toBeInTheDocument();
    expect(screen.getByText("Gastos por unidad, operador o ruta")).toBeInTheDocument();
    expect(screen.getByText("Operación y volumen de viajes")).toBeInTheDocument();
    expect(screen.getByText("Comparativa por sucursal")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Ver análisis/i }).length).toBeGreaterThanOrEqual(
      5,
    );
  });

  it("hides finance catalog entries for operational roles without finance.read", () => {
    permissionsState.hasPermission = (module: string, action?: string) => {
      if (module === "finance" && action === "read") return false;
      if (module === "reports" && action === "export") return false;
      return true;
    };

    renderWithTheme(<ReportsPage />, { route: ["/reports"] });

    expect(screen.queryByText("Rentabilidad y margen")).not.toBeInTheDocument();
    expect(screen.queryByText("Cartera y cobranza")).not.toBeInTheDocument();
    expect(screen.queryByText("Gastos por unidad, operador o ruta")).not.toBeInTheDocument();
    expect(screen.getByText("Operación y volumen de viajes")).toBeInTheDocument();
    expect(screen.getByText("Comparativa por sucursal")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Finanzas → Análisis/i }),
    ).not.toBeInTheDocument();
  });
});
