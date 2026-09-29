import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { FinanceInvoiceListItem } from "@features/finance/domain";
import { FinanceCobrosConfirmSheet } from "./FinanceCobrosConfirmSheet";

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

const invoice: FinanceInvoiceListItem = {
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
};

const baseProps = {
  open: true,
  onOpenChange: vi.fn(),
  invoices: [invoice],
  total: 1160,
  receiverRfc: "XAXX010101000",
  paymentDate: "2026-08-17",
  onPaymentDateChange: vi.fn(),
  paymentTime: "12:00",
  onPaymentTimeChange: vi.fn(),
  reference: "",
  onReferenceChange: vi.fn(),
  onConfirm: vi.fn(),
};

describe("FinanceCobrosConfirmSheet", () => {
  it("shows editable date/time, read-only form, and no amount spinbutton", () => {
    render(<FinanceCobrosConfirmSheet {...baseProps} />);

    expect(screen.getByLabelText("Fecha del cobro")).toBeInTheDocument();
    expect(screen.getByLabelText("Hora")).toHaveAttribute("type", "time");
    expect(
      screen.getByText("Si no indicas hora, se usa mediodía (12:00)."),
    ).toBeInTheDocument();
    expect(screen.getByText("03 - Transferencia")).toBeInTheDocument();
    expect(screen.getByText("Saldo completo")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Registrar cobro de $1,160.00" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Referencia (opcional)")).toBeInTheDocument();

    const scrollBody = document.querySelector(
      "[data-slot='cobros-confirm-body']",
    );
    expect(scrollBody).toHaveClass("overflow-y-auto");
  });

  it("calls onPaymentDateChange when the operator picks another date", async () => {
    const user = userEvent.setup();
    const onPaymentDateChange = vi.fn();
    render(
      <FinanceCobrosConfirmSheet
        {...baseProps}
        onPaymentDateChange={onPaymentDateChange}
      />,
    );

    await user.click(screen.getByLabelText("Fecha del cobro"));
    await user.click(screen.getByRole("button", { name: "20" }));

    expect(onPaymentDateChange).toHaveBeenCalledWith("2026-08-20");
  });

  it("shows late REP registration hint when payment date is overdue", () => {
    render(
      <FinanceCobrosConfirmSheet
        {...baseProps}
        paymentDate="2026-07-10"
      />,
    );

    expect(
      screen.getByText(
        /La fecha del cobro ya superó el 5\.º día del mes siguiente/,
      ),
    ).toBeInTheDocument();
  });

  it("disables confirm when payment date is invalid", () => {
    render(
      <FinanceCobrosConfirmSheet {...baseProps} paymentDate="" />,
    );

    expect(
      screen.getByRole("button", { name: "Registrar cobro de $1,160.00" }),
    ).toBeDisabled();
    expect(screen.getByText("Indica la fecha del cobro.")).toBeInTheDocument();
  });
});
