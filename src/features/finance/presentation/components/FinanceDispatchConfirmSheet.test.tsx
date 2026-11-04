import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { DispatchDocumentItem } from "@features/invoicing";
import { FinanceDispatchConfirmSheet } from "./FinanceDispatchConfirmSheet";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

const copy = dispatchRunsCopy.workbench.confirmSheet;

const mockSendBatch = vi.fn();
const mockToast = vi.fn();
const mockUseInvoiceSendRecipients = vi.fn();
const mockUsePaymentSendRecipients = vi.fn();

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
  usePaymentSendRecipients: (...args: unknown[]) =>
    mockUsePaymentSendRecipients(...args),
  useSendInvoicesBatch: () => ({
    sendBatch: mockSendBatch,
    isPending: false,
    progress: null,
  }),
}));

function buildDocument(
  overrides: Partial<DispatchDocumentItem> = {},
): DispatchDocumentItem {
  return {
    id: "inv-1",
    documentKind: "invoice",
    clientId: "client-a",
    clientName: "Receptor A",
    receiverRfc: "AAA010101AAA",
    folioLabel: "A-10",
    amount: 1160,
    currency: "MXN",
    stampedAt: "2026-08-01T12:00:00.000Z",
    dispatchSentAt: null,
    groupKey: "client-a",
    relatedInvoices: [],
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
  documents: DispatchDocumentItem[],
  props: Partial<ComponentProps<typeof FinanceDispatchConfirmSheet>> = {},
) {
  return render(
    <MemoryRouter>
      <FinanceDispatchConfirmSheet
        open
        onOpenChange={vi.fn()}
        documents={documents}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("FinanceDispatchConfirmSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendBatch.mockResolvedValue([]);
    mockUsePaymentSendRecipients.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
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

  it("groups selected documents by API groupKey and shows receptor label", async () => {
    const documents = [
      buildDocument({ id: "inv-1", folioLabel: "A-10", groupKey: "client-a" }),
      buildDocument({
        id: "inv-1b",
        folioLabel: "A-11",
        groupKey: "client-a",
        amount: 2000,
      }),
      buildDocument({
        id: "inv-2",
        folioLabel: "A-20",
        clientId: "client-b",
        clientName: "Receptor B",
        receiverRfc: "BBB010101BBB",
        groupKey: "client-b",
      }),
    ];

    renderSheet(documents);

    expect(screen.getByRole("heading", { name: copy.title })).toBeInTheDocument();
    expect(screen.getByText(copy.description)).toBeInTheDocument();
    expect(screen.getByText(copy.summary(3, 2))).toBeInTheDocument();
    expect(screen.getByText("Receptor A")).toBeInTheDocument();
    expect(screen.getByText("Receptor B")).toBeInTheDocument();
    expect(screen.getByText("A-10")).toBeInTheDocument();
    expect(screen.getByText("A-11")).toBeInTheDocument();
    expect(screen.getByText("A-20")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("a@example.com")).toBeInTheDocument();
      expect(screen.getByText("b@example.com")).toBeInTheDocument();
    });
  });

  it("loads payment recipients for REP-only groups", async () => {
    mockUsePaymentSendRecipients.mockReturnValue({
      data: recipientsA,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderSheet([
      buildDocument({
        id: "pay-1",
        documentKind: "rep",
        folioLabel: "REP-abcdef12",
        groupKey: "client-a",
      }),
    ]);

    expect(screen.getByText("REP-abcdef12")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockUsePaymentSendRecipients).toHaveBeenCalledWith(
        "pay-1",
        true,
      );
      expect(screen.getByText("a@example.com")).toBeInTheDocument();
    });
  });

  it("does not show ZIP threshold hint; shows link download hint (P12)", () => {
    const documents = [1, 2, 3, 4, 5].map((n) =>
      buildDocument({
        id: `inv-zip-${n}`,
        folioLabel: `A-${n}`,
        groupKey: "client-a",
      }),
    );

    mockUseInvoiceSendRecipients.mockReturnValue({
      data: recipientsA,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderSheet(documents);

    expect(screen.getByText(copy.linkHint)).toBeInTheDocument();
    expect(
      screen.queryByText(/más de 4 facturas/i),
    ).not.toBeInTheDocument();
  });

  it("shows alert+link for client without recipients and still allows confirm for others", async () => {
    const user = userEvent.setup();
    const documents = [
      buildDocument({ id: "inv-1", groupKey: "client-a" }),
      buildDocument({
        id: "inv-empty",
        folioLabel: "A-99",
        clientId: "client-empty",
        clientName: "Sin correo",
        receiverRfc: "EEE010101EEE",
        groupKey: "client-empty",
      }),
    ];

    renderSheet(documents);

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
        paymentIds: [],
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
    expect(groups[0].paymentIds).toEqual([]);
    expect(groups[0].recipientKeys).toBeUndefined();
  });

  it("confirm sends mixed invoice_ids and payment_ids per client group", async () => {
    const user = userEvent.setup();
    const documents = [
      buildDocument({ id: "inv-1", folioLabel: "A-10", groupKey: "client-a" }),
      buildDocument({
        id: "pay-1",
        documentKind: "rep",
        folioLabel: "REP-abcdef12",
        groupKey: "client-a",
        amount: 500,
      }),
      buildDocument({
        id: "inv-2",
        folioLabel: "A-20",
        clientId: "client-b",
        clientName: "Receptor B",
        receiverRfc: "BBB010101BBB",
        groupKey: "client-b",
      }),
    ];

    renderSheet(documents);

    await waitFor(() => {
      expect(screen.getByText("a@example.com")).toBeInTheDocument();
    });

    const groupA = screen.getByTestId("dispatch-confirm-group-client-a");
    const contactCheckbox = within(groupA).getByLabelText(/Contacto/i);
    await user.click(contactCheckbox);

    mockSendBatch.mockResolvedValue([
      {
        groupKey: "client-a",
        clientLabel: "Receptor A",
        invoiceIds: ["inv-1"],
        paymentIds: ["pay-1"],
        folioLabels: ["A-10", "REP-abcdef12"],
        ok: true,
        status: "queued",
      },
      {
        groupKey: "client-b",
        clientLabel: "Receptor B",
        invoiceIds: ["inv-2"],
        paymentIds: [],
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
        invoiceIds: ["inv-1"],
        paymentIds: ["pay-1"],
        folioLabels: ["A-10", "REP-abcdef12"],
        recipientKeys: ["billing_email"],
      },
      {
        groupKey: "client-b",
        clientLabel: "Receptor B",
        invoiceIds: ["inv-2"],
        paymentIds: [],
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
        paymentIds: [],
        folioLabels: ["A-10"],
        ok: true,
        status: "queued",
      },
      {
        groupKey: "client-b",
        clientLabel: "Receptor B",
        invoiceIds: ["inv-2"],
        paymentIds: [],
        folioLabels: ["A-20"],
        ok: false,
        status: "failed",
        errorMessage: "SMTP down",
      },
    ]);

    renderSheet(
      [
        buildDocument({ id: "inv-1" }),
        buildDocument({
          id: "inv-2",
          folioLabel: "A-20",
          clientId: "client-b",
          clientName: "Receptor B",
          receiverRfc: "BBB010101BBB",
          groupKey: "client-b",
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

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(onBatchComplete).toHaveBeenCalledWith(["inv-1"]);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: "warning",
        title: copy.toastPartial(1, 1),
      }),
    );
  });

  it("shows resend warning when mode=resend", () => {
    renderSheet([buildDocument()], { mode: "resend" });
    expect(
      screen.getByRole("heading", { name: copy.titleResend }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.resendWarning)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.confirmResend }),
    ).toBeInTheDocument();
  });
});
