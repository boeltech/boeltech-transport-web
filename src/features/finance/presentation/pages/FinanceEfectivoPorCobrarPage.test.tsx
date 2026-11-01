import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, within } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { FinanceEfectivoPorCobrarPage } from "./FinanceEfectivoPorCobrarPage";
import { financeCopy } from "../copy";

const copy = financeCopy.efectivoPorCobrar;

const listMock = vi.fn();

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useQueryErrorToast: vi.fn(),
  };
});

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

describe("FinanceEfectivoPorCobrarPage", () => {
  beforeEach(() => {
    listMock.mockReset();
    listMock.mockReturnValue({
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
    });
  });

  it("renders title, client groups and Costos deep-links", () => {
    renderWithTheme(<FinanceEfectivoPorCobrarPage />, {
      route: ["/finance/efectivo-por-cobrar"],
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
      route: ["/finance/efectivo-por-cobrar?clientId=client-a"],
    });

    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: "client-a" }),
    );
    expect(
      screen.getByText(copy.clientChip("Cliente Alpha")),
    ).toBeInTheDocument();
  });

  it("shows operational empty copy (not Cobros empty)", () => {
    listMock.mockReturnValue({
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
    });

    renderWithTheme(<FinanceEfectivoPorCobrarPage />, {
      route: ["/finance/efectivo-por-cobrar"],
    });

    expect(screen.getByText(copy.empty.title)).toBeInTheDocument();
    expect(screen.getByText(copy.empty.description)).toBeInTheDocument();
    expect(
      screen.queryByText(financeCopy.cobros.workbench.emptyByBucket.open.title),
    ).not.toBeInTheDocument();
  });

  it("keeps Cobros page unreferenced in shell copy", () => {
    renderWithTheme(<FinanceEfectivoPorCobrarPage />, {
      route: ["/finance/efectivo-por-cobrar"],
    });
    const main = screen.getByRole("heading", { name: copy.title }).closest("div");
    expect(main).toBeTruthy();
    expect(
      within(document.body).queryByRole("heading", { name: "Cobros" }),
    ).not.toBeInTheDocument();
  });
});
