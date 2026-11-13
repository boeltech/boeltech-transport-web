/**
 * Smoke — Cobro por lote Sin factura (B2).
 * Card → página FormPageShell → sugerencia de reparto → Sheet lote (CA9 void).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ClientOperationalCashPendingCard } from "@features/clients/presentation/components/ClientOperationalCashPendingCard";
import { OperationalReceiptBatchCreatePage } from "@features/finance/presentation/pages/OperationalReceiptBatchCreatePage";
import { OperationalReceiptBatchSheet } from "@features/finance/presentation/components/OperationalReceiptBatchSheet";
import { operationalReceiptBatchCopy } from "@features/finance/presentation/copy";
import { clientDetailCopy } from "@features/clients/presentation/copy/clientDetailCopy";
import { buildOperationalReceiptBatchCreatePath } from "@features/finance/application";
import type { OperationalReceiptBatchDetail } from "@features/finance/domain";
import { ApiError } from "@shared/api/interceptors/error-handler";
import type { UserRole } from "@shared/constants/roles";

Element.prototype.hasPointerCapture ??= () => false;

const copy = operationalReceiptBatchCopy;
const cardCopy = clientDetailCopy.operationalCashPending;

const {
  smokeState,
  useOperationalReceiptBatchCandidatesMock,
  useCreateOperationalReceiptBatchMock,
  useClientMock,
  useOperationalReceiptBatchMock,
  useVoidOperationalReceiptBatchMock,
  toastMock,
} = vi.hoisted(() => ({
  smokeState: {
    role: "accountant" as UserRole,
  },
  useOperationalReceiptBatchCandidatesMock: vi.fn(),
  useCreateOperationalReceiptBatchMock: vi.fn(),
  useClientMock: vi.fn(),
  useOperationalReceiptBatchMock: vi.fn(),
  useVoidOperationalReceiptBatchMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("@shared/permissions", async () => {
  const actual = await vi.importActual<typeof import("@shared/permissions")>(
    "@shared/permissions",
  );
  return {
    ...actual,
    usePermissions: () => ({
      hasPermission: (module: string, action: string) =>
        actual
          .checkPermission(
            smokeState.role,
            actual.getPermissionsForRole(smokeState.role),
            module as never,
            action as never,
          )
          .allowed,
      isLoading: false,
      isAuthenticated: true,
      role: smokeState.role,
      can: () => true,
      hasRole: () => true,
    }),
    useRole: () => smokeState.role,
  };
});

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: { id: "u-1", role: smokeState.role, tenantId: "t-1" },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: toastMock }),
    useQueryErrorToast: vi.fn(),
    useUnsavedChangesGuard: () => ({
      blocker: { state: "unblocked" },
      allowLeave: vi.fn(),
      resetAllowLeave: vi.fn(),
      isBlocked: false,
    }),
  };
});

vi.mock("@features/clients/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/clients/application")>();
  return {
    ...actual,
    useClient: (...args: unknown[]) => useClientMock(...args),
  };
});

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useOperationalReceiptBatchCandidates: (
      ...args: Parameters<typeof actual.useOperationalReceiptBatchCandidates>
    ) => useOperationalReceiptBatchCandidatesMock(...args),
    useCreateOperationalReceiptBatch: (
      ...args: Parameters<typeof actual.useCreateOperationalReceiptBatch>
    ) => useCreateOperationalReceiptBatchMock(...args),
    useClientOperationalReceiptBatches: () => ({
      data: {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    }),
    useOperationalReceiptBatch: (
      ...args: Parameters<typeof actual.useOperationalReceiptBatch>
    ) => useOperationalReceiptBatchMock(...args),
    useVoidOperationalReceiptBatch: (
      ...args: Parameters<typeof actual.useVoidOperationalReceiptBatch>
    ) => useVoidOperationalReceiptBatchMock(...args),
  };
});

const CLIENT_ID = "client-batch";
const BATCH_ID = "batch-1";

function candidatesData() {
  return {
    data: [
      {
        tripId: "trip-old",
        tripCode: "V-001",
        status: "completed" as const,
        scheduledDeparture: "2026-10-01T08:00:00.000Z",
        baseRate: 8000,
        collectedTotal: 0,
        pendingAmount: 8000,
      },
      {
        tripId: "trip-new",
        tripCode: "V-002",
        status: "scheduled" as const,
        scheduledDeparture: "2026-11-01T08:00:00.000Z",
        baseRate: 5000,
        collectedTotal: 0,
        pendingAmount: 5000,
      },
    ],
    meta: {
      totals: { pendingAmount: 13000, tripCount: 2 },
      batchCount: 1,
      truncated: false,
    },
  };
}

function makeBatch(
  overrides: Partial<OperationalReceiptBatchDetail> = {},
): OperationalReceiptBatchDetail {
  return {
    id: BATCH_ID,
    clientId: CLIENT_ID,
    clientName: "Cliente Lote",
    amount: 10000,
    paymentInstrument: "cash",
    reference: null,
    collectedAt: "2026-11-10T12:00:00.000Z",
    note: null,
    createdBy: "u-1",
    createdByName: "Contador Demo",
    createdAt: "2026-11-10T12:05:00.000Z",
    voidedAt: null,
    voidedBy: null,
    voidedByName: null,
    voidReason: null,
    receiptCount: 2,
    receipts: [
      {
        id: "r-1",
        tripId: "trip-old",
        tripCode: "V-001",
        tripStatus: "completed",
        scheduledDeparture: "2026-10-01T08:00:00.000Z",
        amount: 8000,
        voidedAt: null,
      },
      {
        id: "r-2",
        tripId: "trip-new",
        tripCode: "V-002",
        tripStatus: "scheduled",
        scheduledDeparture: "2026-11-01T08:00:00.000Z",
        amount: 2000,
        voidedAt: null,
      },
    ],
    ...overrides,
  };
}

function Providers({
  children,
  initialEntry,
}: {
  children: ReactNode;
  initialEntry: string;
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

function renderBatchSheet() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <OperationalReceiptBatchSheet
          batchId={BATCH_ID}
          open
          onOpenChange={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("smoke: operational-receipt-batch", () => {
  beforeEach(() => {
    smokeState.role = "accountant";
    toastMock.mockReset();
    useOperationalReceiptBatchCandidatesMock.mockReset();
    useCreateOperationalReceiptBatchMock.mockReset();
    useClientMock.mockReset();
    useOperationalReceiptBatchMock.mockReset();
    useVoidOperationalReceiptBatchMock.mockReset();

    useClientMock.mockReturnValue({
      data: {
        id: CLIENT_ID,
        legalName: "Cliente Lote SA",
        tradeName: "Cliente Lote",
      },
      isLoading: false,
      isError: false,
    });

    useOperationalReceiptBatchCandidatesMock.mockReturnValue({
      data: candidatesData(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    useCreateOperationalReceiptBatchMock.mockImplementation(() => ({
      mutate: vi.fn(),
      isPending: false,
    }));

    useOperationalReceiptBatchMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      error: null,
    });

    useVoidOperationalReceiptBatchMock.mockImplementation(() => ({
      mutate: vi.fn(),
      isPending: false,
    }));
  });

  it("card muestra Registrar cobro por lote hacia la página", () => {
    render(
      <Providers initialEntry={`/clients/${CLIENT_ID}`}>
        <ClientOperationalCashPendingCard clientId={CLIENT_ID} />
      </Providers>,
    );

    expect(
      screen.getByRole("heading", { name: cardCopy.title }),
    ).toBeInTheDocument();
    const cta = screen.getByRole("link", {
      name: copy.card.registerBatchAria,
    });
    expect(cta).toHaveAttribute(
      "href",
      buildOperationalReceiptBatchCreatePath(CLIENT_ID),
    );
  });

  it("página sugiere reparto por antigüedad al capturar monto", async () => {
    const user = userEvent.setup();
    const router = createMemoryRouter(
      [
        {
          path: "/clients/:id/operational-receipt-batches/new",
          element: <OperationalReceiptBatchCreatePage />,
        },
      ],
      {
        initialEntries: [
          buildOperationalReceiptBatchCreatePath(CLIENT_ID),
        ],
      },
    );

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: copy.page.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.page.disclaimer)).toBeInTheDocument();
    expect(screen.getByText("V-001")).toBeInTheDocument();
    expect(screen.getByText("V-002")).toBeInTheDocument();

    // FormFieldShell añade « *» al label.
    const amountInput = screen.getByRole("textbox", {
      name: new RegExp(copy.page.amount.replace(/[()]/g, "\\$&")),
    });
    await user.clear(amountInput);
    await user.type(amountInput, "10000");
    amountInput.blur();

    // Viaje más viejo (V-001) recibe 8000; el nuevo 2000 (sugerencia).
    const abonoOld = await screen.findByLabelText("Abono al viaje V-001");
    const abonoNew = screen.getByLabelText("Abono al viaje V-002");
    expect(
      String(
        abonoOld.getAttribute("value") ?? (abonoOld as HTMLInputElement).value,
      ),
    ).toMatch(/8[,.]?000/);
    expect(
      String(
        abonoNew.getAttribute("value") ?? (abonoNew as HTMLInputElement).value,
      ),
    ).toMatch(/2[,.]?000/);
  });

  it("transferencia sin referencia bloquea el envío con error en línea", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    useCreateOperationalReceiptBatchMock.mockImplementation(() => ({
      mutate,
      isPending: false,
    }));

    const router = createMemoryRouter(
      [
        {
          path: "/clients/:id/operational-receipt-batches/new",
          element: <OperationalReceiptBatchCreatePage />,
        },
      ],
      {
        initialEntries: [
          buildOperationalReceiptBatchCreatePath(CLIENT_ID),
        ],
      },
    );

    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await screen.findByRole("heading", { name: copy.page.title });

    const amountInput = screen.getByRole("textbox", {
      name: new RegExp(copy.page.amount.replace(/[()]/g, "\\$&")),
    });
    await user.type(amountInput, "5000");
    amountInput.blur();

    await user.click(
      screen.getByRole("combobox", {
        name: new RegExp(copy.page.instrument),
      }),
    );
    await user.click(
      await screen.findByRole("option", { name: copy.instruments.transfer }),
    );

    await user.click(
      screen.getByRole("button", { name: /Registrar \$5,000\.00/ }),
    );

    expect(
      await screen.findByRole("alert"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(copy.validation.referenceRequiredTransfer).length,
    ).toBeGreaterThanOrEqual(1);
    expect(mutate).not.toHaveBeenCalled();
  });

  describe("CA9 Sheet «Cobro por lote» void por rol", () => {
    it("dispatcher abre el Sheet sin botón «Anular lote»", async () => {
      smokeState.role = "dispatcher";
      useOperationalReceiptBatchMock.mockReturnValue({
        data: makeBatch(),
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
        error: null,
      });

      renderBatchSheet();

      expect(
        await screen.findByRole("heading", { name: copy.sheet.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(copy.sheet.statusActive)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: copy.sheet.voidCta }),
      ).not.toBeInTheDocument();
      // Footer «Cerrar» + X del Sheet comparten el nombre accesible.
      expect(
        screen.getAllByRole("button", { name: copy.sheet.close }).length,
      ).toBeGreaterThanOrEqual(1);
    });

    it("accountant anula con motivo y toast de éxito (mock 200)", async () => {
      const user = userEvent.setup();
      const batch = makeBatch();
      const voided = makeBatch({
        voidedAt: "2026-11-12T15:00:00.000Z",
        voidedBy: "u-1",
        voidedByName: "Contador Demo",
        voidReason: "Cheque devuelto",
      });
      const refetch = vi.fn();

      useOperationalReceiptBatchMock.mockReturnValue({
        data: batch,
        isLoading: false,
        isError: false,
        refetch,
        error: null,
      });

      useVoidOperationalReceiptBatchMock.mockImplementation((options) => ({
        mutate: (
          vars: { batchId: string; reason: string },
          _mutateOpts?: unknown,
        ) => {
          void options?.onSuccess?.(
            voided,
            vars,
            undefined,
            undefined as never,
          );
        },
        isPending: false,
      }));

      renderBatchSheet();

      expect(
        await screen.findByRole("button", { name: copy.sheet.voidCta }),
      ).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: copy.sheet.voidCta }),
      );

      expect(
        await screen.findByText(copy.sheet.voidConfirm(batch.receiptCount)),
      ).toBeInTheDocument();

      const reason = screen.getByRole("textbox", {
        name: new RegExp(copy.sheet.voidReason),
      });
      await user.type(reason, "Cheque devuelto");
      await user.click(
        screen.getByRole("button", {
          name: copy.sheet.voidSubmit(batch.receiptCount),
        }),
      );

      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: copy.toast.voidSuccess(batch.receiptCount),
          variant: "success",
        }),
      );
      expect(
        screen.getByRole("button", { name: copy.sheet.voidCta }),
      ).toBeInTheDocument();
    });

    it("accountant 409 TRIPS_NOT_SIN_FACTURA muestra Alert inline R1", async () => {
      const user = userEvent.setup();
      const batch = makeBatch();

      useOperationalReceiptBatchMock.mockReturnValue({
        data: batch,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
        error: null,
      });

      useVoidOperationalReceiptBatchMock.mockImplementation((options) => ({
        mutate: (
          vars: { batchId: string; reason: string },
          _mutateOpts?: unknown,
        ) => {
          const error = new ApiError(
            "Trips not sin factura",
            409,
            "OPERATIONAL_RECEIPT_BATCH_TRIPS_NOT_SIN_FACTURA",
            {
              trips: [{ trip_code: "V-001" }, { trip_code: "V-002" }],
            },
          );
          void options?.onError?.(error, vars, undefined, undefined as never);
        },
        isPending: false,
      }));

      renderBatchSheet();

      await user.click(
        await screen.findByRole("button", { name: copy.sheet.voidCta }),
      );
      await user.type(
        screen.getByRole("textbox", {
          name: new RegExp(copy.sheet.voidReason),
        }),
        "Error de captura",
      );
      await user.click(
        screen.getByRole("button", {
          name: copy.sheet.voidSubmit(batch.receiptCount),
        }),
      );

      expect(
        await screen.findByText(copy.sheet.r1Blocked("V-001, V-002")),
      ).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
      // Sigue en modo anular (Alert inline, sin toast de éxito).
      expect(
        screen.getByRole("button", {
          name: copy.sheet.voidSubmit(batch.receiptCount),
        }),
      ).toBeInTheDocument();
    });
  });
});
