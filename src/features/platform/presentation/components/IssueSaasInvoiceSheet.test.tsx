import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IssueSaasInvoiceSheet } from "./IssueSaasInvoiceSheet";
import { platformCopy } from "../copy/platformCopy";
import { platformApi } from "../../infrastructure/platformApi";

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    getTenantReconciliationJson: vi.fn(),
    issueSaasInvoice: vi.fn(),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

const mockedApi = vi.mocked(platformApi);

function renderSheet(props?: Partial<Parameters<typeof IssueSaasInvoiceSheet>[0]>) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <IssueSaasInvoiceSheet
        tenantId="tenant-1"
        tenantLabel="Demo SA"
        open
        onOpenChange={vi.fn()}
        {...props}
      />
    </QueryClientProvider>,
  );
}

const copy = platformCopy.ar.issue;

describe("IssueSaasInvoiceSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-08-10T18:00:00.000Z"));
    mockedApi.getTenantReconciliationJson.mockResolvedValue({
      tenantId: "tenant-1",
      tenantName: "Demo SA",
      subdomain: "demo",
      periodKey: "2026-07",
      planCode: "operacion_crecimiento",
      planName: "Crecimiento",
      monthlyPriceCents: 150000,
      billingCycle: "monthly",
      status: "active",
      includedStamps: 380,
      stampsUsed: 400,
      overageStamps: 20,
      overagePriceCents: 1000,
      overageTotalCents: 20000,
      activeModules: [],
      modulesTotalCents: 0,
      subtotalCents: 170000,
      ivaCents: 27200,
      totalCents: 197200,
    });
    mockedApi.issueSaasInvoice.mockResolvedValue({
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
      daysOverdue: 0,
      createdAt: "2026-08-01T16:00:00.000Z",
      updatedAt: "2026-08-01T16:00:00.000Z",
      items: [],
      payments: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("defaults periodKey to last closed CDMX month when omitted", async () => {
    renderSheet();
    expect(await screen.findByLabelText(copy.periodKey)).toHaveValue("2026-07");
  });

  it("shows reconciliation preview and issues open cargo on submit", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onOpenChange = vi.fn();
    renderSheet({ onOpenChange, defaultPeriodKey: "2026-07" });

    await waitFor(() => {
      expect(mockedApi.getTenantReconciliationJson).toHaveBeenCalledWith(
        "tenant-1",
        "2026-07",
      );
    });

    expect(await screen.findByText(copy.total)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: copy.submit }));

    await waitFor(() => {
      expect(mockedApi.issueSaasInvoice).toHaveBeenCalledWith("tenant-1", {
        periodKey: "2026-07",
        status: "open",
        notes: null,
        dueDays: 14,
      });
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not treat the open month as issuable", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderSheet({ defaultPeriodKey: "2026-07" });

    const periodInput = await screen.findByLabelText(copy.periodKey);
    await user.clear(periodInput);
    await user.type(periodInput, "2026-08");

    expect(
      await screen.findByText(copy.periodKeyClosedOnly),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.submit })).toBeDisabled();
    expect(mockedApi.getTenantReconciliationJson).not.toHaveBeenCalledWith(
      "tenant-1",
      "2026-08",
    );
  });
});
