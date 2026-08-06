import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TenantSaasArCard } from "./TenantSaasArCard";
import { platformCopy } from "../copy/platformCopy";
import { formatBillingPeriodKey } from "../utils/platformBillingFormatters";
import { platformApi } from "../../infrastructure/platformApi";

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    listTenantSaasInvoices: vi.fn(),
    downloadTenantReconciliationCsv: vi.fn(),
    getTenantReconciliationJson: vi.fn(),
    issueSaasInvoice: vi.fn(),
  },
}));

const toastMock = vi.fn();
vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: toastMock }),
  };
});

const mockedApi = vi.mocked(platformApi);

function renderCard(canMutate: boolean) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TenantSaasArCard
          tenantId="tenant-1"
          tenantLabel="Demo"
          canMutate={canMutate}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TenantSaasArCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-08-10T18:00:00.000Z"));
    mockedApi.listTenantSaasInvoices.mockResolvedValue([
      {
        id: "inv-1",
        tenantId: "tenant-1",
        subscriptionId: "sub-1",
        periodKey: "2026-07",
        periodStart: "2026-07-01T06:00:00.000Z",
        periodEnd: "2026-08-01T06:00:00.000Z",
        status: "open",
        currency: "MXN",
        planCode: "operacion_crecimiento",
        stampsIncluded: 380,
        stampsUsed: 400,
        stampsOverage: 20,
        subtotalCents: 170000,
        taxCents: 27200,
        totalCents: 197200,
        amountDueCents: 197200,
        amountPaidCents: 0,
        issuedAt: "2026-08-01T16:00:00.000Z",
        dueDate: "2026-08-15T16:00:00.000Z",
        paidAt: null,
        voidedAt: null,
        voidReason: null,
        notes: null,
        daysOverdue: 2,
        createdAt: "2026-08-01T16:00:00.000Z",
        updatedAt: "2026-08-01T16:00:00.000Z",
      },
    ]);
    mockedApi.downloadTenantReconciliationCsv.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("hides emitir / pagar / anular when canMutate is false", async () => {
    renderCard(false);

    expect(
      await screen.findByText(formatBillingPeriodKey("2026-07")),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: platformCopy.ar.actions.issue }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: platformCopy.ar.actions.markPaid,
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: platformCopy.ar.actions.void }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: platformCopy.ar.actions.viewAr }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: platformCopy.ar.card.exportClose,
      }),
    ).toBeInTheDocument();
  });

  it("shows mutation CTAs for platform owner", async () => {
    renderCard(true);

    expect(
      await screen.findByText(formatBillingPeriodKey("2026-07")),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: platformCopy.ar.actions.issue,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: platformCopy.ar.actions.markPaid }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: platformCopy.ar.actions.void }),
    ).toBeInTheDocument();
  });

  it("defaults close period to last closed month and exports CSV", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCard(true);

    const periodInput = await screen.findByLabelText(
      platformCopy.ar.card.closePeriodLabel,
    );
    expect(periodInput).toHaveValue("2026-07");

    await user.click(
      screen.getByRole("button", {
        name: platformCopy.ar.card.exportClose,
      }),
    );

    await waitFor(() => {
      expect(mockedApi.downloadTenantReconciliationCsv).toHaveBeenCalledWith(
        "tenant-1",
        "2026-07",
      );
    });
  });

  it("opens Nuevo cobro with the selected closed export period", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockedApi.getTenantReconciliationJson.mockResolvedValue({
      tenantId: "tenant-1",
      tenantName: "Demo",
      subdomain: "demo",
      periodKey: "2026-06",
      planCode: "operacion_crecimiento",
      planName: "Crecimiento",
      monthlyPriceCents: 150000,
      billingCycle: "monthly",
      status: "active",
      includedStamps: 380,
      stampsUsed: 10,
      overageStamps: 0,
      overagePriceCents: 1000,
      overageTotalCents: 0,
      activeModules: [],
      modulesTotalCents: 0,
      subtotalCents: 150000,
      ivaCents: 24000,
      totalCents: 174000,
    });

    renderCard(true);

    const periodInput = await screen.findByLabelText(
      platformCopy.ar.card.closePeriodLabel,
    );
    await user.clear(periodInput);
    await user.type(periodInput, "2026-06");

    await user.click(
      screen.getByRole("button", { name: platformCopy.ar.actions.issue }),
    );

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByRole("dialog").querySelector("#periodKey")).toHaveValue(
      "2026-06",
    );
  });

  it("blocks close export for open month", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderCard(true);

    const periodInput = await screen.findByLabelText(
      platformCopy.ar.card.closePeriodLabel,
    );
    await user.clear(periodInput);
    await user.type(periodInput, "2026-08");

    await user.click(
      screen.getByRole("button", {
        name: platformCopy.ar.card.exportClose,
      }),
    );

    expect(mockedApi.downloadTenantReconciliationCsv).not.toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: platformCopy.ar.card.exportCloseError,
        description: platformCopy.ar.card.exportCloseNotClosed,
      }),
    );
  });
});
