import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { FinanceInvoiceListItem } from "@features/finance/domain";
import { FinanceInvoiceListTable } from "./FinanceInvoiceListTable";

function buildInvoice(
  overrides: Partial<FinanceInvoiceListItem> = {},
): FinanceInvoiceListItem {
  return {
    id: "inv-1",
    serie: "A",
    folio: 1,
    receiverRfc: "IIA040805DZ4",
    receiverName: "INDUSTRIA ILUMINADORA DE ALMACENES",
    issuedAt: "2026-08-17T12:00:00.000Z",
    paymentMethod: "PUE",
    total: 31920,
    balanceDue: 31920,
    tripCodes: ["TRP-260816-0004"],
    status: "stamped",
    ...overrides,
  };
}

describe("FinanceInvoiceListTable", () => {
  it("shows stamped PUE as Liquidada even when API balance_due is the full total", () => {
    render(
      <FinanceInvoiceListTable
        invoices={[buildInvoice()]}
        isLoading={false}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("Liquidada")).toBeInTheDocument();
    expect(screen.getByText("Por cobrar")).toBeInTheDocument();
    // Total column still shows the amount; Por cobrar must not show it as outstanding.
    expect(screen.getAllByText("$31,920.00")).toHaveLength(1);
  });

  it("keeps draft PUE balance from API until the invoice is stamped", () => {
    render(
      <FinanceInvoiceListTable
        invoices={[
          buildInvoice({
            folio: 2,
            status: "draft",
            total: 35340,
            balanceDue: 35340,
          }),
        ]}
        isLoading={false}
        onView={vi.fn()}
      />,
    );

    expect(screen.getAllByText("$35,340.00")).toHaveLength(2);
    expect(screen.queryByText("Pagado")).not.toBeInTheDocument();
    expect(screen.queryByText("Liquidada")).not.toBeInTheDocument();
  });

  it("keeps stamped PPD outstanding balance", () => {
    render(
      <FinanceInvoiceListTable
        invoices={[
          buildInvoice({
            paymentMethod: "PPD",
            total: 1160,
            balanceDue: 660,
          }),
        ]}
        isLoading={false}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("$660.00")).toBeInTheDocument();
  });
});
