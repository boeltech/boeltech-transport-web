/**
 * Unit DOM — página «Registrar cobro por lote» (M1b · excedente / transfer / reparto).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { buildOperationalReceiptBatchCreatePath } from "@features/finance/application";
import type { UserRole } from "@shared/constants/roles";

import { OperationalReceiptBatchCreatePage } from "./OperationalReceiptBatchCreatePage";
import { operationalReceiptBatchCopy } from "../copy/operationalReceiptBatchCopy";

Element.prototype.hasPointerCapture ??= () => false;

const copy = operationalReceiptBatchCopy;
const CLIENT_ID = "client-batch";

const {
  pageState,
  useOperationalReceiptBatchCandidatesMock,
  useCreateOperationalReceiptBatchMock,
  useClientMock,
  toastMock,
} = vi.hoisted(() => ({
  pageState: {
    role: "accountant" as UserRole,
  },
  useOperationalReceiptBatchCandidatesMock: vi.fn(),
  useCreateOperationalReceiptBatchMock: vi.fn(),
  useClientMock: vi.fn(),
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
            pageState.role,
            actual.getPermissionsForRole(pageState.role),
            module as never,
            action as never,
          )
          .allowed,
      isLoading: false,
      isAuthenticated: true,
      role: pageState.role,
      can: () => true,
      hasRole: () => true,
    }),
    useRole: () => pageState.role,
  };
});

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: { id: "u-1", role: pageState.role, tenantId: "t-1" },
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
    useOperationalReceiptBatch: () => ({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      error: null,
    }),
    useVoidOperationalReceiptBatch: () => ({
      mutate: vi.fn(),
      isPending: false,
    }),
  };
});

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

function renderPage() {
  const router = createMemoryRouter(
    [
      {
        path: "/clients/:id/operational-receipt-batches/new",
        element: <OperationalReceiptBatchCreatePage />,
      },
    ],
    {
      initialEntries: [buildOperationalReceiptBatchCreatePath(CLIENT_ID)],
    },
  );
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

async function typeAmount(user: ReturnType<typeof userEvent.setup>, value: string) {
  const amountInput = screen.getByRole("textbox", {
    name: new RegExp(copy.page.amount.replace(/[()]/g, "\\$&")),
  });
  await user.clear(amountInput);
  await user.type(amountInput, value);
  amountInput.blur();
  return amountInput;
}

describe("OperationalReceiptBatchCreatePage", () => {
  beforeEach(() => {
    pageState.role = "accountant";
    toastMock.mockReset();
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
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    });

    useCreateOperationalReceiptBatchMock.mockImplementation(() => ({
      mutate: vi.fn(),
      isPending: false,
    }));
  });

  it("excedente (monto > saldo elegidos) muestra Alert y no envía", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    useCreateOperationalReceiptBatchMock.mockImplementation(() => ({
      mutate,
      isPending: false,
    }));

    renderPage();
    await screen.findByRole("heading", { name: copy.page.title });

    // Saldo elegidos = 13,000; monto 15,000 → excedente live.
    await typeAmount(user, "15000");

    const excessText = copy.excessAlert("$2,000.00", "$13,000.00");
    expect(await screen.findByText(excessText)).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Registrar \$15,000\.00/ }),
    );

    expect(mutate).not.toHaveBeenCalled();
    expect(screen.getByText(excessText)).toBeInTheDocument();
  });

  it("transferencia sin referencia bloquea envío con error en línea", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();
    useCreateOperationalReceiptBatchMock.mockImplementation(() => ({
      mutate,
      isPending: false,
    }));

    renderPage();
    await screen.findByRole("heading", { name: copy.page.title });

    await typeAmount(user, "5000");

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

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(
      screen.getAllByText(copy.validation.referenceRequiredTransfer).length,
    ).toBeGreaterThanOrEqual(1);
    expect(mutate).not.toHaveBeenCalled();
  });

  it("editar un abono muestra «Reparto editado» y «Volver a sugerir» restaura antigüedad", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("heading", { name: copy.page.title });

    await typeAmount(user, "10000");

    const abonoOld = await screen.findByLabelText("Abono al viaje V-001");
    await waitFor(() => {
      expect(
        String(
          abonoOld.getAttribute("value") ??
            (abonoOld as HTMLInputElement).value,
        ),
      ).toMatch(/8[,.]?000/);
    });

    expect(screen.queryByText(copy.page.editedBadge)).not.toBeInTheDocument();

    // Editar línea → modo «Reparto editado».
    await user.clear(abonoOld);
    await user.type(abonoOld, "5000");
    abonoOld.blur();

    expect(
      await screen.findByText(copy.page.editedBadge),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.page.resetSuggest }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.page.resetSuggest }),
    );

    await waitFor(() => {
      expect(screen.queryByText(copy.page.editedBadge)).not.toBeInTheDocument();
    });

    const restored = screen.getByLabelText("Abono al viaje V-001");
    await waitFor(() => {
      expect(
        String(
          restored.getAttribute("value") ??
            (restored as HTMLInputElement).value,
        ),
      ).toMatch(/8[,.]?000/);
    });
  });
});
