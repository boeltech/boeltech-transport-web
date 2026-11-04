import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/renderWithProviders";
import {
  grantPermissions,
  resetPermissionsMock,
} from "@/test/mocks/permissions";
import { resetAuthMock, setMockAuthUser } from "@/test/mocks/auth";
import { ClientOperationalCashPendingCard } from "./ClientOperationalCashPendingCard";
import { clientDetailCopy } from "../copy/clientDetailCopy";

const copy = clientDetailCopy.operationalCashPending;

const useOperationalCashPendingMock = vi.fn();

vi.mock("@features/auth", async () =>
  (await import("@/test/mocks/auth")).authModuleMock(),
);
vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

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

const CLIENT_ID = "client-a";

function pendingResult(overrides?: {
  pendingAmount?: number;
  tripCount?: number;
  trips?: Array<{
    id: string;
    code: string;
    pendingAmount: number;
  }>;
}) {
  const pendingAmount = overrides?.pendingAmount ?? 8500;
  const trips = overrides?.trips ?? [
    { id: "trip-1", code: "V-100", pendingAmount: 5000 },
    { id: "trip-2", code: "V-200", pendingAmount: 3500 },
  ];
  const tripCount = overrides?.tripCount ?? trips.length;

  return {
    data: {
      data: trips.map((t) => ({
        id: t.id,
        code: t.code,
        status: "completed" as const,
        clientId: CLIENT_ID,
        clientName: "Cliente Alpha",
        baseRate: t.pendingAmount,
        scheduledDeparture: "2026-11-01T12:00:00.000Z",
        operationalCash: {
          status: "pending" as const,
          collectedTotal: 0,
          pendingAmount: t.pendingAmount,
          receiptCount: 0,
        },
      })),
      meta: {
        totals: {
          pendingAmount,
          tripCount,
          clientCount: 1,
        },
        byClient: [
          {
            clientId: CLIENT_ID,
            clientName: "Cliente Alpha",
            pendingAmount,
            tripCount,
          },
        ],
        eligibility: {
          intent: "sin_cfdi_efectivo" as const,
          pendingGt: 0,
          statuses: ["scheduled", "in_progress", "completed"] as const,
        },
      },
      pagination: { page: 1, limit: 3, total: tripCount, totalPages: 1 },
    },
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    isFetching: false,
  };
}

describe("ClientOperationalCashPendingCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthMock();
    resetPermissionsMock();
    setMockAuthUser({ role: "admin" });
    grantPermissions(["finance.read"]);
    useOperationalCashPendingMock.mockReturnValue(pendingResult());
  });

  it("shows total, trip count and Ver efectivo sin factura deep-link when pending > 0", () => {
    renderWithProviders(
      <ClientOperationalCashPendingCard clientId={CLIENT_ID} />,
    );

    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(/\$8,500\.00/)).toBeInTheDocument();
    expect(screen.getByText(copy.tripsSummary(2))).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: copy.viewCtaAria });
    expect(cta).toHaveAttribute(
      "href",
      `/finance/operational-cash-pending?clientId=${CLIENT_ID}`,
    );
    expect(cta).toHaveTextContent(copy.viewCta);

    expect(
      screen.getByRole("link", { name: copy.openCostsAria("V-100") }),
    ).toHaveAttribute("href", "/trips/trip-1?tab=costs");
  });

  it("does not reuse Cobrar / cobros fiscal CTA", () => {
    renderWithProviders(
      <ClientOperationalCashPendingCard clientId={CLIENT_ID} />,
    );

    // Exact «Cobrar» fiscal (CreditExposureCard); no confligir con «Ver efectivo sin factura».
    expect(screen.queryByRole("link", { name: "Cobrar" })).toBeNull();
    expect(
      screen.queryByRole("link", { name: "Cobrar facturas de este cliente" }),
    ).toBeNull();
    expect(
      document.querySelector('a[href*="/finance/payments"]'),
    ).toBeNull();
  });

  it("hides when pending_amount is 0", () => {
    useOperationalCashPendingMock.mockReturnValue(
      pendingResult({ pendingAmount: 0, tripCount: 0, trips: [] }),
    );

    const { container } = renderWithProviders(
      <ClientOperationalCashPendingCard clientId={CLIENT_ID} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(copy.title)).toBeNull();
  });

  it("does not mount when user lacks finance.read", () => {
    grantPermissions("none");

    const { container } = renderWithProviders(
      <ClientOperationalCashPendingCard clientId={CLIENT_ID} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(useOperationalCashPendingMock).toHaveBeenCalledWith(
      expect.objectContaining({ clientId: CLIENT_ID }),
      expect.objectContaining({ enabled: false }),
    );
  });

  it("does not mount for client portal even with finance.read", () => {
    setMockAuthUser({ role: "client" });
    grantPermissions(["finance.read"], { role: "client" });

    const { container } = renderWithProviders(
      <ClientOperationalCashPendingCard clientId={CLIENT_ID} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
