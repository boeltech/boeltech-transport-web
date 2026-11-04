import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { FINANCE_COBROS_PATH } from "@features/finance/application";
import { FinanceEfectivoPorCobrarPage } from "./FinanceEfectivoPorCobrarPage";
import { financeCopy } from "../copy";

Element.prototype.hasPointerCapture ??= () => false;

const copy = financeCopy.efectivoPorCobrar;

const listMock = vi.fn();

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useQueryErrorToast: vi.fn(),
  };
});

vi.mock("@features/clients/application", () => ({
  useActiveClients: () => ({
    data: [
      {
        id: "client-a",
        legalName: "Cliente Alpha SA",
        tradeName: "Cliente Alpha",
      },
      {
        id: "client-b",
        legalName: "Cliente Beta SA",
        tradeName: "Cliente Beta",
      },
      {
        id: "client-c",
        legalName: "Cliente Gamma SA",
        tradeName: "Cliente Gamma",
      },
    ],
    isLoading: false,
  }),
}));

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useOperationalCashPending: (params: {
      page?: number;
      clientId?: string | null;
    }) => listMock(params),
  };
});

function pendingListHook() {
  return {
    data: {
      data: [
        {
          id: "trip-1",
          code: "V-100",
          status: "completed",
          clientId: "client-a",
          clientName: "Cliente Alpha",
          baseRate: 10000,
          scheduledDeparture: "2026-11-01T12:00:00.000Z",
          operationalCash: {
            status: "pending",
            collectedTotal: 0,
            pendingAmount: 10000,
            receiptCount: 0,
          },
        },
        {
          id: "trip-2",
          code: "V-200",
          status: "in_progress",
          clientId: "client-b",
          clientName: "Cliente Beta",
          baseRate: 5000,
          scheduledDeparture: "2026-11-02T12:00:00.000Z",
          operationalCash: {
            status: "partial",
            collectedTotal: 2000,
            pendingAmount: 3000,
            receiptCount: 1,
          },
        },
      ],
      meta: {
        totals: {
          pendingAmount: 13000,
          tripCount: 2,
          clientCount: 2,
        },
        byClient: [
          {
            clientId: "client-a",
            clientName: "Cliente Alpha",
            pendingAmount: 10000,
            tripCount: 1,
          },
          {
            clientId: "client-b",
            clientName: "Cliente Beta",
            pendingAmount: 3000,
            tripCount: 1,
          },
        ],
        eligibility: {
          intent: "sin_cfdi_efectivo",
          pendingGt: 0,
          statuses: ["scheduled", "in_progress", "completed"],
        },
      },
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  };
}

function emptyListHook() {
  return {
    data: {
      data: [],
      meta: {
        totals: { pendingAmount: 0, tripCount: 0, clientCount: 0 },
        byClient: [],
        eligibility: {
          intent: "sin_cfdi_efectivo",
          pendingGt: 0,
          statuses: ["scheduled", "in_progress", "completed"],
        },
      },
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  };
}

describe("FinanceEfectivoPorCobrarPage", () => {
  beforeEach(() => {
    listMock.mockReset();
    listMock.mockReturnValue(pendingListHook());
  });

  it("renders title, client groups and Costos deep-links", () => {
    renderWithTheme(<FinanceEfectivoPorCobrarPage />, {
      route: ["/finance/operational-cash-pending"],
    });

    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.channelHint)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cliente Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cliente Beta" })).toBeInTheDocument();

    const linkA = screen.getByRole("link", {
      name: copy.openCostsAria("V-100"),
    });
    expect(linkA).toHaveAttribute("href", "/trips/trip-1?tab=costs");

    const linkB = screen.getByRole("link", {
      name: copy.openCostsAria("V-200"),
    });
    expect(linkB).toHaveAttribute("href", "/trips/trip-2?tab=costs");
  });

  it("passes clientId from query to the hook", () => {
    renderWithTheme(<FinanceEfectivoPorCobrarPage />, {
      route: ["/finance/operational-cash-pending?clientId=client-a"],
    });

    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "client-a" }),
    );
    expect(
      screen.getByText(copy.clientChip("Cliente Alpha")),
    ).toBeInTheDocument();
  });

  it("keeps KPI strip with zeros when empty (chrome estable)", () => {
    listMock.mockReturnValue(emptyListHook());

    renderWithTheme(<FinanceEfectivoPorCobrarPage />, {
      route: ["/finance/operational-cash-pending"],
    });

    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.channelHint)).toBeInTheDocument();
    expect(screen.getByText(copy.totals.pending)).toBeInTheDocument();
    expect(screen.getByText(copy.totals.trips)).toBeInTheDocument();
    expect(screen.getByText(copy.totals.clients)).toBeInTheDocument();
    expect(screen.getByLabelText("Actualizar lista")).toBeInTheDocument();
    expect(screen.getByText(copy.empty.title)).toBeInTheDocument();
    expect(screen.queryByText("Nada por cobrar")).not.toBeInTheDocument();
  });

  it("shows operational empty copy (not Cobros empty)", () => {
    listMock.mockReturnValue(emptyListHook());

    renderWithTheme(<FinanceEfectivoPorCobrarPage />, {
      route: ["/finance/operational-cash-pending"],
    });

    expect(screen.getByText(copy.empty.title)).toBeInTheDocument();
    expect(screen.getByText(copy.empty.description)).toBeInTheDocument();
    expect(
      screen.queryByText(financeCopy.cobros.workbench.emptyByBucket.open.title),
    ).not.toBeInTheDocument();
  });

  it("shows filtered empty copy when client filter has no rows", () => {
    listMock.mockReturnValue(emptyListHook());

    renderWithTheme(<FinanceEfectivoPorCobrarPage />, {
      route: ["/finance/operational-cash-pending?clientId=client-c"],
    });

    expect(screen.getByText(copy.emptyFiltered.title)).toBeInTheDocument();
    expect(screen.getByText(copy.emptyFiltered.description)).toBeInTheDocument();
    expect(screen.queryByText(copy.empty.title)).not.toBeInTheDocument();
  });

  it("allows filtering by client from toolbar Select", async () => {
    const user = userEvent.setup();
    renderWithTheme(<FinanceEfectivoPorCobrarPage />, {
      route: ["/finance/operational-cash-pending"],
    });

    await user.click(
      screen.getByRole("combobox", { name: copy.clientFilterLabel }),
    );
    await user.click(
      await screen.findByRole("option", { name: "Cliente Gamma" }),
    );

    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "client-c" }),
    );
  });

  it("clears client filter from Limpiar filtros", async () => {
    const user = userEvent.setup();
    renderWithTheme(<FinanceEfectivoPorCobrarPage />, {
      route: ["/finance/operational-cash-pending?clientId=client-a"],
    });

    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "client-a" }),
    );

    await user.click(screen.getByRole("button", { name: "Limpiar filtros" }));

    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: null }),
    );
  });

  it("links relatedConfig to Facturas a crédito", () => {
    renderWithTheme(<FinanceEfectivoPorCobrarPage />, {
      route: ["/finance/operational-cash-pending"],
    });

    const related = screen.getByRole("link", {
      name: copy.relatedConfig.label,
    });
    expect(related).toHaveAttribute("href", FINANCE_COBROS_PATH);
    expect(related).toHaveTextContent("Facturas a crédito");
    expect(screen.getByText(copy.relatedConfig.description)).toBeInTheDocument();
  });

  it("uses Saldo column label (not Por cobrar)", () => {
    renderWithTheme(<FinanceEfectivoPorCobrarPage />, {
      route: ["/finance/operational-cash-pending"],
    });

    const headers = screen.getAllByRole("columnheader", { name: copy.columns.pending });
    expect(headers.length).toBeGreaterThan(0);
    expect(copy.columns.pending).toBe("Saldo");
    expect(
      screen.queryByRole("columnheader", { name: "Por cobrar" }),
    ).not.toBeInTheDocument();
  });

  it("keeps page title Efectivo sin factura (not Facturas a crédito heading)", () => {
    renderWithTheme(<FinanceEfectivoPorCobrarPage />, {
      route: ["/finance/operational-cash-pending"],
    });
    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(copy.title).toBe("Efectivo sin factura");
    expect(
      within(document.body).queryByRole("heading", {
        name: "Facturas a crédito",
      }),
    ).not.toBeInTheDocument();
  });
});
