import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AccountStatementItem } from "@features/finance/domain";
import { financeCopy } from "../copy";
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
    openInvoiceCount: 0,
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
            openInvoiceCount: 1,
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

  it("shows Abiertas badge from openInvoiceCount, not invoiceCount", () => {
    render(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            invoiceCount: 9,
            openInvoiceCount: 6,
            balanceDue: 12000,
          }),
        ]}
        isLoading={false}
      />,
    );

    expect(
      screen.getByRole("columnheader", {
        name: financeCopy.summary.table.invoices,
      }),
    ).toHaveTextContent("Abiertas");

    const row = screen.getByRole("row", {
      name: /INDUSTRIA ILUMINADORA DE ALMACENES/i,
    });
    expect(within(row).getByText("6")).toBeInTheDocument();
    expect(within(row).queryByText("9")).not.toBeInTheDocument();
  });

  it("shows Cobrar when openInvoiceCount > 0 and calls with client RFC", async () => {
    const user = userEvent.setup();
    const onCollectClient = vi.fn();

    render(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            invoiceCount: 9,
            openInvoiceCount: 6,
            balanceDue: 12000,
          }),
        ]}
        isLoading={false}
        onCollectClient={onCollectClient}
      />,
    );

    const collect = screen.getByRole("button", {
      name: financeCopy.summary.accountStatement.collectActionAria(
        "INDUSTRIA ILUMINADORA DE ALMACENES",
      ),
    });
    await user.click(collect);
    expect(onCollectClient).toHaveBeenCalledWith("IIA040805DZ4");
  });

  it("hides Cobrar when openInvoiceCount is 0 even if balanceDue > 0", () => {
    render(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            invoiceCount: 3,
            openInvoiceCount: 0,
            balanceDue: 5000,
          }),
        ]}
        isLoading={false}
        onCollectClient={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: /Cobrar/i,
      }),
    ).not.toBeInTheDocument();
  });
});
