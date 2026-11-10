/**
 * Smoke — Efectivo sin factura (ADR-0096 addendum lectura + F3 chrome Conform).
 * Nav Cobranza: hermano de Facturas a crédito → bandeja mock → deep-link Costos;
 * card cliente → bandeja ?clientId=; KPI/related/columna. Sin backend.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { OperationalCashPendingResult } from "@features/finance/domain";
import {
  FINANCE_COBROS_PATH,
  FINANCE_EFECTIVO_POR_COBRAR_PATH,
  buildFinanceEfectivoPorCobrarPath,
  buildTripCostsHref,
} from "@features/finance/application";
import { FinanceEfectivoPorCobrarPage } from "@features/finance/presentation/pages/FinanceEfectivoPorCobrarPage";
import { financeCopy } from "@features/finance/presentation/copy";
import { ClientOperationalCashPendingCard } from "@features/clients/presentation/components/ClientOperationalCashPendingCard";
import { clientDetailCopy } from "@features/clients/presentation/copy/clientDetailCopy";
import { navigationConfig } from "@widgets/sidebar/model/navigation";
import { navigationCopy } from "@widgets/sidebar/copy/navigationCopy";

Element.prototype.hasPointerCapture ??= () => false;

const copy = financeCopy.efectivoPorCobrar;
const cardCopy = clientDetailCopy.operationalCashPending;

const useOperationalCashPendingMock = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "admin",
    can: () => true,
    hasRole: () => true,
  }),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: { id: "u-1", role: "admin", tenantId: "t-1" },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
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
    ],
    isLoading: false,
  }),
}));

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useOperationalCashPending: (
      ...args: Parameters<typeof actual.useOperationalCashPending>
    ) => useOperationalCashPendingMock(...args),
  };
});

const CLIENT_A = "client-a";
const CLIENT_B = "client-b";

function pendingListResult(): OperationalCashPendingResult {
  return {
    data: [
      {
        id: "trip-1",
        code: "V-100",
        status: "completed",
        clientId: CLIENT_A,
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
        clientId: CLIENT_B,
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
          clientId: CLIENT_A,
          clientName: "Cliente Alpha",
          pendingAmount: 10000,
          tripCount: 1,
        },
        {
          clientId: CLIENT_B,
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
  };
}

function pendingClientResult(): OperationalCashPendingResult {
  const full = pendingListResult();
  const trips = full.data.filter((t) => t.clientId === CLIENT_A);
  return {
    data: trips,
    meta: {
      totals: {
        pendingAmount: 10000,
        tripCount: 1,
        clientCount: 1,
      },
      byClient: full.meta.byClient.filter((c) => c.clientId === CLIENT_A),
      eligibility: full.meta.eligibility,
    },
    pagination: { page: 1, limit: 3, total: 1, totalPages: 1 },
  };
}

function hookResult(data: OperationalCashPendingResult) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  };
}

function TestProviders({
  children,
  initialEntry = FINANCE_EFECTIVO_POR_COBRAR_PATH,
}: {
  children: ReactNode;
  initialEntry?: string;
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
}

function renderBandeja(initialEntry = FINANCE_EFECTIVO_POR_COBRAR_PATH) {
  return render(
    <TestProviders initialEntry={initialEntry}>
      <Routes>
        <Route
          path={FINANCE_EFECTIVO_POR_COBRAR_PATH}
          element={<FinanceEfectivoPorCobrarPage />}
        />
        <Route
          path="/trips/:tripId"
          element={<div data-testid="trip-costs-stub">Costos</div>}
        />
      </Routes>
    </TestProviders>,
  );
}

describe("smoke: efectivo-por-cobrar", () => {
  beforeEach(() => {
    useOperationalCashPendingMock.mockReset();
    useOperationalCashPendingMock.mockReturnValue(
      hookResult(pendingListResult()),
    );
  });

  it("nav Cobranza tiene Cobros sin factura como hermano de Facturas a crédito", () => {
    const billing = navigationConfig.find((group) => group.id === "billing");
    const collections = navigationConfig.find(
      (group) => group.id === "collections",
    );
    expect(collections).toBeDefined();
    expect(collections?.title).toBe("Cobranza");
    expect(
      billing?.items.some((item) => item.id === "finance-cobros"),
    ).toBe(false);
    expect(
      billing?.items.some(
        (item) => item.id === "finance-efectivo-por-cobrar",
      ),
    ).toBe(false);

    const cobrosIdx = collections!.items.findIndex(
      (item) => item.id === "finance-cobros",
    );
    const efectivoIdx = collections!.items.findIndex(
      (item) => item.id === "finance-efectivo-por-cobrar",
    );

    expect(cobrosIdx).toBeGreaterThanOrEqual(0);
    expect(efectivoIdx).toBe(cobrosIdx + 1);

    const efectivo = collections!.items[efectivoIdx];
    expect(efectivo?.label).toBe(navigationCopy.item.financeEfectivoPorCobrar);
    expect(efectivo?.label).toBe("Cobros sin factura");
    expect(efectivo?.path).toBe(FINANCE_EFECTIVO_POR_COBRAR_PATH);
    expect(efectivo?.module).toBe("finance");
    expect(efectivo?.action).toBe("read");

    const cobros = collections!.items[cobrosIdx];
    expect(cobros?.label).toBe(navigationCopy.item.financeCobros);
    expect(cobros?.label).toBe("Facturas a crédito");
    expect(cobros?.path).toBe(FINANCE_COBROS_PATH);
    expect(cobros?.path).not.toBe(FINANCE_EFECTIVO_POR_COBRAR_PATH);
  });

  it("bandeja agrupa por cliente, muestra filas y deep-link a Costos", () => {
    renderBandeja();

    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.channelHint)).toBeInTheDocument();
    expect(screen.getByText(copy.totals.pending)).toBeInTheDocument();
    expect(screen.getByText(copy.totals.trips)).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Cliente Alpha" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Cliente Beta" }),
    ).toBeInTheDocument();

    expect(screen.getByText("V-100")).toBeInTheDocument();
    expect(screen.getByText("V-200")).toBeInTheDocument();
    expect(
      screen.getAllByRole("columnheader", { name: copy.columns.pending })
        .length,
    ).toBeGreaterThan(0);
    expect(copy.columns.pending).toBe("Saldo");
    expect(
      screen.queryByRole("columnheader", { name: "Por cobrar" }),
    ).not.toBeInTheDocument();

    const openCostsA = screen.getByRole("link", {
      name: copy.openCostsAria("V-100"),
    });
    expect(openCostsA).toHaveAttribute("href", buildTripCostsHref("trip-1"));
    expect(openCostsA).toHaveAttribute("href", "/trips/trip-1?tab=costs");

    const openCostsB = screen.getByRole("link", {
      name: copy.openCostsAria("V-200"),
    });
    expect(openCostsB).toHaveAttribute("href", buildTripCostsHref("trip-2"));

    expect(
      screen.queryByRole("heading", { name: "Facturas a crédito" }),
    ).not.toBeInTheDocument();

    const related = screen.getByRole("link", {
      name: copy.relatedConfig.label,
    });
    expect(related).toHaveAttribute("href", FINANCE_COBROS_PATH);
  });

  it("chrome vacío: KPI en ceros + filtro usable + empty operativo", async () => {
    useOperationalCashPendingMock.mockReturnValue(
      hookResult({
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
      }),
    );

    const user = userEvent.setup();
    renderBandeja();

    expect(screen.getByText(copy.channelHint)).toBeInTheDocument();
    expect(screen.getByText(copy.totals.pending)).toBeInTheDocument();
    expect(screen.getByText(copy.totals.trips)).toBeInTheDocument();
    expect(screen.getByLabelText("Actualizar lista")).toBeInTheDocument();
    expect(screen.getByText(copy.empty.title)).toBeInTheDocument();
    expect(screen.queryByText("Nada por cobrar")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("combobox", { name: copy.clientFilterLabel }),
    );
    await user.click(
      await screen.findByRole("option", { name: "Cliente Alpha" }),
    );

    expect(useOperationalCashPendingMock).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: CLIENT_A }),
    );
  });

  it("deep-link ?clientId= filtra la bandeja vía hook", () => {
    useOperationalCashPendingMock.mockReturnValue(
      hookResult(pendingClientResult()),
    );

    renderBandeja(buildFinanceEfectivoPorCobrarPath(CLIENT_A));

    expect(useOperationalCashPendingMock).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: CLIENT_A }),
    );
    expect(
      screen.getByText(copy.clientChip("Cliente Alpha")),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Cliente Alpha" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Cliente Beta" }),
    ).not.toBeInTheDocument();
  });

  it("card cliente con saldo enlaza a bandeja ?clientId= (no Cobros)", () => {
    useOperationalCashPendingMock.mockReturnValue(
      hookResult(pendingClientResult()),
    );

    render(
      <TestProviders initialEntry={`/clients/${CLIENT_A}`}>
        <ClientOperationalCashPendingCard clientId={CLIENT_A} />
      </TestProviders>,
    );

    expect(
      screen.getByRole("heading", { name: cardCopy.title }),
    ).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: cardCopy.viewCtaAria });
    expect(cta).toHaveAttribute(
      "href",
      buildFinanceEfectivoPorCobrarPath(CLIENT_A),
    );
    expect(cta).toHaveTextContent(cardCopy.viewCta);

    expect(screen.queryByRole("link", { name: "Cobrar" })).toBeNull();
    expect(
      document.querySelector(`a[href*="${FINANCE_COBROS_PATH}"]`),
    ).toBeNull();
  });
});
