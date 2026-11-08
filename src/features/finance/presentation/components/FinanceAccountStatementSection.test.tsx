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

  it("shows Cobrar with deep-link /finance/payments?rfc= when openInvoiceCount > 0", () => {
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
      "/finance/payments?rfc=IIA040805DZ4",
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

  it("shows Resumen (PDF) in the overflow menu and calls onDownloadPdf with client RFC", async () => {
    const user = userEvent.setup();
    const onDownloadPdf = vi.fn();
    const clientName = "INDUSTRIA ILUMINADORA DE ALMACENES";

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

    await user.click(
      screen.getByRole("button", {
        name: financeCopy.summary.accountStatement.moreActionsAria(clientName),
      }),
    );
    const download = await screen.findByRole("menuitem", {
      name: financeCopy.summary.accountStatement.downloadPdfActionAria(
        clientName,
      ),
    });
    expect(download).toHaveTextContent(
      financeCopy.summary.accountStatement.downloadPdfAction,
    );
    await user.click(download);
    expect(onDownloadPdf).toHaveBeenCalledWith("IIA040805DZ4");
  });

  it("disables Resumen (PDF) in the overflow menu while downloadingRfc matches the row", async () => {
    const user = userEvent.setup();
    const clientName = "INDUSTRIA ILUMINADORA DE ALMACENES";

    renderSection(
      <FinanceAccountStatementSection
        rows={[buildRow({ openInvoiceCount: 1, balanceDue: 100 })]}
        isLoading={false}
        onDownloadPdf={vi.fn()}
        downloadingRfc="IIA040805DZ4"
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: financeCopy.summary.accountStatement.moreActionsAria(clientName),
      }),
    );
    expect(
      await screen.findByRole("menuitem", {
        name: financeCopy.summary.accountStatement.downloadPdfActionAria(
          clientName,
        ),
      }),
    ).toHaveAttribute("aria-disabled", "true");
  });

  it("filtra client-side por RFC (CA 6)", async () => {
    const user = userEvent.setup();
    renderSection(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            clientRfc: "IIA040805DZ4",
            clientName: "INDUSTRIA ILUMINADORA DE ALMACENES",
          }),
          buildRow({
            clientRfc: "XAXX010101000",
            clientName: "CLIENTE GENERICO",
            totalInvoiced: 1000,
            totalPaid: 0,
            balanceDue: 1000,
            openInvoiceCount: 1,
          }),
        ]}
        isLoading={false}
      />,
    );

    const search = screen.getByRole("searchbox", {
      name: financeCopy.summary.accountStatement.searchAriaLabel,
    });
    await user.type(search, "xaxx010101");

    expect(
      screen.getByRole("row", { name: /CLIENTE GENERICO/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("row", {
        name: /INDUSTRIA ILUMINADORA DE ALMACENES/i,
      }),
    ).not.toBeInTheDocument();
  });

  it("muestra vacío de filtro cuando ningún RFC coincide", async () => {
    const user = userEvent.setup();
    renderSection(
      <FinanceAccountStatementSection
        rows={[buildRow()]}
        isLoading={false}
      />,
    );

    await user.type(
      screen.getByRole("searchbox", {
        name: financeCopy.summary.accountStatement.searchAriaLabel,
      }),
      "NOEXISTE",
    );

    expect(
      screen.getByText(financeCopy.summary.accountStatement.filterEmpty.title),
    ).toBeInTheDocument();
  });

  it("shows Relación when balanceDue > 0 and onDownloadPdf is set", () => {
    renderSection(
      <FinanceAccountStatementSection
        rows={[buildRow({ balanceDue: 12000, openInvoiceCount: 1 })]}
        isLoading={false}
        onDownloadPdf={vi.fn()}
      />,
    );

    const relation = screen.getByRole("button", {
      name: financeCopy.summary.accountStatement.pendingRelation.actionAria(
        "INDUSTRIA ILUMINADORA DE ALMACENES",
      ),
    });
    expect(relation).toHaveTextContent(
      financeCopy.summary.accountStatement.pendingRelation.action,
    );
  });

  it("hides Relación when balanceDue is 0", () => {
    renderSection(
      <FinanceAccountStatementSection
        rows={[buildRow({ balanceDue: 0, openInvoiceCount: 2 })]}
        isLoading={false}
        onDownloadPdf={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: financeCopy.summary.accountStatement.pendingRelation.actionAria(
          "INDUSTRIA ILUMINADORA DE ALMACENES",
        ),
      }),
    ).not.toBeInTheDocument();
  });

  it("shows Relación and hides Cobrar when openInvoiceCount is 0", () => {
    renderSection(
      <FinanceAccountStatementSection
        rows={[
          buildRow({
            openInvoiceCount: 0,
            balanceDue: 5000,
          }),
        ]}
        isLoading={false}
        showCollectAction
        onDownloadPdf={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", {
        name: financeCopy.summary.accountStatement.pendingRelation.actionAria(
          "INDUSTRIA ILUMINADORA DE ALMACENES",
        ),
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Cobrar/i }),
    ).not.toBeInTheDocument();
  });

  it("hides Relación without onDownloadPdf even if there is balance", () => {
    renderSection(
      <FinanceAccountStatementSection
        rows={[buildRow({ balanceDue: 8000, openInvoiceCount: 1 })]}
        isLoading={false}
        showCollectAction
      />,
    );

    expect(
      screen.queryByRole("button", {
        name: financeCopy.summary.accountStatement.pendingRelation.actionAria(
          "INDUSTRIA ILUMINADORA DE ALMACENES",
        ),
      }),
    ).not.toBeInTheDocument();
  });
});
