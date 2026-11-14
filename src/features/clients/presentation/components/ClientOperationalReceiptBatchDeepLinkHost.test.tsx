/**
 * Deep-link `?batch=` → Sheet en ficha cliente (A1–A4).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import type { OperationalReceiptBatchDetail } from "@features/finance/domain";
import { operationalReceiptBatchCopy } from "@features/finance/presentation/copy";
import { ApiError } from "@shared/api/interceptors/error-handler";

import { ClientOperationalReceiptBatchDeepLinkHost } from "./ClientOperationalReceiptBatchDeepLinkHost";

Element.prototype.hasPointerCapture ??= () => false;

const copy = operationalReceiptBatchCopy;
const BATCH_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const {
  useOperationalReceiptBatchMock,
  useVoidOperationalReceiptBatchMock,
} = vi.hoisted(() => ({
  useOperationalReceiptBatchMock: vi.fn(),
  useVoidOperationalReceiptBatchMock: vi.fn(),
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
      role: "accountant",
      can: () => true,
      hasRole: () => true,
    }),
  };
});

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
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
    clientId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
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
    receipts: [
      {
        id: "r-1",
        tripId: "trip-1",
        tripCode: "V-001",
        tripStatus: "completed",
        amount: 8000,
        scheduledDeparture: "2026-10-01T08:00:00.000Z",
        voidedAt: null,
      },
      {
        id: "r-2",
        tripId: "trip-2",
        tripCode: "V-002",
        tripStatus: "scheduled",
        amount: 2000,
        scheduledDeparture: "2026-11-01T08:00:00.000Z",
        voidedAt: null,
      },
    ],
    ...overrides,
  };
}

function renderHost(initialEntry: string, onBatchPresent = vi.fn()) {
  const router = createMemoryRouter(
    [
      {
        path: "/clients/:id",
        element: (
          <ClientOperationalReceiptBatchDeepLinkHost
            onBatchPresent={onBatchPresent}
          />
        ),
      },
    ],
    { initialEntries: [initialEntry] },
  );
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    router,
    onBatchPresent,
    ...render(
      <QueryClientProvider client={qc}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
}

describe("ClientOperationalReceiptBatchDeepLinkHost", () => {
  beforeEach(() => {
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

  it("abre el Sheet al aterrizar con ?batch= válido", async () => {
    const { onBatchPresent } = renderHost(
      `/clients/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa?batch=${BATCH_ID}`,
    );

    expect(
      await screen.findByRole("heading", { name: copy.sheet.title }),
    ).toBeInTheDocument();
    expect(screen.getByText("V-001")).toBeInTheDocument();
    expect(screen.getByText("V-002")).toBeInTheDocument();
    expect(onBatchPresent).toHaveBeenCalled();
  });

  it("cerrar el Sheet limpia ?batch= y preserva otros params", async () => {
    const user = userEvent.setup();
    const { router } = renderHost(
      `/clients/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa?tab=trips&batch=${BATCH_ID}`,
    );

    expect(
      await screen.findByRole("heading", { name: copy.sheet.title }),
    ).toBeInTheDocument();

    // Footer «Cerrar» + X del SheetContent comparten el nombre accesible.
    await user.click(
      screen.getAllByRole("button", { name: copy.sheet.close })[0]!,
    );

    await waitFor(() => {
      expect(router.state.location.search).toBe("?tab=trips");
    });
    expect(
      screen.queryByRole("heading", { name: copy.sheet.title }),
    ).not.toBeInTheDocument();
  });

  it("UUID inválido limpia el param sin abrir Sheet", async () => {
    const { router } = renderHost(
      "/clients/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa?batch=not-a-uuid",
    );

    await waitFor(() => {
      expect(router.state.location.search).toBe("");
    });
    expect(
      screen.queryByRole("heading", { name: copy.sheet.title }),
    ).not.toBeInTheDocument();
  });

  it("404 muestra mensaje de no encontrado (sin Sheet vacío colgado)", async () => {
    useOperationalReceiptBatchMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
      error: new ApiError(
        "Not found",
        404,
        "OPERATIONAL_RECEIPT_BATCH_NOT_FOUND",
      ),
    });

    renderHost(
      `/clients/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa?batch=${BATCH_ID}`,
    );

    expect(
      await screen.findByText(copy.sheet.notFound),
    ).toBeInTheDocument();
  });
});
