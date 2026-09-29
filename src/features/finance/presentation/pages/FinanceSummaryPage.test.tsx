import { describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { financeCopy } from "../copy";
import { FinanceSummaryPage } from "./FinanceSummaryPage";

const { mockAuthRole } = vi.hoisted(() => ({
  mockAuthRole: vi.fn(() => "accountant"),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({ user: { id: "u-1", role: mockAuthRole() } }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useFinanceSummary: () => ({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    }),
    useAccountStatement: () => ({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    }),
    useAgingSummary: () => ({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    }),
    useAgingByClient: () => ({ data: [] }),
  };
});

describe("FinanceSummaryPage", () => {
  it("renderiza Cartera con stepper de ciclo y sin tabs", () => {
    mockAuthRole.mockReturnValue("accountant");
    renderWithTheme(<FinanceSummaryPage />, { route: ["/finance"] });

    expect(
      screen.getByRole("heading", { name: financeCopy.page.hub.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.page.hub.description),
    ).toBeInTheDocument();
    expect(
      screen.getByText(financeCopy.page.hub.orientationAccountant),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(financeCopy.page.hub.orientation),
    ).not.toBeInTheDocument();
    expect(financeCopy.page.hub.orientationAccountant).not.toMatch(
      /Aprobar|Liquidaciones|SaaS/i,
    );

    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();

    const cycle = screen.getByRole("navigation", {
      name: financeCopy.page.hub.cycle.ariaLabel,
    });
    expect(
      within(cycle).getByRole("link", { name: "Emitir: Por facturar" }),
    ).toHaveAttribute("href", "/finance/invoiceable");
    expect(
      within(cycle).getByRole("link", { name: "Enviar: Envíos" }),
    ).toHaveAttribute("href", "/finance/dispatch");
    expect(
      within(cycle).getByRole("link", { name: "Cobrar: Cobros" }),
    ).toHaveAttribute("href", "/finance/cobros");
    expect(
      within(cycle).getByRole("link", { name: "Aprobar: Aprobaciones" }),
    ).toHaveAttribute("href", "/finance/approvals");
    expect(
      within(cycle).queryByRole("link", { name: /Facturas/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Volver a reportes" }),
    ).not.toBeInTheDocument();
  });

  it("manager: una línea de saldos, sin copy accountant", () => {
    mockAuthRole.mockReturnValue("manager");
    renderWithTheme(<FinanceSummaryPage />, { route: ["/finance"] });

    expect(
      screen.getByText(financeCopy.page.hub.orientationManager),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(financeCopy.page.hub.orientationAccountant),
    ).not.toBeInTheDocument();
    expect(financeCopy.page.hub.orientationManager).not.toMatch(
      /Aprobar|Liquidaciones|SaaS/i,
    );
  });

  it("muestra Volver a reportes cuando se llegó desde el hub", () => {
    mockAuthRole.mockReturnValue("accountant");
    renderWithTheme(<FinanceSummaryPage />, {
      route: [{ pathname: "/finance", state: { from: "/reports" } }],
    });

    expect(
      screen.getByRole("link", { name: "Volver a reportes" }),
    ).toHaveAttribute("href", "/reports");
  });
});
