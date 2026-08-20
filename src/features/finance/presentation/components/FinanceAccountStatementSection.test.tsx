import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import type { AccountStatementItem } from "@features/finance/domain";
import { FinanceAccountStatementSection } from "./FinanceAccountStatementSection";

function buildRow(
  overrides: Partial<AccountStatementItem> = {},
): AccountStatementItem {
  return {
    clientRfc: "IIA040805DZ4",
    clientName: "INDUSTRIA ILUMINADORA DE ALMACENES",
    totalInvoiced: 31920,
    totalPaid: 0,
    balanceDue: 0,
    invoiceCount: 1,
    overdueAmount: 0,
    ...overrides,
  };
}

describe("FinanceAccountStatementSection", () => {
  it("shows settled Pagado for stamped PUE when total_paid is raw 0", () => {
    render(
      <FinanceAccountStatementSection rows={[buildRow()]} isLoading={false} />,
    );

    const row = screen.getByRole("row", {
      name: /INDUSTRIA ILUMINADORA DE ALMACENES/i,
    });

    // Facturado + Pagado (display) both show the invoice total; Saldo is $0.
    expect(within(row).getAllByText("$31,920.00")).toHaveLength(2);
    expect(within(row).getByText("$0.00")).toBeInTheDocument();
  });

  it("keeps Pagado equal to registered payments for partial PPD", () => {
    render(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            totalInvoiced: 5000,
            totalPaid: 2000,
            balanceDue: 3000,
            invoiceCount: 1,
          }),
        ]}
        isLoading={false}
      />,
    );

    const row = screen.getByRole("row", {
      name: /INDUSTRIA ILUMINADORA DE ALMACENES/i,
    });

    expect(within(row).getByText("$5,000.00")).toBeInTheDocument();
    expect(within(row).getByText("$2,000.00")).toBeInTheDocument();
    expect(within(row).getByText("$3,000.00")).toBeInTheDocument();
  });
});
