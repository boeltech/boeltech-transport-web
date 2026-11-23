/**
 * Dirty-guard — cobro con factura: submit exitoso no dispara «¿Salir sin guardar?».
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { UNSAVED_CHANGES_COPY } from "@shared/hooks";
import type { UserRole } from "@shared/constants/roles";

import { WithInvoiceCollectionForm } from "./WithInvoiceCollectionForm";
import { registerCollectionCopy } from "../copy/registerCollectionCopy";

Element.prototype.hasPointerCapture ??= () => false;

const copy = registerCollectionCopy;
const CLIENT_ID = "client-cobro";

const {
  pageState,
  useOpenPpdInvoicesMock,
  useRegisterFinancePaymentMock,
  useClientMock,
  toastMock,
  mutateMock,
} = vi.hoisted(() => ({
  pageState: {
    role: "accountant" as UserRole,
  },
  useOpenPpdInvoicesMock: vi.fn(),
  useRegisterFinancePaymentMock: vi.fn(),
  useClientMock: vi.fn(),
  toastMock: vi.fn(),
  mutateMock: vi.fn(),
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
    // useUnsavedChangesGuard real — es el sujeto bajo prueba
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
  useFormaPagoLabel: () => ({ label: "03 - Transferencia electrónica", isLoading: false }),
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

function invoicesData() {
  return {
    data: [
      {
        id: "inv-1",
        serie: "A",
        folio: "100",
        issuedAt: "2026-10-01T08:00:00.000Z",
        receiverRfc: "XAXX010101000",
        receiverName: "Cliente Cobro",
        balanceDue: 5000,
        tripCodes: ["V-001"],
        currency: "MXN",
        status: "issued",
      },
    ],
    meta: { total: 1, page: 1, limit: 500, totalPages: 1 },
  };
}

function renderForm() {
  const router = createMemoryRouter(
    [
      {
        path: "/finance/collections/new",
        element: (
          <WithInvoiceCollectionForm
            clientId={CLIENT_ID}
            from="/finance/cobros"
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

describe("WithInvoiceCollectionForm dirty-guard", () => {
  beforeEach(() => {
    toastMock.mockReset();
    mutateMock.mockReset();
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
      refetch: vi.fn(),
    });

    useRegisterFinancePaymentMock.mockImplementation((opts?: {
      onSuccess?: (data: unknown, variables: unknown) => void;
    }) => {
      mutateMock.mockImplementation((_payload: unknown) => {
        opts?.onSuccess?.(
          { id: "pay-1", paymentId: "pay-1" },
          {
            amount: 1000,
            receiverRfc: "XAXX010101000",
            allocations: [{ ingressInvoiceId: "inv-1", amount: 1000 }],
          },
        );
      });
      return {
        mutate: mutateMock,
        isPending: false,
        isError: false,
      };
    });
  });

  it("dirty → mutate éxito → redirect sin diálogo de unsaved changes", async () => {
    const user = userEvent.setup();
    renderForm();

    await screen.findByRole("heading", { name: copy.title });

    // Sin premarkedIds → resolvePremarkedIds marca todas; no togglear el checkbox.
    const amountInput = screen.getByRole("textbox", {
      name: new RegExp(copy.amount.replace(/[()]/g, "\\$&")),
    });
    await user.clear(amountInput);
    await user.type(amountInput, "1000");
    amountInput.blur();

    const submit = await screen.findByRole("button", {
      name: /Registrar \$1,000\.00/,
    });
    expect(submit).toBeEnabled();

    await user.click(submit);

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalled();
    });

    expect(await screen.findByTestId("cobros-list")).toBeInTheDocument();
    expect(
      screen.queryByRole("alertdialog", { name: UNSAVED_CHANGES_COPY.title }),
    ).not.toBeInTheDocument();
    expect(toastMock).toHaveBeenCalled();
  });
});
