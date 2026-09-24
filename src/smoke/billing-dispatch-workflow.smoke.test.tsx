/**
 * Smoke ADR-0082 — envío de facturas del periodo: revisión → destinatarios → confirmar.
 * Mock de hooks; no requiere backend ni correo real.
 * Addendum destinatarios (A3): lista visible, override efímero, dialog delgado.
 * Addendum force_resend (R3): Ya enviadas, reenvío con forceResend + invoiceIds.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DispatchRunDetailPage } from "@features/finance/presentation/pages/DispatchRunDetailPage";
import { dispatchRunsCopy } from "@features/finance/presentation/copy/dispatchRunsCopy";
import { billingSchemesCopy } from "@features/settings/presentation/copy/billingSchemesCopy";
import type { BillingDispatchRun } from "@features/finance/domain/billingDispatchRun.types";

const mocks = vi.hoisted(() => ({
  confirmMutateAsync: vi.fn(),
  previewMutateAsync: vi.fn(),
  cancelMutateAsync: vi.fn(),
  refetch: vi.fn(),
  hasPermission: vi.fn(() => true),
  run: null as BillingDispatchRun | null,
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

const contactKey = "contact:aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

const previewedRun: BillingDispatchRun = {
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
  summary: {
    pendingStampCount: 1,
    readyToSendCount: 2,
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
        {
          key: contactKey,
          kind: "contact",
          contactId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
          label: "Ana Pérez",
          email: "ana@demo.test",
        },
      ],
    },
  ],
  clientReceipts: null,
  items: [
    {
      id: "item-pending",
      itemKind: "pending_stamp",
      tripId: "trip-1",
      invoiceId: null,
      billingScope: "primary_transport",
      clientId: "client-1",
      clientName: "Cliente Demo",
      status: "listed",
      folio: null,
      emailMessageId: null,
      errorMessage: null,
      sentAt: null,
      createdAt: "2026-08-08T12:00:00.000Z",
      updatedAt: "2026-08-08T12:00:00.000Z",
    },
    {
      id: "item-ready-1",
      itemKind: "ready_to_send",
      tripId: "trip-2",
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
    {
      id: "item-ready-2",
      itemKind: "ready_to_send",
      tripId: "trip-3",
      invoiceId: "inv-2",
      billingScope: "primary_transport",
      clientId: "client-1",
      clientName: "Cliente Demo",
      status: "listed",
      folio: "A-101",
      emailMessageId: null,
      errorMessage: null,
      sentAt: null,
      createdAt: "2026-08-08T12:00:00.000Z",
      updatedAt: "2026-08-08T12:00:00.000Z",
    },
  ],
};

const skippedInvoiceId = "inv-skipped-1";

const previewedRunWithSkipped: BillingDispatchRun = {
  ...previewedRun,
  summary: {
    pendingStampCount: 1,
    readyToSendCount: 2,
    alreadySentSkipped: 1,
  },
  items: [
    ...previewedRun.items!,
    {
      id: "item-skipped-1",
      itemKind: "ready_to_send",
      tripId: "trip-4",
      invoiceId: skippedInvoiceId,
      billingScope: "primary_transport",
      clientId: "client-1",
      clientName: "Cliente Demo",
      status: "skipped",
      folio: "B-200",
      emailMessageId: null,
      errorMessage: null,
      sentAt: null,
      createdAt: "2026-08-08T12:00:00.000Z",
      updatedAt: "2026-08-08T12:00:00.000Z",
    },
  ],
};

const sharedSplitTripId = "trip-split-shared";

const previewedRunSplitShare: BillingDispatchRun = {
  ...previewedRun,
  summary: {
    pendingStampCount: 0,
    readyToSendCount: 2,
    alreadySentSkipped: 0,
  },
  recipientsByClient: [
    {
      clientId: "client-industria",
      clientName: "INDISTRIA ILUMINADORA",
      recipients: [
        {
          key: "billing_email",
          kind: "billing_email",
          label: "Correo de facturación",
          email: "facturacion@industria.test",
        },
      ],
    },
    {
      clientId: "client-luces",
      clientName: "LUCES & OBRAS",
      recipients: [
        {
          key: "billing_email",
          kind: "billing_email",
          label: "Correo de facturación",
          email: "facturacion@luces.test",
        },
      ],
    },
  ],
  items: [
    {
      id: "item-split-a5",
      itemKind: "ready_to_send",
      tripId: sharedSplitTripId,
      invoiceId: "inv-a5",
      billingScope: "split_share",
      clientId: "client-industria",
      clientName: "INDISTRIA ILUMINADORA",
      clientRfc: "IIA040805DZ4",
      status: "listed",
      folio: "A-5",
      emailMessageId: null,
      errorMessage: null,
      sentAt: null,
      createdAt: "2026-08-08T12:00:00.000Z",
      updatedAt: "2026-08-08T12:00:00.000Z",
    },
    {
      id: "item-split-a6",
      itemKind: "ready_to_send",
      tripId: sharedSplitTripId,
      invoiceId: "inv-a6",
      billingScope: "split_share",
      clientId: "client-luces",
      clientName: "LUCES & OBRAS",
      clientRfc: "L&O950913MSA",
      status: "listed",
      folio: "A-6",
      emailMessageId: null,
      errorMessage: null,
      sentAt: null,
      createdAt: "2026-08-08T12:00:00.000Z",
      updatedAt: "2026-08-08T12:00:00.000Z",
    },
  ],
};

vi.mock("@features/finance/application/hooks/useBillingDispatchRuns", () => ({
  useBillingDispatchRun: () => ({
    data: mocks.run ?? previewedRun,
    isLoading: false,
    isError: false,
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
    mutateAsync: mocks.cancelMutateAsync,
    isPending: false,
  }),
}));

function renderDetail() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/finance/dispatch/run-1"]}>
        <Routes>
          <Route path="/finance/dispatch/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );

  return render(<DispatchRunDetailPage />, { wrapper });
}

describe("billing-dispatch smoke (ADR-0082)", () => {
  beforeEach(() => {
    mocks.run = null;
    mocks.confirmMutateAsync.mockReset().mockResolvedValue({
      ...previewedRun,
      status: "completed",
    });
    mocks.previewMutateAsync.mockReset();
    mocks.cancelMutateAsync.mockReset();
    mocks.refetch.mockReset();
    mocks.hasPermission.mockReset().mockReturnValue(true);
  });

  it("muestra revisión con pendientes + listas y confirma envío por cliente", async () => {
    const user = userEvent.setup();
    renderDetail();

    expect(
      screen.getByText(dispatchRunsCopy.detail.title),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        dispatchRunsCopy.detail.decisionSummary(2, 1, 1),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(dispatchRunsCopy.detail.counts.pendingStamp).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText(dispatchRunsCopy.detail.counts.readyToSend).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        dispatchRunsCopy.detail.buckets.clientGroup("Cliente Demo", 2),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/A-100/)).toBeInTheDocument();
    expect(screen.getByText(/A-101/)).toBeInTheDocument();
    expect(
      screen.getByText(dispatchRunsCopy.detail.buckets.pendingNote),
    ).toBeInTheDocument();

    expect(
      screen.getByText(dispatchRunsCopy.detail.recipients.title),
    ).toBeInTheDocument();
    expect(screen.getByText("facturas@demo.test")).toBeInTheDocument();
    expect(screen.getByText("ana@demo.test")).toBeInTheDocument();

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
      within(dialog).getByText(dispatchRunsCopy.detail.confirm.emailNote),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        `${dispatchRunsCopy.detail.confirm.summaryClients(1)} · ${dispatchRunsCopy.detail.confirm.summaryInvoices(2)} · ${dispatchRunsCopy.detail.confirm.summaryRecipients(2)}`,
      ),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(dispatchRunsCopy.detail.confirm.recipientsNote),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(dispatchRunsCopy.detail.confirm.pendingWarning),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", {
        name: dispatchRunsCopy.detail.confirm.submit,
      }),
    );

    expect(mocks.confirmMutateAsync).toHaveBeenCalledWith({
      id: "run-1",
      payload: { recipientOverrides: undefined },
    });
    expect(
      mocks.confirmMutateAsync.mock.calls[0]![0].payload?.forceResend,
    ).toBeUndefined();
  });

  it("muestra Ya enviadas, selecciona folio y confirma reenvío con forceResend", async () => {
    mocks.run = previewedRunWithSkipped;
    const user = userEvent.setup();
    renderDetail();

    expect(
      screen.getAllByText(dispatchRunsCopy.detail.alreadySent.title).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(/B-200/)).toBeInTheDocument();

    const skippedCheckbox = screen.getByRole("checkbox", {
      name: /Factura B-200/i,
    });
    await user.click(skippedCheckbox);

    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.detail.resendCta,
      }),
    );

    const dialog = screen.getByRole("alertdialog", {
      name: dispatchRunsCopy.detail.resendConfirm.title,
    });
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(dispatchRunsCopy.detail.resendConfirm.riskNote),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        `${dispatchRunsCopy.detail.resendConfirm.summaryClients(1)} · ${dispatchRunsCopy.detail.resendConfirm.summaryInvoices(1)} · ${dispatchRunsCopy.detail.resendConfirm.summaryRecipients(2)}`,
      ),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", {
        name: dispatchRunsCopy.detail.resendConfirm.submit,
      }),
    );

    expect(mocks.confirmMutateAsync).toHaveBeenCalledWith({
      id: "run-1",
      payload: {
        forceResend: true,
        invoiceIds: [skippedInvoiceId],
        recipientOverrides: undefined,
      },
    });
  });

  it("permite desmarcar destinatario y envía recipient_overrides", async () => {
    const user = userEvent.setup();
    renderDetail();

    const billingCheckbox = screen.getByRole("checkbox", {
      name: /Correo de facturación/i,
    });
    expect(billingCheckbox).toBeChecked();

    await user.click(billingCheckbox);
    expect(billingCheckbox).not.toBeChecked();

    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.detail.sendCta,
      }),
    );

    const dialog = screen.getByRole("alertdialog", {
      name: dispatchRunsCopy.detail.confirm.title,
    });
    expect(
      within(dialog).getByText(
        dispatchRunsCopy.detail.confirm.summaryRecipients(1),
        { exact: false },
      ),
    ).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", {
        name: dispatchRunsCopy.detail.confirm.submit,
      }),
    );

    expect(mocks.confirmMutateAsync).toHaveBeenCalledWith({
      id: "run-1",
      payload: {
        recipientOverrides: [
          {
            clientId: "client-1",
            recipientKeys: [contactKey],
          },
        ],
      },
    });
  });

  it("bloquea envío si el cliente queda sin destinatarios marcados", async () => {
    const user = userEvent.setup();
    renderDetail();

    await user.click(
      screen.getByRole("checkbox", { name: /Correo de facturación/i }),
    );
    await user.click(screen.getByRole("checkbox", { name: /Ana Pérez/i }));

    expect(
      screen.getByText(dispatchRunsCopy.detail.recipients.zeroSelected),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: dispatchRunsCopy.detail.sendCta,
      }),
    ).toBeDisabled();
  });

  it("catálogo de esquemas expone copy de cadencia", () => {
    expect(billingSchemesCopy.page.title).toMatch(/Esquemas de facturación/i);
    expect(billingSchemesCopy.cadence.periodic_weekly).toBe("Semanal");
  });

  it("con muchos clientes colapsa grupos y requiere expandir para ver folios", async () => {
    const manyClients: BillingDispatchRun = {
      ...previewedRun,
      summary: {
        pendingStampCount: 0,
        readyToSendCount: 6,
        alreadySentSkipped: 0,
      },
      recipientsByClient: Array.from({ length: 6 }, (_, i) => ({
        clientId: `client-${i + 1}`,
        clientName: `Cliente ${i + 1}`,
        recipients: [
          {
            key: "billing_email",
            kind: "billing_email" as const,
            label: "Correo de facturación",
            email: `c${i + 1}@demo.test`,
          },
        ],
      })),
      items: Array.from({ length: 6 }, (_, i) => ({
        id: `item-ready-${i + 1}`,
        itemKind: "ready_to_send" as const,
        tripId: `trip-${i + 1}`,
        invoiceId: `inv-${i + 1}`,
        billingScope: "primary_transport",
        clientId: `client-${i + 1}`,
        clientName: `Cliente ${i + 1}`,
        status: "listed",
        folio: `F-${100 + i}`,
        emailMessageId: null,
        errorMessage: null,
        sentAt: null,
        createdAt: "2026-08-08T12:00:00.000Z",
        updatedAt: "2026-08-08T12:00:00.000Z",
      })),
    };
    mocks.run = manyClients;
    const user = userEvent.setup();
    renderDetail();

    expect(
      screen.getByText(
        dispatchRunsCopy.detail.buckets.clientGroup("Cliente 1", 1),
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/F-100/)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: dispatchRunsCopy.detail.buckets.clientGroup("Cliente 1", 1),
      }),
    );
    expect(screen.getByText(/F-100/)).toBeInTheDocument();
    expect(
      screen.getByText(dispatchRunsCopy.detail.recipients.title),
    ).toBeInTheDocument();
  });

  it("post-send muestra resultado por cliente y banner con errores parciales", () => {
    mocks.run = {
      ...previewedRun,
      status: "completed",
      summary: {
        pendingStampCount: 0,
        readyToSendCount: 2,
        alreadySentSkipped: 0,
      },
      errorSummary: "1 cliente falló",
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
        {
          clientId: "client-2",
          clientName: "Cliente Fallido",
          recipients: [
            {
              key: "billing_email",
              kind: "billing_email",
              label: "Correo de facturación",
              email: "otro@demo.test",
            },
          ],
        },
      ],
      clientReceipts: [
        {
          clientId: "client-1",
          recipients: [
            {
              key: "billing_email",
              kind: "billing_email",
              label: "Correo de facturación",
              email: "facturas@demo.test",
            },
          ],
          emailMessageId: "m1",
          status: "sent",
          errorMessage: null,
          sentAt: "2026-08-08T13:00:00.000Z",
          createdAt: "2026-08-08T13:00:00.000Z",
          updatedAt: "2026-08-08T13:00:00.000Z",
        },
        {
          clientId: "client-2",
          recipients: [
            {
              key: "billing_email",
              kind: "billing_email",
              label: "Correo de facturación",
              email: "otro@demo.test",
            },
          ],
          emailMessageId: null,
          status: "failed",
          errorMessage: "Fallo al enviar el correo",
          sentAt: null,
          createdAt: "2026-08-08T13:00:00.000Z",
          updatedAt: "2026-08-08T13:00:00.000Z",
        },
      ],
      items: [
        {
          id: "item-ready-1",
          itemKind: "ready_to_send",
          tripId: "trip-2",
          invoiceId: "inv-1",
          billingScope: "primary_transport",
          clientId: "client-1",
          clientName: "Cliente Demo",
          status: "sent",
          folio: "A-100",
          emailMessageId: "m1",
          errorMessage: null,
          sentAt: "2026-08-08T13:00:00.000Z",
          createdAt: "2026-08-08T12:00:00.000Z",
          updatedAt: "2026-08-08T13:00:00.000Z",
        },
        {
          id: "item-ready-2",
          itemKind: "ready_to_send",
          tripId: "trip-3",
          invoiceId: "inv-2",
          billingScope: "primary_transport",
          clientId: "client-2",
          clientName: "Cliente Fallido",
          status: "failed",
          folio: "A-101",
          emailMessageId: null,
          errorMessage: "Fallo al enviar el correo",
          sentAt: null,
          createdAt: "2026-08-08T12:00:00.000Z",
          updatedAt: "2026-08-08T13:00:00.000Z",
        },
      ],
    };

    renderDetail();

    expect(
      screen.getByText(
        dispatchRunsCopy.detail.result.completedWithErrors(1, 2),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dispatchRunsCopy.detail.result.byClientTitle),
    ).toBeInTheDocument();
    expect(screen.getByText("Cliente Demo")).toBeInTheDocument();
    expect(screen.getByText("Cliente Fallido")).toBeInTheDocument();
    expect(
      screen.getAllByText(dispatchRunsCopy.detail.result.statusFailed).length,
    ).toBeGreaterThan(0);
  });

  it("agrupa facturas split_share del mismo viaje bajo clientes distintos", () => {
    mocks.run = previewedRunSplitShare;
    renderDetail();

    expect(
      screen.getByText(
        dispatchRunsCopy.detail.buckets.clientGroup(
          "INDISTRIA ILUMINADORA · IIA040805DZ4",
          1,
        ),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        dispatchRunsCopy.detail.buckets.clientGroup(
          "LUCES & OBRAS · L&O950913MSA",
          1,
        ),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/A-5/)).toBeInTheDocument();
    expect(screen.getByText(/A-6/)).toBeInTheDocument();
    expect(screen.getByText("facturacion@industria.test")).toBeInTheDocument();
    expect(screen.getByText("facturacion@luces.test")).toBeInTheDocument();
    expect(
      screen.getByText(
        dispatchRunsCopy.detail.decisionSummary(2, 2, 0),
      ),
    ).toBeInTheDocument();
  });
});
