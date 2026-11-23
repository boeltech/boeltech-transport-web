/**
 * Unit DOM — formulario «Registrar cobro» con factura (idempotency, excess, chain, saldo).
 */
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ApiError } from "@shared/api/interceptors/error-handler";
import type { UserRole } from "@shared/constants/roles";
import { financeCopy } from "../copy";

import { WithInvoiceCollectionForm } from "./WithInvoiceCollectionForm";
import { registerCollectionCopy } from "../copy/registerCollectionCopy";

Element.prototype.hasPointerCapture ??= () => false;

const copy = registerCollectionCopy;
const CLIENT_ID = "client-cobro";
const chainCopy = financeCopy.cobros.chainRepair;

const {
  pageState,
  useOpenPpdInvoicesMock,
  useRegisterFinancePaymentMock,
  useClientMock,
  toastMock,
  mutateMock,
  refetchMock,
} = vi.hoisted(() => ({
  pageState: {
    role: "accountant" as UserRole,
  },
  useOpenPpdInvoicesMock: vi.fn(),
  useRegisterFinancePaymentMock: vi.fn(),
  useClientMock: vi.fn(),
  toastMock: vi.fn(),
  mutateMock: vi.fn(),
  refetchMock: vi.fn(),
}));

vi.mock("@shared/permissions", async () => {
  const actual = await vi.importActual<typeof import("@shared/permissions")>(
    "@shared/permissions",
  );
  return {
    ...actual,
    usePermissions: () => ({
      hasPermission: () => true,
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

vi.mock("@features/catalogs", () => ({
  useFormaPagoLabel: () => ({
    label: "03 - Transferencia electrónica",
    isLoading: false,
  }),
}));

vi.mock("@features/catalogs/presentation/components", () => ({
  FormaPagoSelect: ({
    value,
    onValueChange,
    triggerId,
  }: {
    value?: string;
    onValueChange?: (v: string) => void;
    triggerId?: string;
  }) => (
    <select
      id={triggerId}
      data-testid="forma-pago"
      value={value ?? ""}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      <option value="03">Transferencia</option>
    </select>
  ),
}));

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useOpenPpdInvoices: (...args: unknown[]) => useOpenPpdInvoicesMock(...args),
    useRegisterFinancePayment: (
      ...args: Parameters<typeof actual.useRegisterFinancePayment>
    ) => useRegisterFinancePaymentMock(...args),
  };
});

function invoicesData(overrides?: {
  balanceDue?: number;
  second?: boolean;
}) {
  const inv1 = {
    id: "inv-1",
    serie: "A",
    folio: 100,
    issuedAt: "2026-10-01T08:00:00.000Z",
    receiverRfc: "XAXX010101000",
    receiverName: "Cliente Cobro",
    balanceDue: overrides?.balanceDue ?? 5000,
    total: 5000,
    totalPaid: 0,
    tripCodes: ["V-001"],
    paymentMethod: "PPD",
    status: "stamped" as const,
    dispatchSentAt: null,
  };
  const inv2 = {
    id: "inv-2",
    serie: "A",
    folio: 101,
    issuedAt: "2026-10-02T08:00:00.000Z",
    receiverRfc: "XAXX010101000",
    receiverName: "Cliente Cobro",
    balanceDue: 3000,
    total: 3000,
    totalPaid: 0,
    tripCodes: ["V-002"],
    paymentMethod: "PPD",
    status: "stamped" as const,
    dispatchSentAt: null,
  };
  const data = overrides?.second === false ? [inv1] : [inv1, inv2];
  return {
    data,
    meta: { total: data.length, page: 1, limit: 500, totalPages: 1 },
  };
}

function renderForm(options?: {
  premarkedInvoiceIds?: readonly string[];
  clientId?: string;
}) {
  const router = createMemoryRouter(
    [
      {
        path: "/finance/collections/new",
        element: (
          <WithInvoiceCollectionForm
            clientId={options?.clientId ?? CLIENT_ID}
            from="/finance/cobros"
            premarkedInvoiceIds={options?.premarkedInvoiceIds}
          />
        ),
      },
      {
        path: "/finance/cobros",
        element: <div data-testid="cobros-list">cobros</div>,
      },
    ],
    { initialEntries: ["/finance/collections/new"] },
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

async function typeAmount(
  user: ReturnType<typeof userEvent.setup>,
  value: string,
) {
  const amountInput = screen.getByRole("textbox", {
    name: new RegExp(copy.amount.replace(/[()]/g, "\\$&")),
  });
  await user.clear(amountInput);
  await user.type(amountInput, value);
  amountInput.blur();
  return amountInput;
}

describe("WithInvoiceCollectionForm", () => {
  beforeEach(() => {
    pageState.role = "accountant";
    toastMock.mockReset();
    mutateMock.mockReset();
    refetchMock.mockReset();
    useOpenPpdInvoicesMock.mockReset();
    useRegisterFinancePaymentMock.mockReset();
    useClientMock.mockReset();

    useClientMock.mockReturnValue({
      data: {
        id: CLIENT_ID,
        legalName: "Cliente Cobro SA",
        tradeName: "Cliente Cobro",
        taxId: "XAXX010101000",
      },
      isLoading: false,
      isError: false,
    });

    useOpenPpdInvoicesMock.mockReturnValue({
      data: invoicesData(),
      isLoading: false,
      isError: false,
      dataUpdatedAt: Date.now(),
      refetch: refetchMock,
    });

    useRegisterFinancePaymentMock.mockImplementation(() => ({
      mutate: mutateMock,
      isPending: false,
      isError: false,
    }));
  });

  it("aside usa semántica de elegidos (no AR del cliente)", async () => {
    renderForm();
    await screen.findByRole("heading", { name: copy.title });
    expect(
      screen.getByRole("heading", { name: copy.balanceCard.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.balanceCard.dueToday)).toBeInTheDocument();
    expect(screen.queryByText("Saldo del cliente")).not.toBeInTheDocument();
    expect(screen.queryByText("Por cobrar hoy")).not.toBeInTheDocument();
    expect(screen.queryByText("Abierto del cliente")).not.toBeInTheDocument();
  });

  it("envía idempotencyKey estable en el payload de register payment", async () => {
    const user = userEvent.setup();
    renderForm({ premarkedInvoiceIds: ["inv-1"] });
    await screen.findByRole("heading", { name: copy.title });

    await typeAmount(user, "1000");

    await user.click(
      await screen.findByRole("button", { name: /Registrar \$1,000\.00/ }),
    );

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalled();
    });

    const payload = mutateMock.mock.calls[0]?.[0] as {
      idempotencyKey?: string;
      amount: number;
      allocations: { ingressInvoiceId: string; amount: number }[];
    };
    expect(payload.amount).toBe(1000);
    expect(payload.idempotencyKey).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(payload.allocations).toEqual([
      { ingressInvoiceId: "inv-1", amount: 1000 },
    ]);
  });

  it("excedente (monto > saldo elegidos) muestra Alert y no envía", async () => {
    const user = userEvent.setup();
    renderForm({ premarkedInvoiceIds: ["inv-1", "inv-2"] });
    await screen.findByRole("heading", { name: copy.title });

    // Saldo elegidos = 8,000; monto 10,000 → excedente live.
    await typeAmount(user, "10000");

    const excessText = copy.excessAlert("$2,000.00", "$8,000.00");
    expect(await screen.findByText(excessText)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Registrar \$10,000\.00/ }),
    );

    expect(mutateMock).not.toHaveBeenCalled();
    expect(screen.getByText(excessText)).toBeInTheDocument();
  });

  it("unallocated: no envía si el reparto no cuadra con el monto", async () => {
    const user = userEvent.setup();
    renderForm({ premarkedInvoiceIds: ["inv-1", "inv-2"] });
    await screen.findByRole("heading", { name: copy.title });

    await typeAmount(user, "5000");

    const abono1 = await screen.findByLabelText("Abono a A-100");
    await waitFor(() => {
      expect(
        String(
          abono1.getAttribute("value") ?? (abono1 as HTMLInputElement).value,
        ),
      ).not.toBe("");
    });

    await user.clear(abono1);
    await user.type(abono1, "1000");
    abono1.blur();

    // Forzar que el segundo abono quede en 0 → unallocated = 4000.
    const abono2 = screen.getByLabelText("Abono a A-101");
    await user.clear(abono2);
    await user.type(abono2, "0");
    abono2.blur();

    await user.click(
      screen.getByRole("button", { name: /Registrar \$5,000\.00/ }),
    );

    expect(mutateMock).not.toHaveBeenCalled();
    expect(
      await screen.findByText(copy.validation.unallocatedShort("$4,000.00")),
    ).toBeInTheDocument();
  });

  it("chain-repair reutiliza la misma idempotencyKey", async () => {
    const user = userEvent.setup();
    useRegisterFinancePaymentMock.mockImplementation(() => ({
      mutate: (
        payload: unknown,
        opts?: { onError?: (err: Error) => void },
      ) => {
        mutateMock(payload);
        const call = mutateMock.mock.calls.length;
        if (call === 1) {
          opts?.onError?.(
            new ApiError("Reorder", 409, "CHAIN_REORDER_REQUIRED", {
              repair_plan: {
                invoices: [{ serie: "A", folio: 100 }],
              },
            }),
          );
        }
      },
      isPending: false,
      isError: false,
    }));

    renderForm({ premarkedInvoiceIds: ["inv-1"] });
    await screen.findByRole("heading", { name: copy.title });
    await typeAmount(user, "1000");

    await user.click(
      await screen.findByRole("button", { name: /Registrar \$1,000\.00/ }),
    );

    expect(await screen.findByText(chainCopy.title)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: chainCopy.confirm }),
    );

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledTimes(2);
    });

    const first = mutateMock.mock.calls[0]?.[0] as {
      idempotencyKey: string;
      confirmChainRepair?: boolean;
    };
    const second = mutateMock.mock.calls[1]?.[0] as {
      idempotencyKey: string;
      confirmChainRepair?: boolean;
    };
    expect(first.confirmChainRepair).toBeUndefined();
    expect(second.confirmChainRepair).toBe(true);
    expect(second.idempotencyKey).toBe(first.idempotencyKey);
  });

  it("ALLOCATION_EXCEEDS_BALANCE muestra alert y refetch open-ppd", async () => {
    const user = userEvent.setup();
    useRegisterFinancePaymentMock.mockImplementation(() => ({
      mutate: (
        _payload: unknown,
        opts?: { onError?: (err: Error) => void },
      ) => {
        mutateMock(_payload);
        opts?.onError?.(
          new ApiError(
            "Allocation exceeds",
            422,
            "ALLOCATION_EXCEEDS_BALANCE",
          ),
        );
      },
      isPending: false,
      isError: false,
    }));

    renderForm({ premarkedInvoiceIds: ["inv-1"] });
    await screen.findByRole("heading", { name: copy.title });
    await typeAmount(user, "1000");

    await user.click(
      await screen.findByRole("button", { name: /Registrar \$1,000\.00/ }),
    );

    expect(
      await screen.findByText(copy.balanceChangedAlert),
    ).toBeInTheDocument();
    expect(refetchMock).toHaveBeenCalled();
    expect(toastMock).not.toHaveBeenCalledWith(
      expect.objectContaining({ variant: "error" }),
    );
  });

  it("refetch (dataUpdatedAt) no borra abonos editados", async () => {
    const user = userEvent.setup();
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    function Harness() {
      const [dataUpdatedAt, setDataUpdatedAt] = useState(1_000);
      useOpenPpdInvoicesMock.mockReturnValue({
        data: invoicesData({ second: false }),
        isLoading: false,
        isError: false,
        dataUpdatedAt,
        refetch: refetchMock,
      });
      return (
        <>
          <button
            type="button"
            data-testid="simulate-refetch"
            onClick={() => setDataUpdatedAt((t) => t + 1)}
          >
            refetch
          </button>
          <WithInvoiceCollectionForm
            clientId={CLIENT_ID}
            from="/finance/cobros"
            premarkedInvoiceIds={["inv-1"]}
          />
        </>
      );
    }

    const router = createMemoryRouter(
      [{ path: "/", element: <Harness /> }],
      { initialEntries: ["/"] },
    );

    render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await screen.findByRole("heading", { name: copy.title });
    await typeAmount(user, "2000");

    const abono = await screen.findByLabelText("Abono a A-100");
    await waitFor(() => {
      expect(
        String(
          abono.getAttribute("value") ?? (abono as HTMLInputElement).value,
        ),
      ).toMatch(/2[,.]?000/);
    });

    await user.clear(abono);
    await user.type(abono, "1500");
    abono.blur();

    await waitFor(() => {
      expect(
        String(
          abono.getAttribute("value") ?? (abono as HTMLInputElement).value,
        ),
      ).toMatch(/1[,.]?500/);
    });

    await user.click(screen.getByTestId("simulate-refetch"));

    await waitFor(() => {
      const after = screen.getByLabelText("Abono a A-100");
      expect(
        String(
          after.getAttribute("value") ?? (after as HTMLInputElement).value,
        ),
      ).toMatch(/1[,.]?500/);
    });
    expect(
      screen.getByRole("button", { name: copy.resetSuggest }),
    ).toBeInTheDocument();
  });
});
