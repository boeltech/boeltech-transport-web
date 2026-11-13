/**
 * Unit DOM — Sheet «Cobro por lote» (M1b · CA9 void / 409).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { OperationalReceiptBatchDetail } from "@features/finance/domain";
import { ApiError } from "@shared/api/interceptors/error-handler";
import type { UserRole } from "@shared/constants/roles";

import { OperationalReceiptBatchSheet } from "./OperationalReceiptBatchSheet";
import { operationalReceiptBatchCopy } from "../copy/operationalReceiptBatchCopy";

Element.prototype.hasPointerCapture ??= () => false;

const copy = operationalReceiptBatchCopy;
const BATCH_ID = "batch-1";
const CLIENT_ID = "client-batch";

const {
  sheetState,
  useOperationalReceiptBatchMock,
  useVoidOperationalReceiptBatchMock,
  toastMock,
} = vi.hoisted(() => ({
  sheetState: {
    role: "accountant" as UserRole,
  },
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
            sheetState.role,
            actual.getPermissionsForRole(sheetState.role),
            module as never,
            action as never,
          )
          .allowed,
      isLoading: false,
      isAuthenticated: true,
      role: sheetState.role,
      can: () => true,
      hasRole: () => true,
    }),
    useRole: () => sheetState.role,
  };
});

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: toastMock }),
    useQueryErrorToast: vi.fn(),
  };
});

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useOperationalReceiptBatch: (
      ...args: Parameters<typeof actual.useOperationalReceiptBatch>
    ) => useOperationalReceiptBatchMock(...args),
    useVoidOperationalReceiptBatch: (
      ...args: Parameters<typeof actual.useVoidOperationalReceiptBatch>
    ) => useVoidOperationalReceiptBatchMock(...args),
  };
});

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

function renderSheet() {
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

describe("OperationalReceiptBatchSheet", () => {
  beforeEach(() => {
    sheetState.role = "accountant";
    toastMock.mockReset();
    useOperationalReceiptBatchMock.mockReset();
    useVoidOperationalReceiptBatchMock.mockReset();

    useOperationalReceiptBatchMock.mockReturnValue({
      data: makeBatch(),
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

  describe("visibilidad «Anular lote» por permiso operational_cash.void", () => {
    it.each([
      ["accountant", true],
      ["manager", true],
      ["dispatcher", false],
    ] as const)(
      "rol %s → botón Anular lote visible=%s",
      async (role, visible) => {
        sheetState.role = role;
        renderSheet();

        expect(
          await screen.findByRole("heading", { name: copy.sheet.title }),
        ).toBeInTheDocument();

        const voidBtn = screen.queryByRole("button", {
          name: copy.sheet.voidCta,
        });
        if (visible) {
          expect(voidBtn).toBeInTheDocument();
        } else {
          expect(voidBtn).not.toBeInTheDocument();
        }
      },
    );
  });

  it("409 TRIPS_NOT_SIN_FACTURA muestra Alert con códigos de viaje", async () => {
    const user = userEvent.setup();
    const batch = makeBatch();

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

    renderSheet();

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
  });

  it("409 ALREADY_VOIDED muestra toast y vuelve a vista con estado Anulado tras refetch", async () => {
    const user = userEvent.setup();
    const batch = makeBatch();
    const voided = makeBatch({
      voidedAt: "2026-11-12T15:00:00.000Z",
      voidedBy: "u-2",
      voidedByName: "Otro Contador",
      voidReason: "Ya anulado",
    });
    const refetch = vi.fn().mockResolvedValue({ data: voided });

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
        const error = new ApiError(
          "Already voided",
          409,
          "OPERATIONAL_RECEIPT_BATCH_ALREADY_VOIDED",
        );
        void options?.onError?.(error, vars, undefined, undefined as never);
        // Tras refetch el query devolvería el lote anulado.
        useOperationalReceiptBatchMock.mockReturnValue({
          data: voided,
          isLoading: false,
          isError: false,
          refetch,
          error: null,
        });
      },
      isPending: false,
    }));

    const { rerender } = renderSheet();

    await user.click(
      await screen.findByRole("button", { name: copy.sheet.voidCta }),
    );
    await user.type(
      screen.getByRole("textbox", {
        name: new RegExp(copy.sheet.voidReason),
      }),
      "Intento duplicado",
    );
    await user.click(
      screen.getByRole("button", {
        name: copy.sheet.voidSubmit(batch.receiptCount),
      }),
    );

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: copy.toast.alreadyVoided,
        variant: "warning",
      }),
    );
    expect(refetch).toHaveBeenCalled();

    // Re-render con lote ya anulado (como tras refetch del query).
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    rerender(
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

    expect(
      await screen.findByText(copy.sheet.statusVoided),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.sheet.voidCta }),
    ).not.toBeInTheDocument();
  });

  it("lote ya anulado muestra estado Anulado sin CTA de anular", async () => {
    useOperationalReceiptBatchMock.mockReturnValue({
      data: makeBatch({
        voidedAt: "2026-11-12T15:00:00.000Z",
        voidedBy: "u-1",
        voidedByName: "Contador Demo",
        voidReason: "Cheque devuelto",
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      error: null,
    });

    renderSheet();

    expect(
      await screen.findByText(copy.sheet.statusVoided),
    ).toBeInTheDocument();
    expect(screen.getByText(/Cheque devuelto/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: copy.sheet.voidCta }),
    ).not.toBeInTheDocument();
  });
});
