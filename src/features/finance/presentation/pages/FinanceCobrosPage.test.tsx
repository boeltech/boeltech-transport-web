import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import type {
  FinanceInvoiceListItem,
  FinanceOpenPpdSummary,
  FinanceRepExceptionItem,
} from "@features/finance/domain";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { renderWithTheme } from "@/test/renderWithTheme";
import { FinanceCobrosPage } from "./FinanceCobrosPage";
import {
  COBROS_FOLLOW_THROUGH_STORAGE_KEY,
  COBROS_TODAY_TRAY_STORAGE_KEY,
} from "../utils/cobrosFollowThrough";
import { REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE } from "@features/finance/domain";
import { financeCopy } from "../copy";

const {
  openPpd,
  openPpdSummary,
  registerPayment,
  repExceptions,
  repStatusByIds,
  retryFinanceRepStamp,
} = vi.hoisted(() => ({
  openPpd: {
    data: undefined as
      | {
          data: FinanceInvoiceListItem[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }
      | undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  },
  openPpdSummary: {
    data: undefined as FinanceOpenPpdSummary | undefined,
    isLoading: false,
    refetch: vi.fn(),
  },
  registerPayment: {
    mutate: vi.fn(),
    isPending: false,
  },
  repExceptions: {
    data: undefined as
      | {
          data: FinanceRepExceptionItem[];
          pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
          };
        }
      | undefined,
    isLoading: false,
    isFetched: true,
    isError: false,
    refetch: vi.fn(),
  },
  repStatusByIds: {
    data: undefined as unknown,
    isLoading: false,
  },
  retryFinanceRepStamp: {
    mutate: vi.fn(),
    isPending: false,
    variables: undefined as { invoiceId: string; paymentId: string } | undefined,
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@features/catalogs", () => ({
  useFormaPagoLabel: () => ({
    label: "03 - Transferencia",
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("@boeltech/cfdi-domain", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@boeltech/cfdi-domain")>();
  return {
    ...actual,
    getTodayMexicoDateString: () => "2026-09-29",
  };
});

vi.mock("@features/finance/application", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@features/finance/application")>();
  return {
    ...actual,
    useOpenPpdInvoices: () => openPpd,
    useOpenPpdSummary: () => openPpdSummary,
    useRegisterFinancePayment: () => registerPayment,
    useRepExceptions: () => repExceptions,
    useRepStatusByIds: () => repStatusByIds,
    useRetryFinanceRepStamp: () => retryFinanceRepStamp,
  };
});

function buildInvoice(
  overrides: Partial<FinanceInvoiceListItem> = {},
): FinanceInvoiceListItem {
  return {
    id: "inv-1",
    serie: "A",
    folio: 10,
    receiverRfc: "XAXX010101000",
    receiverName: "Cliente Demo",
    issuedAt: "2026-08-01T12:00:00.000Z",
    paymentMethod: "PPD",
    total: 1160,
    balanceDue: 1160,
    totalPaid: 0,
    tripCodes: ["TRP-001"],
    status: "stamped",
    dispatchSentAt: null,
    ...overrides,
  };
}

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location-probe">{`${location.pathname}${location.search}`}</div>
  );
}

describe("FinanceCobrosPage", () => {
  beforeEach(() => {
    openPpd.data = undefined;
    openPpd.isLoading = false;
    openPpd.isError = false;
    openPpd.isFetching = false;
    openPpdSummary.data = {
      open: 0,
      partial: 0,
      repExceptions: 0,
      totalBalance: 0,
    };
    openPpdSummary.isLoading = false;
    registerPayment.isPending = false;
    registerPayment.mutate = vi.fn();
    repExceptions.data = undefined;
    repExceptions.isLoading = false;
    repExceptions.isFetched = true;
    repExceptions.isError = false;
    repStatusByIds.data = undefined;
    retryFinanceRepStamp.mutate = vi.fn();
    retryFinanceRepStamp.isPending = false;
    retryFinanceRepStamp.variables = undefined;
    sessionStorage.removeItem(COBROS_FOLLOW_THROUGH_STORAGE_KEY);
    sessionStorage.removeItem(COBROS_TODAY_TRAY_STORAGE_KEY);
  });

  it("shows the actionable queue without requiring an RFC", () => {
    openPpd.data = {
      data: [buildInvoice()],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };
    openPpdSummary.data = {
      open: 42,
      partial: 7,
      repExceptions: 3,
      totalBalance: 125000.5,
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    expect(screen.getByRole("heading", { name: "Cobros" })).toBeInTheDocument();
    expect(
      screen.getByText(/Cola de cartera a crédito/),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "A-10" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("tab", { name: /Por cobrar/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Pago parcial/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Excepciones REP/i })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /Vencidas/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Busca al cliente por RFC/)).not.toBeInTheDocument();
  });

  it("applies ?rfc= as a filter chip and clears back to the global queue", async () => {
    const user = userEvent.setup();
    openPpd.data = {
      data: [buildInvoice()],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros?rfc=xaxx010101000"],
    });

    expect(screen.getByText("RFC: XAXX010101000")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Quitar filtro RFC: XAXX010101000" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Quitar filtro RFC: XAXX010101000" }),
    );

    await waitFor(() => {
      expect(screen.queryByText("RFC: XAXX010101000")).not.toBeInTheDocument();
    });
  });

  it("restaura bucket y rfc desde la URL (F5 / deep link)", () => {
    openPpd.data = {
      data: [buildInvoice()],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros?bucket=partial&rfc=XAXX010101000"],
    });

    expect(screen.getByRole("tab", { name: /Pago parcial/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("RFC: XAXX010101000")).toBeInTheDocument();
  });

  it("al cambiar bucket preserva ?rfc= en la URL", async () => {
    const user = userEvent.setup();
    openPpd.data = {
      data: [buildInvoice()],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };

    renderWithTheme(
      <>
        <FinanceCobrosPage />
        <LocationProbe />
      </>,
      { route: ["/finance/cobros?rfc=XAXX010101000"] },
    );

    await user.click(screen.getByRole("tab", { name: /Pago parcial/i }));

    await waitFor(() => {
      const href = screen.getByTestId("location-probe").textContent ?? "";
      expect(href).toContain("rfc=XAXX010101000");
      expect(href).toContain("bucket=partial");
      expect(href.startsWith("/finance/cobros?")).toBe(true);
    });
  });

  it("allows batch CTA only for invoices of the same RFC", async () => {
    const user = userEvent.setup();
    openPpd.data = {
      data: [
        buildInvoice(),
        buildInvoice({
          id: "inv-2",
          folio: 11,
          receiverRfc: "XEXX010101000",
          receiverName: "Otro Cliente",
        }),
      ],
      pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar factura A-10" })[0]!,
    );
    const registerButtons = screen.getAllByRole("button", {
      name: /Registrar cobro · 1 factura/,
    });
    expect(registerButtons).toHaveLength(1);
    expect(registerButtons[0]!.closest(".sticky")).toBeTruthy();

    const otherRfc = screen.getAllByRole("checkbox", {
      name: /No seleccionable: factura A-11/,
    })[0]!;
    expect(otherRfc).toBeDisabled();
    expect(
      screen.getByText(financeCopy.cobros.sameRfcOnlyHint),
    ).toBeInTheDocument();
  });

  it("clears selection when changing page (lote = página actual)", async () => {
    const user = userEvent.setup();
    openPpd.data = {
      data: [buildInvoice()],
      pagination: { page: 1, limit: 50, total: 100, totalPages: 2 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar factura A-10" })[0]!,
    );
    expect(
      screen.getAllByRole("button", { name: /Registrar cobro · 1 factura/ }),
    ).toHaveLength(1);
    expect(
      screen.getByText(financeCopy.cobros.selectedHint),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: /Registrar cobro · 1 factura/ }),
      ).not.toBeInTheDocument();
    });
  });

  it("opens chain repair as Dialog and shows Alert inline on error", async () => {
    const user = userEvent.setup();
    openPpd.data = {
      data: [buildInvoice()],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar factura A-10" })[0]!,
    );
    await user.click(
      screen.getAllByRole("button", { name: /Registrar cobro · 1 factura/ })[0]!,
    );
    expect(
      screen.getByRole("heading", { name: "Confirmar cobro" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Registrar cobro de $1,160.00" }),
    );

    const mutateCall = registerPayment.mutate.mock.calls.at(-1);
    expect(mutateCall).toBeTruthy();
    const onError = mutateCall?.[1]?.onError as
      | ((err: Error) => void)
      | undefined;
    expect(onError).toBeTypeOf("function");

    onError?.(
      new ApiError("Cadena requiere reparación", 409, "CHAIN_REORDER_REQUIRED", {
        affected_payments: [{ serie: "A", folio: 1 }],
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: financeCopy.cobros.chainRepair.title,
        }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: "Confirmar cobro" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: financeCopy.cobros.chainRepair.confirm,
      }),
    );

    const chainMutateCall = registerPayment.mutate.mock.calls.at(-1);
    const chainOnError = chainMutateCall?.[1]?.onError as
      | ((err: Error) => void)
      | undefined;
    chainOnError?.(new ApiError("Fallo al reparar cadena", 500, "PAC_ERROR"));

    await waitFor(() => {
      expect(screen.getByText("Fallo al reparar cadena")).toBeInTheDocument();
    });
    expect(
      screen.getByText(financeCopy.cobros.toastError),
    ).toBeInTheDocument();
  });

  it("submits the confirm sheet with the chosen payment date and default midday time", async () => {
    const user = userEvent.setup();
    openPpd.data = {
      data: [buildInvoice()],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar factura A-10" })[0]!,
    );
    await user.click(
      screen.getAllByRole("button", { name: /Registrar cobro · 1 factura/ })[0]!,
    );

    expect(
      screen.getByRole("heading", { name: "Confirmar cobro" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Fecha del cobro")).toHaveTextContent(
      /29 sep 2026/i,
    );

    await user.click(screen.getByLabelText("Fecha del cobro"));
    await user.click(screen.getByRole("button", { name: "15" }));

    await user.clear(screen.getByLabelText("Hora"));
    await user.click(
      screen.getByRole("button", { name: "Registrar cobro de $1,160.00" }),
    );

    expect(registerPayment.mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentDate: "2026-09-15",
        paymentTime: "12:00:00",
        paymentForm: "03",
        amount: 1160,
        allocations: [
          expect.objectContaining({
            ingressInvoiceId: "inv-1",
            amount: 1160,
          }),
        ],
      }),
      expect.anything(),
    );
  });

  it("keeps Cobros de hoy tray after leaving open-ppd (session v2)", () => {
    sessionStorage.setItem(
      COBROS_TODAY_TRAY_STORAGE_KEY,
      JSON.stringify([
        {
          paymentId: "pay-1",
          receiverRfc: "XAXX010101000",
          amount: 1160,
          paymentDate: "2026-08-18",
          repStatus: "pending",
          invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
          recordedAt: "2026-08-18T12:00:00.000Z",
        },
      ]),
    );
    repStatusByIds.data = [
      {
        paymentId: "pay-1",
        repStatus: "pending",
        repAttempts: 0,
        repLastError: null,
        repCfdiUuid: null,
        repStampedAt: null,
        repNextAttemptAt: null,
        waitReason: "queued",
        repErrorKind: null,
        invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
      },
    ];

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    expect(screen.getByText("Cobros de hoy")).toBeInTheDocument();
    expect(screen.getByText("Esperando turno")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir a factura" }),
    ).toHaveAttribute("href", "/invoices/inv-1#invoice-payments");
  });

  it("dismisses the today tray and clears sessionStorage", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      COBROS_TODAY_TRAY_STORAGE_KEY,
      JSON.stringify([
        {
          paymentId: "pay-1",
          receiverRfc: "XAXX010101000",
          amount: 1160,
          paymentDate: "2026-08-18",
          repStatus: "pending",
          invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
          recordedAt: "2026-08-18T12:00:00.000Z",
        },
      ]),
    );

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    expect(screen.getByText("Cobros de hoy")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Cerrar bandeja de cobros de hoy" }),
    );

    expect(screen.queryByText("Cobros de hoy")).not.toBeInTheDocument();
    expect(sessionStorage.getItem(COBROS_TODAY_TRAY_STORAGE_KEY)).toBeNull();
  });

  it("shows Ver excepciones in the today tray when a cobro needs action", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(
      COBROS_TODAY_TRAY_STORAGE_KEY,
      JSON.stringify([
        {
          paymentId: "pay-needs",
          receiverRfc: "XAXX010101000",
          amount: 1160,
          paymentDate: "2026-08-18",
          repStatus: "failed",
          invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
          recordedAt: "2026-08-18T12:00:00.000Z",
        },
      ]),
    );
    repStatusByIds.data = [
      {
        paymentId: "pay-needs",
        repStatus: "failed",
        repAttempts: 1,
        repLastError: "Error de validación PAC",
        repCfdiUuid: null,
        repStampedAt: null,
        repNextAttemptAt: null,
        waitReason: null,
        repErrorKind: "validation",
        invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
      },
    ];
    openPpd.data = {
      data: [buildInvoice()],
      pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    expect(screen.getByText("Cobros de hoy")).toBeInTheDocument();
    expect(screen.getByText("Requiere atención")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver excepciones" }));
    expect(
      screen.getByRole("tab", { name: /Excepciones REP/i }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("shows stamped stage in tray without auto-clearing the session entry", () => {
    sessionStorage.setItem(
      COBROS_TODAY_TRAY_STORAGE_KEY,
      JSON.stringify([
        {
          paymentId: "pay-1",
          receiverRfc: "XAXX010101000",
          amount: 1160,
          paymentDate: "2026-08-18",
          repStatus: "stamped",
          invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
          recordedAt: "2026-08-18T12:00:00.000Z",
        },
      ]),
    );
    repStatusByIds.data = [
      {
        paymentId: "pay-1",
        repStatus: "stamped",
        repAttempts: 1,
        repLastError: null,
        repCfdiUuid: "uuid-1",
        repStampedAt: "2026-08-18T12:05:00.000Z",
        repNextAttemptAt: null,
        waitReason: null,
        repErrorKind: null,
        invoices: [{ id: "inv-1", serie: "A", folio: 10, amount: 1160 }],
      },
    ];

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    expect(screen.getByText("Cobros de hoy")).toBeInTheDocument();
    expect(screen.getByText("Comprobante timbrado")).toBeInTheDocument();
    expect(sessionStorage.getItem(COBROS_TODAY_TRAY_STORAGE_KEY)).not.toBeNull();
  });

  it("queue load error uses DetailAlertCard with Reintentar in action", async () => {
    const user = userEvent.setup();
    openPpd.isError = true;
    openPpd.refetch = vi.fn().mockResolvedValue(undefined);

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    expect(screen.getByText("No se pudo consultar")).toBeInTheDocument();
    expect(
      screen.getByText(/No se pudieron cargar las facturas/),
    ).toBeInTheDocument();
    const retry = screen.getByRole("button", { name: "Reintentar" });
    expect(retry).toBeInTheDocument();

    await user.click(retry);
    expect(openPpd.refetch).toHaveBeenCalled();
  });

  it("exceptions load error uses DetailAlertCard without Card+header chrome", async () => {
    const user = userEvent.setup();
    repExceptions.isError = true;
    repExceptions.refetch = vi.fn().mockResolvedValue(undefined);

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    await user.click(screen.getByRole("tab", { name: /Excepciones REP/i }));

    expect(
      screen.getByText("No se pudieron cargar los comprobantes"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Intenta de nuevo\. Si persiste/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Comprobantes por atender" }),
    ).not.toBeInTheDocument();
  });

  it("lists a failed REP with reason and retry CTA (not for manual_review)", async () => {
    const user = userEvent.setup();
    repExceptions.data = {
      data: [
        {
          paymentId: "pay-exc-1",
          paymentDate: "2026-08-01",
          amount: 1160,
          amountMxn: 1160,
          paymentForm: "03",
          receiverRfc: "XAXX010101000",
          receiverName: "Cliente Demo",
          repStatus: "failed",
          repCfdiUuid: null,
          repLastError: "Error de validación PAC",
          allocations: [
            {
              ingressInvoiceId: "inv-1",
              amount: 1160,
              serie: "A",
              folio: 10,
            },
          ],
          deadlineDate: "2026-09-05",
          deadlineStatus: "overdue",
          daysUntilDeadline: -3,
        },
        {
          paymentId: "pay-exc-2",
          paymentDate: "2026-08-02",
          amount: 500,
          amountMxn: 500,
          paymentForm: "03",
          receiverRfc: "XAXX010101000",
          receiverName: "Cliente Demo",
          repStatus: "failed",
          repCfdiUuid: null,
          repLastError: REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE,
          allocations: [
            {
              ingressInvoiceId: "inv-2",
              amount: 500,
              serie: "A",
              folio: 11,
            },
          ],
          deadlineDate: "2026-09-05",
          deadlineStatus: "ok",
          daysUntilDeadline: 10,
        },
      ],
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    await user.click(screen.getByRole("tab", { name: /Excepciones REP/i }));

    expect(screen.getAllByText("Timbrado fallido").length).toBeGreaterThan(0);
    expect(screen.getByText("Error de validación PAC")).toBeInTheDocument();
    expect(screen.getByText("Plazo vencido", { exact: false })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Abrir factura A-10" }),
    ).toHaveAttribute("href", "/invoices/inv-1#invoice-payments");
    const goToInvoiceLinks = screen.getAllByRole("link", {
      name: "Ir a factura",
    });
    expect(goToInvoiceLinks).toHaveLength(2);
    expect(goToInvoiceLinks[0]).toHaveAttribute(
      "href",
      "/invoices/inv-1#invoice-payments",
    );
    expect(goToInvoiceLinks[1]).toHaveAttribute(
      "href",
      "/invoices/inv-2#invoice-payments",
    );
    expect(
      screen.getByRole("button", { name: "Reintentar timbrado" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE),
    ).toBeInTheDocument();
  });

  it("multi-invoice exception: no ghost Ir a factura; +N más lists the lote", async () => {
    const user = userEvent.setup();
    repExceptions.data = {
      data: [
        {
          paymentId: "pay-multi",
          paymentDate: "2026-08-01",
          amount: 3000,
          amountMxn: 3000,
          paymentForm: "03",
          receiverRfc: "XAXX010101000",
          receiverName: "Cliente Demo",
          repStatus: "failed",
          repCfdiUuid: null,
          repLastError: "Error de validación PAC",
          allocations: [
            { ingressInvoiceId: "inv-1", amount: 1000, serie: "A", folio: 10 },
            { ingressInvoiceId: "inv-2", amount: 1000, serie: "A", folio: 11 },
            { ingressInvoiceId: "inv-3", amount: 500, serie: "A", folio: 12 },
            { ingressInvoiceId: "inv-4", amount: 500, serie: "A", folio: 13 },
          ],
          deadlineDate: "2026-09-05",
          deadlineStatus: "ok",
          daysUntilDeadline: 10,
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };

    renderWithTheme(<FinanceCobrosPage />, {
      route: ["/finance/cobros"],
    });

    await user.click(screen.getByRole("tab", { name: /Excepciones REP/i }));

    expect(
      screen.queryByRole("link", { name: "Ir a factura" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("+1 más")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Ver el cobro en una factura del lote",
      }),
    );

    expect(
      screen.getByRole("menuitem", { name: "Abrir factura A-13" }),
    ).toHaveAttribute("href", "/invoices/inv-4#invoice-payments");
  });
});
