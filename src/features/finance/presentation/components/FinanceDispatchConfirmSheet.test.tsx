import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { InvoiceListItem } from "@features/invoicing/domain";
import { FinanceDispatchConfirmSheet } from "./FinanceDispatchConfirmSheet";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

const copy = dispatchRunsCopy.workbench.confirmSheet;

const mockSendBatch = vi.fn();
const mockToast = vi.fn();
const mockUseInvoiceSendRecipients = vi.fn();

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: mockToast }),
  };
});

vi.mock("@features/invoicing/application", () => ({
  useInvoiceSendRecipients: (...args: unknown[]) =>
    mockUseInvoiceSendRecipients(...args),
  useSendInvoicesBatch: () => ({
    sendBatch: mockSendBatch,
    isPending: false,
    progress: null,
  }),
}));

function buildInvoice(
  overrides: Partial<InvoiceListItem> = {},
): InvoiceListItem {
  return {
    id: "inv-1",
    tenantId: "t-1",
    serie: "A",
    folio: 10,
    cfdiUuid: null,
    receiverRfc: "AAA010101AAA",
    receiverName: "Receptor A",
    clientId: "client-a",
    clientName: "Cliente A",
    issuedAt: "2026-08-01T12:00:00.000Z",
    paymentForm: "99",
    paymentMethod: "PPD",
    currency: "MXN",
    subtotal: 1000,
    totalTax: 160,
    total: 1160,
    status: "stamped",
    satCancellationStatus: "none",
    satCancellationMessage: null,
    stampedAt: "2026-08-01T12:00:00.000Z",
    dispatchSentAt: null,
    tripCount: 1,
    tripCodes: ["TRP-001"],
    totalPaid: 0,
    balanceDue: 1160,
    createdAt: "2026-08-01T10:00:00.000Z",
    createdByName: null,
    ...overrides,
  };
}

const recipientsA = {
  clientId: "client-a",
  clientName: "Cliente A",
  recipients: [
    {
      key: "billing_email",
      kind: "billing_email" as const,
      label: "Facturación",
      email: "a@example.com",
    },
    {
      key: "contact:c1",
      kind: "contact" as const,
      contactId: "c1",
      label: "Contacto",
      email: "contacto-a@example.com",
    },
  ],
};

const recipientsB = {
  clientId: "client-b",
  clientName: "Cliente B",
  recipients: [
    {
      key: "billing_email",
      kind: "billing_email" as const,
      label: "Facturación",
      email: "b@example.com",
    },
  ],
};

function renderSheet(
  invoices: InvoiceListItem[],
  props: Partial<ComponentProps<typeof FinanceDispatchConfirmSheet>> = {},
) {
  return render(
    <MemoryRouter>
      <FinanceDispatchConfirmSheet
        open
        onOpenChange={vi.fn()}
        invoices={invoices}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("FinanceDispatchConfirmSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendBatch.mockResolvedValue([]);
    mockUseInvoiceSendRecipients.mockImplementation((invoiceId: string) => {
      if (invoiceId === "inv-1" || invoiceId === "inv-1b") {
        return {
          data: recipientsA,
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        };
      }
      if (invoiceId === "inv-2") {
        return {
          data: recipientsB,
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        };
      }
      if (invoiceId === "inv-empty") {
        return {
          data: {
            clientId: "client-empty",
            clientName: "Sin correo",
            recipients: [],
          },
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        };
      }
      return {
        data: undefined,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      };
    });
  });

  it("groups selected invoices by client and shows receptor label", async () => {
    const invoices = [
      buildInvoice({ id: "inv-1", folio: 10, clientId: "client-a" }),
      buildInvoice({
        id: "inv-1b",
        folio: 11,
        clientId: "client-a",
        total: 2000,
      }),
      buildInvoice({
        id: "inv-2",
        folio: 20,
        clientId: "client-b",
        clientName: "Cliente B",
        receiverName: "Receptor B",
        receiverRfc: "BBB010101BBB",
      }),
    ];

    renderSheet(invoices);

    expect(screen.getByRole("heading", { name: copy.title })).toBeInTheDocument();
    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(screen.getByText(copy.summary(3, 2))).toBeInTheDocument();
    expect(screen.getByText("Receptor A")).toBeInTheDocument();
    expect(screen.getByText("Receptor B")).toBeInTheDocument();
    expect(screen.queryByText("Cliente A")).not.toBeInTheDocument();
    expect(screen.queryByText("Cliente B")).not.toBeInTheDocument();
    expect(screen.getByText("A-10")).toBeInTheDocument();
    expect(screen.getByText("A-11")).toBeInTheDocument();
    expect(screen.getByText("A-20")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("a@example.com")).toBeInTheDocument();
      expect(screen.getByText("b@example.com")).toBeInTheDocument();
    });
  });

  it("does not show ZIP threshold hint; shows link download hint (P12)", () => {
    const invoices = [1, 2, 3, 4, 5].map((n) =>
      buildInvoice({
        id: `inv-zip-${n}`,
        folio: n,
        clientId: "client-a",
      }),
    );

    mockUseInvoiceSendRecipients.mockReturnValue({
      data: recipientsA,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderSheet(invoices);

    expect(screen.getByText(copy.linkHint)).toBeInTheDocument();
    expect(
      screen.queryByText(/más de 4 facturas/i),
    ).not.toBeInTheDocument();
  });

  it("shows alert+link for client without recipients and still allows confirm for others", async () => {
    const user = userEvent.setup();
    const invoices = [
      buildInvoice({ id: "inv-1", clientId: "client-a" }),
      buildInvoice({
        id: "inv-empty",
        folio: 99,
        clientId: "client-empty",
        clientName: "Sin correo",
        receiverRfc: "EEE010101EEE",
      }),
    ];

    renderSheet(invoices);

    await waitFor(() => {
      expect(screen.getByText(copy.noRecipientsTitle)).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: copy.clientLink });
    expect(link).toHaveAttribute("href", "/clients/client-empty");

    const confirm = screen.getByRole("button", { name: copy.confirm });
    await waitFor(() => expect(confirm).not.toBeDisabled());

    mockSendBatch.mockResolvedValue([
      {
        groupKey: "client-a",
        clientLabel: "Receptor A",
        invoiceIds: ["inv-1"],
        folioLabels: ["A-10"],
        ok: true,
        status: "queued",
      },
    ]);

    await user.click(confirm);

    await waitFor(() => {
      expect(mockSendBatch).toHaveBeenCalledTimes(1);
    });

    const [groups] = mockSendBatch.mock.calls[0]!;
    expect(groups).toHaveLength(1);
    expect(groups[0].groupKey).toBe("client-a");
    expect(groups[0].invoiceIds).toEqual(["inv-1"]);
    // Todos los elegibles marcados → undefined (contrato API)
    expect(groups[0].recipientKeys).toBeUndefined();
  });

  it("confirm sends one group payload per client (not per folio)", async () => {
    const user = userEvent.setup();
    const invoices = [
      buildInvoice({ id: "inv-1", folio: 10, clientId: "client-a" }),
      buildInvoice({
        id: "inv-1b",
        folio: 11,
        clientId: "client-a",
        total: 2000,
      }),
      buildInvoice({
        id: "inv-2",
        folio: 20,
        clientId: "client-b",
        clientName: "Cliente B",
        receiverName: "Receptor B",
        receiverRfc: "BBB010101BBB",
      }),
    ];

    renderSheet(invoices);

    await waitFor(() => {
      expect(screen.getByText("a@example.com")).toBeInTheDocument();
    });

    // Desmarcar contacto de cliente A → keys parciales
    const groupA = screen.getByTestId("dispatch-confirm-group-client-a");
    const contactCheckbox = within(groupA).getByLabelText(/Contacto/i);
    await user.click(contactCheckbox);

    mockSendBatch.mockResolvedValue([
      {
        groupKey: "client-a",
        clientLabel: "Receptor A",
        invoiceIds: ["inv-1", "inv-1b"],
        folioLabels: ["A-10", "A-11"],
        ok: true,
        status: "queued",
      },
      {
        groupKey: "client-b",
        clientLabel: "Receptor B",
        invoiceIds: ["inv-2"],
        folioLabels: ["A-20"],
        ok: true,
        status: "queued",
      },
    ]);

    await user.click(screen.getByRole("button", { name: copy.confirm }));

    await waitFor(() => expect(mockSendBatch).toHaveBeenCalledTimes(1));

    const [groups] = mockSendBatch.mock.calls[0]!;
    expect(groups).toEqual([
      {
        groupKey: "client-a",
        clientLabel: "Receptor A",
        invoiceIds: ["inv-1", "inv-1b"],
        folioLabels: ["A-10", "A-11"],
        recipientKeys: ["billing_email"],
      },
      {
        groupKey: "client-b",
        clientLabel: "Receptor B",
        invoiceIds: ["inv-2"],
        folioLabels: ["A-20"],
        recipientKeys: undefined,
      },
    ]);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "success",
          title: copy.toastQueued(3, 2),
        }),
      );
    });
  });

  it("keeps sheet open with per-client results on partial failure", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onBatchComplete = vi.fn();

    mockSendBatch.mockResolvedValue([
      {
        groupKey: "client-a",
        clientLabel: "Receptor A",
        invoiceIds: ["inv-1"],
        folioLabels: ["A-10"],
        ok: true,
        status: "queued",
      },
      {
        groupKey: "client-b",
        clientLabel: "Receptor B",
        invoiceIds: ["inv-2"],
        folioLabels: ["A-20"],
        ok: false,
        status: "failed",
        errorMessage: "SMTP down",
      },
    ]);

    renderSheet(
      [
        buildInvoice({ id: "inv-1" }),
        buildInvoice({
          id: "inv-2",
          folio: 20,
          clientId: "client-b",
          clientName: "Cliente B",
          receiverName: "Receptor B",
          receiverRfc: "BBB010101BBB",
        }),
      ],
      { onOpenChange, onBatchComplete },
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: copy.confirm }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByRole("button", { name: copy.confirm }));

    await waitFor(() => {
      expect(screen.getByText(copy.resultTitle)).toBeInTheDocument();
      expect(screen.getByText(/SMTP down/)).toBeInTheDocument();
      expect(
        screen.getByTestId("dispatch-result-group-client-b"),
      ).toBeInTheDocument();
      expect(
        screen.getAllByRole("button", { name: copy.close }).length,
      ).toBeGreaterThanOrEqual(1);
    });

    // Footer primario "Cerrar" (además del X del Sheet)
    const footerClose = screen
      .getAllByRole("button", { name: copy.close })
      .find((btn) => btn.className.includes("bg-primary"));
    expect(footerClose).toBeTruthy();

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(onBatchComplete).toHaveBeenCalledWith(["inv-1"]);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "warning",
        title: copy.toastPartial(1, 1),
      }),
    );
  });

  it("labels groups by receptor and splits when same clientId has distinct RFCs", async () => {
    renderSheet([
      buildInvoice({
        id: "inv-1",
        folio: 10,
        clientId: "viaje-1",
        clientName: "Cliente del viaje",
        receiverName: "Pierna Uno SA",
        receiverRfc: "AAA010101AAA",
      }),
      buildInvoice({
        id: "inv-2",
        folio: 20,
        clientId: "viaje-1",
        clientName: "Cliente del viaje",
        receiverName: "Pierna Dos SA",
        receiverRfc: "BBB010101BBB",
      }),
    ]);

    expect(screen.getByText(copy.summary(2, 2))).toBeInTheDocument();
    expect(screen.getByText("Pierna Uno SA")).toBeInTheDocument();
    expect(screen.getByText("Pierna Dos SA")).toBeInTheDocument();
    expect(screen.queryByText("Cliente del viaje")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("dispatch-confirm-group-viaje-1:AAA010101AAA"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("dispatch-confirm-group-viaje-1:BBB010101BBB"),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("a@example.com")).toBeInTheDocument();
      expect(screen.getByText("b@example.com")).toBeInTheDocument();
    });
  });

  it("shows resend warning when mode=resend", () => {
    renderSheet([buildInvoice()], { mode: "resend" });
    expect(
      screen.getByRole("heading", { name: copy.titleResend }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.resendWarning)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.confirmResend }),
    ).toBeInTheDocument();
  });
});
