/**
 * Unit DOM — página «Registrar cobro por lote» (M1b · excedente / transfer / reparto).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  buildClientOperationalReceiptBatchHref,
  buildOperationalReceiptBatchCreatePath,
} from "@features/finance/application";
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

function renderPage(options?: {
  from?: string;
  initialPath?: string;
}) {
  const createPath =
    options?.initialPath ?? buildOperationalReceiptBatchCreatePath(CLIENT_ID);
  const initialEntry = options?.from
    ? {
        pathname: createPath.split("?")[0]!,
        search: createPath.includes("?")
          ? `?${createPath.split("?")[1]}`
          : "",
        state: { from: options.from },
      }
    : createPath;

  const router = createMemoryRouter(
    [
      {
        path: "/clients/:id/operational-receipt-batches/new",
        element: <OperationalReceiptBatchCreatePage />,
      },
      {
        path: "/clients/:id",
        element: <div data-testid="client-detail">ficha</div>,
      },
      {
        path: "/finance/operational-cash-pending",
        element: <div data-testid="cash-pending-tray">bandeja</div>,
      },
    ],
    {
      initialEntries: [initialEntry],
    },
  );
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    router,
    ...render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
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

  it("query cold (data undefined + isLoading) monta sin Maximum update depth", async () => {
    useOperationalReceiptBatchCandidatesMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      dataUpdatedAt: 0,
      refetch: vi.fn(),
    });

    renderPage();

    expect(
      await screen.findByRole("heading", { name: copy.page.title }),
    ).toBeInTheDocument();
    // Skeletons de la zona de viajes (query aún loading).
    expect(document.querySelector('[aria-busy="true"]')).toBeTruthy();
  });

  it("tras load con candidatos, monto vacío no entra en loop de setAmounts", async () => {
    renderPage();
    await screen.findByRole("heading", { name: copy.page.title });

    // Sin monto (o ≤0): la página sigue estable y no crashea el Error Boundary.
    expect(screen.getByText(copy.page.zoneTrips)).toBeInTheDocument();
    expect(screen.getByLabelText("V-001")).toBeInTheDocument();
    expect(screen.getByLabelText("V-002")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Maximum update depth/i)).not.toBeInTheDocument();
    });
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

  it("desde bandeja, Cancel vuelve a la bandeja conservando query", async () => {
    const user = userEvent.setup();
    const trayFrom =
      "/finance/operational-cash-pending?clientId=client-batch&page=2";
    const { router } = renderPage({ from: trayFrom });
    await screen.findByRole("heading", { name: copy.page.title });

    await user.click(screen.getByRole("link", { name: copy.page.cancel }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/finance/operational-cash-pending",
      );
      expect(router.state.location.search).toBe(
        "?clientId=client-batch&page=2",
      );
    });
    expect(screen.getByTestId("cash-pending-tray")).toBeInTheDocument();
  });

  it("sin origen (ficha), Cancel vuelve a la ficha del cliente", async () => {
    const user = userEvent.setup();
    const { router } = renderPage();
    await screen.findByRole("heading", { name: copy.page.title });

    await user.click(screen.getByRole("link", { name: copy.page.cancel }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/clients/${CLIENT_ID}`);
    });
    expect(screen.getByTestId("client-detail")).toBeInTheDocument();
  });

  it("éxito desde bandeja aterriza en bandeja (query) y toast «Ver lote» abre ficha ?batch=", async () => {
    const batchId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const trayFrom =
      "/finance/operational-cash-pending?clientId=client-batch&page=2";
    const expectedBatchHref = buildClientOperationalReceiptBatchHref(
      CLIENT_ID,
      batchId,
    );

    useCreateOperationalReceiptBatchMock.mockImplementation(
      (_clientId, options) => ({
        mutate: () => {
          options?.onSuccess?.({
            id: batchId,
            clientId: CLIENT_ID,
            clientName: "Cliente Lote",
            amount: 10000,
            paymentInstrument: "cash",
            reference: null,
            collectedAt: "2026-11-12T18:00:00.000Z",
            note: null,
            receiptCount: 2,
            voidedAt: null,
            voidReason: null,
            voidedBy: null,
            voidedByName: null,
            createdAt: "2026-11-12T18:00:00.000Z",
            createdBy: "u-1",
            createdByName: "Ana",
            receipts: [],
          });
        },
        isPending: false,
      }),
    );

    const user = userEvent.setup();
    const { router } = renderPage({ from: trayFrom });
    await screen.findByRole("heading", { name: copy.page.title });
    await typeAmount(user, "10000");
    await user.click(
      screen.getByRole("button", { name: /Registrar \$10,000\.00/ }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(
        "/finance/operational-cash-pending",
      );
      expect(router.state.location.search).toBe(
        "?clientId=client-batch&page=2",
      );
    });
    expect(screen.getByTestId("cash-pending-tray")).toBeInTheDocument();

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: copy.toast.success(2),
        variant: "success",
        action: expect.objectContaining({
          label: copy.toast.viewBatch,
          onClick: expect.any(Function),
        }),
      }),
    );

    const toastArg = toastMock.mock.calls[0]?.[0] as {
      action?: { onClick?: () => void };
    };
    toastArg.action?.onClick?.();

    await waitFor(() => {
      expect(router.state.location.pathname + router.state.location.search).toBe(
        expectedBatchHref,
      );
    });
    expect(screen.getByTestId("client-detail")).toBeInTheDocument();
  });

  it("éxito desde ficha navega a ?batch= y toast «Ver lote» repone el deep link", async () => {
    const batchId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
    const expectedHref = buildClientOperationalReceiptBatchHref(
      CLIENT_ID,
      batchId,
    );

    useCreateOperationalReceiptBatchMock.mockImplementation(
      (_clientId, options) => ({
        mutate: () => {
          options?.onSuccess?.({
            id: batchId,
            clientId: CLIENT_ID,
            clientName: "Cliente Lote",
            amount: 10000,
            paymentInstrument: "cash",
            reference: null,
            collectedAt: "2026-11-12T18:00:00.000Z",
            note: null,
            receiptCount: 2,
            voidedAt: null,
            voidReason: null,
            voidedBy: null,
            voidedByName: null,
            createdAt: "2026-11-12T18:00:00.000Z",
            createdBy: "u-1",
            createdByName: "Ana",
            receipts: [],
          });
        },
        isPending: false,
      }),
    );

    const user = userEvent.setup();
    const { router } = renderPage();
    await screen.findByRole("heading", { name: copy.page.title });
    await typeAmount(user, "10000");

    await user.click(
      screen.getByRole("button", { name: /Registrar \$10,000\.00/ }),
    );

    await waitFor(() => {
      expect(router.state.location.pathname).toBe(`/clients/${CLIENT_ID}`);
      expect(router.state.location.search).toBe(`?batch=${batchId}`);
    });
    expect(screen.getByTestId("client-detail")).toBeInTheDocument();

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: copy.toast.success(2),
        variant: "success",
        action: expect.objectContaining({
          label: copy.toast.viewBatch,
          onClick: expect.any(Function),
        }),
      }),
    );

    // Simula cierre del Sheet (limpia query) y CTA del toast.
    await router.navigate(`/clients/${CLIENT_ID}`, { replace: true });
    const toastArg = toastMock.mock.calls[0]?.[0] as {
      action?: { onClick?: () => void };
    };
    toastArg.action?.onClick?.();

    await waitFor(() => {
      expect(router.state.location.pathname + router.state.location.search).toBe(
        expectedHref,
      );
    });
  });
});
