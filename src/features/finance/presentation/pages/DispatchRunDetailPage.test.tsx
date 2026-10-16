import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@shared/ui/tooltip";
import type { BillingDispatchRun } from "../../domain/billingDispatchRun.types";
import { DispatchRunDetailPage } from "./DispatchRunDetailPage";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

const mocks = vi.hoisted(() => ({
  refetch: vi.fn(),
  previewMutateAsync: vi.fn(),
  confirmMutateAsync: vi.fn(),
  hasPermission: vi.fn((_module: string, _action: string) => true),
  run: null as BillingDispatchRun | null,
  isError: false,
  isLoading: false,
}));

vi.mock("@shared/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/permissions")>();
  return {
    ...actual,
    usePermissions: () => ({
      hasPermission: mocks.hasPermission,
      isLoading: false,
      isAuthenticated: true,
      role: "admin",
      can: () => true,
      hasRole: () => true,
    }),
  };
});

vi.mock("@features/settings/application/hooks/useBillingSchemes", () => ({
  useBillingSchemes: () => ({
    data: [
      {
        id: "scheme-1",
        name: "Corte semanal",
        cadenceKind: "periodic_weekly",
        params: { weekdays: [4, 5] },
        isDefault: true,
        isActive: true,
      },
    ],
    isLoading: false,
  }),
}));

vi.mock("../../application/hooks/useBillingDispatchRuns", () => ({
  useBillingDispatchRun: () => ({
    data: mocks.run ?? undefined,
    isLoading: mocks.isLoading,
    isError: mocks.isError,
    refetch: mocks.refetch,
  }),
  usePreviewBillingDispatchRun: () => ({
    mutateAsync: mocks.previewMutateAsync,
    isPending: false,
  }),
  useConfirmSendBillingDispatchRun: () => ({
    mutateAsync: mocks.confirmMutateAsync,
    isPending: false,
  }),
  useCancelBillingDispatchRun: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("../components/FinanceDispatchCreateRunDialog", () => ({
  FinanceDispatchCreateRunDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-run-dialog" /> : null,
}));

const baseRun: BillingDispatchRun = {
  id: "run-1",
  tenantId: "tenant-1",
  billingSchemeId: "scheme-1",
  periodStart: "2026-08-01T06:00:00.000Z",
  periodEnd: "2026-08-08T06:00:00.000Z",
  anchorKind: "trip_completed",
  origin: "manual",
  status: "previewed",
  previewedAt: "2026-08-08T12:00:00.000Z",
  sendConfirmedAt: null,
  sendConfirmedBy: null,
  completedAt: null,
  failedAt: null,
  errorSummary: null,
  createdBy: "user-1",
  createdAt: "2026-08-08T12:00:00.000Z",
  updatedAt: "2026-08-08T12:00:00.000Z",
  windowKind: "calendar_cut",
  cadenceKind: "periodic_weekly",
  inclusiveStart: "2026-08-01",
  inclusiveEnd: "2026-08-07",
  cutDate: "2026-08-08",
  windowHours: null,
  summary: {
    pendingStampCount: 0,
    readyToSendCount: 0,
    alreadySentSkipped: 0,
  },
  recipientsByClient: [],
  clientReceipts: null,
  items: [],
};

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <TooltipProvider delayDuration={0}>
        <MemoryRouter initialEntries={["/finance/dispatch/run-1"]}>
          <Routes>
            <Route path="/finance/dispatch/:id" element={children} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
  return render(<DispatchRunDetailPage />, { wrapper });
}

describe("DispatchRunDetailPage F3", () => {
  beforeEach(() => {
    mocks.run = null;
    mocks.isError = false;
    mocks.isLoading = false;
    mocks.refetch.mockReset();
    mocks.previewMutateAsync.mockReset();
    mocks.confirmMutateAsync.mockReset();
    mocks.hasPermission.mockReset().mockImplementation(
      (module: string, action: string) =>
        module === "invoices" && (action === "execute" || action === "read"),
    );
  });

  it("empty-scheduled: CTA Armar en DetailAlertCard.action", async () => {
    const user = userEvent.setup();
    mocks.run = {
      ...baseRun,
      origin: "scheduled",
      status: "cancelled",
    };
    renderPage();

    expect(
      screen.getByText(dispatchRunsCopy.detail.emptyScheduledAlert.title),
    ).toBeInTheDocument();
    const cta = screen.getByRole("button", {
      name: dispatchRunsCopy.detail.emptyScheduledAlert.cta,
    });
    expect(cta).toBeInTheDocument();
    await user.click(cta);
    expect(screen.getByTestId("create-run-dialog")).toBeInTheDocument();
  });

  it("error de carga usa DetailAlertCard con Reintentar en action", async () => {
    const user = userEvent.setup();
    mocks.isError = true;
    renderPage();

    expect(
      screen.getByText(dispatchRunsCopy.detail.loadErrorTitle),
    ).toBeInTheDocument();
    const retry = screen.getByRole("button", {
      name: dispatchRunsCopy.detail.retry,
    });
    await user.click(retry);
    expect(mocks.refetch).toHaveBeenCalled();
  });

  it("fallido recuperable: CTA Armar en action", async () => {
    const user = userEvent.setup();
    mocks.run = {
      ...baseRun,
      status: "failed",
      errorSummary: "SMTP timeout",
      failedAt: "2026-08-08T13:00:00.000Z",
    };
    renderPage();

    expect(
      screen.getByText(dispatchRunsCopy.detail.result.error),
    ).toBeInTheDocument();
    expect(screen.getByText("SMTP timeout")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.detail.emptyScheduledAlert.cta,
      }),
    );
    expect(screen.getByTestId("create-run-dialog")).toBeInTheDocument();
  });

  it("monta DispatchRunSendResults tras envío completado", () => {
    mocks.run = {
      ...baseRun,
      status: "completed",
      completedAt: "2026-08-08T14:00:00.000Z",
      summary: {
        pendingStampCount: 0,
        readyToSendCount: 1,
        alreadySentSkipped: 0,
      },
      clientReceipts: [
        {
          clientId: "client-1",
          status: "sent",
          errorMessage: null,
          emailMessageId: "msg-1",
          sentAt: "2026-08-08T14:00:00.000Z",
          createdAt: "2026-08-08T14:00:00.000Z",
          updatedAt: "2026-08-08T14:00:00.000Z",
          recipients: [
            {
              key: "billing_email",
              kind: "billing_email",
              label: "Correo de facturación",
              email: "facturas@demo.test",
            },
          ],
        },
      ],
      items: [
        {
          id: "item-1",
          itemKind: "ready_to_send",
          tripId: "trip-1",
          invoiceId: "inv-1",
          billingScope: "primary_transport",
          clientId: "client-1",
          clientName: "Cliente Demo",
          status: "sent",
          folio: "A-100",
          emailMessageId: "msg-1",
          errorMessage: null,
          sentAt: "2026-08-08T14:00:00.000Z",
          createdAt: "2026-08-08T12:00:00.000Z",
          updatedAt: "2026-08-08T14:00:00.000Z",
        },
      ],
    };
    renderPage();

    expect(
      screen.getByText(dispatchRunsCopy.detail.result.byClientTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dispatchRunsCopy.detail.result.byClientDescription),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Cliente Demo/).length).toBeGreaterThan(0);
  });

  it("confirmación de envío usa AlertDialog con una primaria Confirmar", async () => {
    const user = userEvent.setup();
    mocks.run = {
      ...baseRun,
      summary: {
        pendingStampCount: 0,
        readyToSendCount: 1,
        alreadySentSkipped: 0,
      },
      recipientsByClient: [
        {
          clientId: "client-1",
          clientName: "Cliente Demo",
          recipients: [
            {
              key: "billing_email",
              kind: "billing_email",
              label: "Correo de facturación",
              email: "facturas@demo.test",
            },
          ],
        },
      ],
      items: [
        {
          id: "item-1",
          itemKind: "ready_to_send",
          tripId: "trip-1",
          invoiceId: "inv-1",
          billingScope: "primary_transport",
          clientId: "client-1",
          clientName: "Cliente Demo",
          status: "listed",
          folio: "A-100",
          emailMessageId: null,
          errorMessage: null,
          sentAt: null,
          createdAt: "2026-08-08T12:00:00.000Z",
          updatedAt: "2026-08-08T12:00:00.000Z",
        },
      ],
    };
    renderPage();

    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.detail.sendCta,
      }),
    );

    const dialog = screen.getByRole("alertdialog", {
      name: dispatchRunsCopy.detail.confirm.title,
    });
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: dispatchRunsCopy.detail.confirm.submit,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: dispatchRunsCopy.detail.confirm.cancel,
      }),
    ).toBeInTheDocument();
  });
});
