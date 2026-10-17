import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
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

function renderSection(ui: ReactElement): ReturnType<typeof render> {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe("FinanceAccountStatementSection", () => {
  it("shows settled Pagado for stamped PUE when total_paid is raw 0", () => {
    renderSection(
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
    renderSection(
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
    renderSection(
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

  it("shows Cobrar with deep-link /finance/cobros?rfc= when openInvoiceCount > 0", () => {
    renderSection(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            invoiceCount: 9,
            openInvoiceCount: 6,
            balanceDue: 12000,
          }),
        ]}
        isLoading={false}
        showCollectAction
      />,
    );

    const collect = screen.getByRole("link", {
      name: financeCopy.summary.accountStatement.collectActionAria(
        "INDUSTRIA ILUMINADORA DE ALMACENES",
      ),
    });
    expect(collect).toHaveAttribute(
      "href",
      "/finance/cobros?rfc=IIA040805DZ4",
    );
  });

  it("hides Cobrar when openInvoiceCount is 0 even if balanceDue > 0", () => {
    renderSection(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            invoiceCount: 3,
            openInvoiceCount: 0,
            balanceDue: 5000,
          }),
        ]}
        isLoading={false}
        showCollectAction
      />,
    );

    expect(
      screen.queryByRole("link", {
        name: /Cobrar/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("shows Descargar PDF and calls onDownloadPdf with client RFC", async () => {
    const user = userEvent.setup();
    const onDownloadPdf = vi.fn();

    renderSection(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            openInvoiceCount: 1,
            balanceDue: 12000,
          }),
        ]}
        isLoading={false}
        showCollectAction
        onDownloadPdf={onDownloadPdf}
      />,
    );

    const download = screen.getByRole("button", {
      name: financeCopy.summary.accountStatement.downloadPdfActionAria(
        "INDUSTRIA ILUMINADORA DE ALMACENES",
      ),
    });
    await user.click(download);
    expect(onDownloadPdf).toHaveBeenCalledWith("IIA040805DZ4");
  });

  it("disables Descargar PDF while downloadingRfc matches the row", () => {
    renderSection(
      <FinanceAccountStatementSection
        rows={[buildRow({ openInvoiceCount: 1, balanceDue: 100 })]}
        isLoading={false}
        onDownloadPdf={vi.fn()}
        downloadingRfc="IIA040805DZ4"
      />,
    );

    expect(
      screen.getByRole("button", {
        name: financeCopy.summary.accountStatement.downloadPdfActionAria(
          "INDUSTRIA ILUMINADORA DE ALMACENES",
        ),
      }),
    ).toBeDisabled();
  });
});
