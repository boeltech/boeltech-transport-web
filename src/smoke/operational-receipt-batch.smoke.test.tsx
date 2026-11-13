/**
 * Smoke — Cobro por lote Sin factura (B2).
 * Card → página FormPageShell → sugerencia de reparto → Sheet lote.
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
import { operationalReceiptBatchCopy } from "@features/finance/presentation/copy";
import { clientDetailCopy } from "@features/clients/presentation/copy/clientDetailCopy";
import { buildOperationalReceiptBatchCreatePath } from "@features/finance/application";

Element.prototype.hasPointerCapture ??= () => false;

const copy = operationalReceiptBatchCopy;
const cardCopy = clientDetailCopy.operationalCashPending;

const useOperationalReceiptBatchCandidatesMock = vi.fn();
const useCreateOperationalReceiptBatchMock = vi.fn();
const useClientMock = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) => {
      if (module === "operational_cash" && action === "create") return true;
      if (module === "operational_cash" && action === "void") return true;
      if (module === "finance" && action === "read") return true;
      return false;
    },
    isLoading: false,
    isAuthenticated: true,
    role: "accountant",
    can: () => true,
    hasRole: () => true,
  }),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: { id: "u-1", role: "accountant", tenantId: "t-1" },
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
    useOperationalReceiptBatch: () => ({
      data: undefined,
      isLoading: false,
      isError: false,
    }),
    useVoidOperationalReceiptBatch: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  };
});

const CLIENT_ID = "client-batch";

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

describe("smoke: operational-receipt-batch", () => {
  beforeEach(() => {
    useOperationalReceiptBatchCandidatesMock.mockReset();
    useCreateOperationalReceiptBatchMock.mockReset();
    useClientMock.mockReset();

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
});
