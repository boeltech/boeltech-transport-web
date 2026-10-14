import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import { headerCopy } from "../copy/headerCopy";
import { GlobalCommandMenu } from "./GlobalCommandMenu";

const navigationMock = vi.hoisted(() => {
  const Icon = () => null;
  return {
    navigation: [
      {
        id: "operations",
        title: "Operación",
        items: [
          {
            id: "dashboard",
            label: "Inicio",
            path: "/dashboard",
            icon: Icon,
          },
          {
            id: "trips",
            label: "Viajes",
            path: "/trips",
            icon: Icon,
          },
        ],
      },
      {
        id: "billing",
        title: "Facturación",
        items: [
          {
            id: "finance-invoices",
            label: "Facturas",
            path: "/finance/invoices",
            icon: Icon,
          },
        ],
      },
      {
        id: "fleet",
        title: "Flota",
        items: [
          {
            id: "vehicles",
            label: "Vehículos",
            path: "/vehicles",
            icon: Icon,
          },
        ],
      },
    ],
  };
});

vi.mock("@widgets/sidebar", () => ({
  useNavigation: () => navigationMock,
}));

vi.mock("@shared/permissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/permissions")>()),
  usePermissions: () => ({
    hasPermission: () => false,
    isLoading: false,
    isAuthenticated: true,
    role: "dispatcher",
  }),
}));

vi.mock("@features/trips", () => ({
  useTrips: () => ({ data: undefined, isFetching: false }),
}));

vi.mock("@features/finance/application", () => ({
  useFinanceInvoicesList: () => ({ data: undefined, isFetching: false }),
}));

vi.mock("@features/help-center", () => ({
  helpCenterCopy: {
    surfaces: { commandGroup: "Ayuda" },
  },
  trackHelpSearchPerformed: vi.fn(),
  truncateHelpPhrase: (phrase: string) => phrase,
  useHelpArticles: () => ({ data: [], isFetching: false }),
  useHelpPanelOptional: () => ({ openHelpPanel: vi.fn() }),
}));

describe("GlobalCommandMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Frecuentes when query is empty and omits items not in filtered nav", () => {
    renderWithProviders(
      <GlobalCommandMenu open onOpenChange={vi.fn()} />,
      { route: "/dashboard" },
    );

    expect(
      screen.getByText(headerCopy.commandMenu.groups.frequent),
    ).toBeInTheDocument();

    expect(screen.getByRole("option", { name: /Viajes/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Facturas/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Vehículos/i })).toBeInTheDocument();

    // Absent from mock nav → omitted from Frecuentes
    expect(
      screen.queryByRole("option", { name: /Por facturar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Aprobaciones/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: /Clientes/i }),
    ).not.toBeInTheDocument();

    // Frequent ids are not duplicated under their original groups
    const operationsHeading = screen.getByText("Operación");
    const operationsGroup = operationsHeading.closest("[cmdk-group]");
    expect(operationsGroup).toBeTruthy();
    expect(
      within(operationsGroup as HTMLElement).queryByRole("option", {
        name: /Viajes/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(operationsGroup as HTMLElement).getByRole("option", {
        name: /Inicio/i,
      }),
    ).toBeInTheDocument();
  });
});
