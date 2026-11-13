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
import { operationalReceiptBatchCopy } from "@features/finance/presentation/copy";

const copy = clientDetailCopy.operationalCashPending;
const batchCopy = operationalReceiptBatchCopy.card;

const useOperationalReceiptBatchCandidatesMock = vi.fn();

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
    useOperationalReceiptBatchCandidates: (
      ...args: Parameters<typeof actual.useOperationalReceiptBatchCandidates>
    ) => useOperationalReceiptBatchCandidatesMock(...args),
    useClientOperationalReceiptBatches: () => ({
      data: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } },
      isLoading: false,
      isError: false,
    }),
    useOperationalReceiptBatch: () => ({
      data: undefined,
      isLoading: false,
      isError: false,
    }),
  };
});

const CLIENT_ID = "client-a";

function candidatesResult(overrides?: {
  pendingAmount?: number;
  tripCount?: number;
  batchCount?: number;
  trips?: Array<{
    tripId: string;
    tripCode: string;
    pendingAmount: number;
  }>;
}) {
  const pendingAmount = overrides?.pendingAmount ?? 8500;
  const trips = overrides?.trips ?? [
    { tripId: "trip-1", tripCode: "V-100", pendingAmount: 5000 },
    { tripId: "trip-2", tripCode: "V-200", pendingAmount: 3500 },
  ];
  const tripCount = overrides?.tripCount ?? trips.length;

  return {
    data: {
      data: trips.map((t) => ({
        tripId: t.tripId,
        tripCode: t.tripCode,
        status: "completed" as const,
        scheduledDeparture: "2026-11-01T12:00:00.000Z",
        baseRate: t.pendingAmount,
        collectedTotal: 0,
        pendingAmount: t.pendingAmount,
      })),
      meta: {
        totals: { pendingAmount, tripCount },
        batchCount: overrides?.batchCount ?? 0,
        truncated: false,
      },
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
    grantPermissions(["finance.read", "operational_cash.create"]);
    useOperationalReceiptBatchCandidatesMock.mockReturnValue(
      candidatesResult(),
    );
  });

  it("shows total, trip count, lote CTA and bandeja deep-link when pending > 0", () => {
    renderWithProviders(
      <ClientOperationalCashPendingCard clientId={CLIENT_ID} />,
    );

    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(/\$8,500\.00/)).toBeInTheDocument();
    expect(screen.getByText(copy.tripsSummary(2))).toBeInTheDocument();

    const lote = screen.getByRole("link", {
      name: batchCopy.registerBatchAria,
    });
    expect(lote).toHaveAttribute(
      "href",
      `/clients/${CLIENT_ID}/operational-receipt-batches/new`,
    );

    const cta = screen.getByRole("link", { name: copy.viewCtaAria });
    expect(cta).toHaveAttribute(
      "href",
      `/finance/operational-cash-pending?clientId=${CLIENT_ID}`,
    );

    expect(
      screen.getByRole("link", { name: copy.openCostsAria("V-100") }),
    ).toHaveAttribute("href", "/trips/trip-1?tab=costs");
  });

  it("dispatcher with create sees card and lote CTA but not bandeja link", () => {
    grantPermissions(["operational_cash.create"], { role: "dispatcher" });
    setMockAuthUser({ role: "dispatcher" });

    renderWithProviders(
      <ClientOperationalCashPendingCard clientId={CLIENT_ID} />,
    );

    expect(
      screen.getByRole("link", { name: batchCopy.registerBatchAria }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: copy.viewCtaAria })).toBeNull();
  });

  it("shows card when pending is 0 but batch_count > 0", () => {
    useOperationalReceiptBatchCandidatesMock.mockReturnValue(
      candidatesResult({
        pendingAmount: 0,
        tripCount: 0,
        trips: [],
        batchCount: 2,
      }),
    );

    renderWithProviders(
      <ClientOperationalCashPendingCard clientId={CLIENT_ID} />,
    );

    expect(
      screen.getByRole("heading", { name: copy.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: batchCopy.listBatchesAria }),
    ).toBeInTheDocument();
  });

  it("hides when pending_amount is 0 and no batches", () => {
    useOperationalReceiptBatchCandidatesMock.mockReturnValue(
      candidatesResult({
        pendingAmount: 0,
        tripCount: 0,
        trips: [],
        batchCount: 0,
      }),
    );

    const { container } = renderWithProviders(
      <ClientOperationalCashPendingCard clientId={CLIENT_ID} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("does not mount when user lacks finance.read and operational_cash.create", () => {
    grantPermissions("none");

    const { container } = renderWithProviders(
      <ClientOperationalCashPendingCard clientId={CLIENT_ID} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(useOperationalReceiptBatchCandidatesMock).toHaveBeenCalledWith(
      CLIENT_ID,
      expect.objectContaining({ enabled: false }),
    );
  });

  it("does not mount for client portal", () => {
    setMockAuthUser({ role: "client" });
    grantPermissions(["finance.read"], { role: "client" });

    const { container } = renderWithProviders(
      <ClientOperationalCashPendingCard clientId={CLIENT_ID} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
