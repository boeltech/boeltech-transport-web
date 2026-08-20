import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { FinanceInvoiceListItem } from "@features/finance/domain";
import { FinanceCobrosConfirmSheet } from "./FinanceCobrosConfirmSheet";

vi.mock("@features/catalogs", () => ({
  useFormaPagoLabel: () => ({
    label: "03 - Transferencia",
    isLoading: false,
    isError: false,
  }),
}));

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
  tripCodes: ["TRP-001"],
  status: "stamped",
};

describe("FinanceCobrosConfirmSheet", () => {
  it("shows read-only payment facts and no amount or form editors", () => {
    render(
      <FinanceCobrosConfirmSheet
        open
        onOpenChange={vi.fn()}
        invoices={[invoice]}
        total={1160}
        receiverRfc="XAXX010101000"
        paymentDate="2026-08-17"
        reference=""
        onReferenceChange={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("12:00")).toBeInTheDocument();
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
});
