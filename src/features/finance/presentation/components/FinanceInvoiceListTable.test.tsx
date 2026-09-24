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
    totalPaid: 0,
    tripCodes: ["TRP-260816-0004"],
    status: "stamped",
    dispatchSentAt: null,
    ...overrides,
  };
}

describe("FinanceInvoiceListTable", () => {
  it("keeps stamped PUE outstanding balance when no payment registered (T5-031)", () => {
    render(
      <FinanceInvoiceListTable
        invoices={[buildInvoice({ totalPaid: 0, balanceDue: 31920 })]}
        isLoading={false}
        onView={vi.fn()}
      />,
    );

    // Total + Por cobrar both show the amount until there is a registered payment.
    expect(screen.getAllByText("$31,920.00")).toHaveLength(2);
    expect(screen.queryByText("Liquidada")).not.toBeInTheDocument();
    expect(screen.queryByText("Pagado")).not.toBeInTheDocument();
    expect(screen.getByText("No enviada")).toBeInTheDocument();
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
            totalPaid: 0,
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
            totalPaid: 500,
          }),
        ]}
        isLoading={false}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("$660.00")).toBeInTheDocument();
  });

  it("formats issuedAt in Mexico civil date (not UTC calendar day)", () => {
    render(
      <FinanceInvoiceListTable
        invoices={[
          buildInvoice({
            folio: 6,
            issuedAt: "2026-08-23T01:50:00.000Z",
          }),
        ]}
        isLoading={false}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("22 ago 2026")).toBeInTheDocument();
    expect(screen.queryByText("23 ago 2026")).not.toBeInTheDocument();
  });

  it("shows billing scope badge and share percent for split_share rows", () => {
    render(
      <FinanceInvoiceListTable
        invoices={[
          buildInvoice({
            billingScope: "split_share",
            sharePercent: 40,
            receiverName: "Cliente B",
          }),
        ]}
        isLoading={false}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("Flete prorrateado")).toBeInTheDocument();
    expect(screen.getByText("40% del flete")).toBeInTheDocument();
  });

  it("hides client / RFC column in client portal mode", () => {
    render(
      <FinanceInvoiceListTable
        invoices={[buildInvoice()]}
        isLoading={false}
        onView={vi.fn()}
        isClientPortal
      />,
    );

    expect(screen.queryByText("Cliente")).not.toBeInTheDocument();
    expect(screen.queryByText("IIA040805DZ4")).not.toBeInTheDocument();
    expect(
      screen.queryByText("INDUSTRIA ILUMINADORA DE ALMACENES"),
    ).not.toBeInTheDocument();
  });

  it("shows configured label for stamping status (not raw enum)", () => {
    render(
      <FinanceInvoiceListTable
        invoices={[
          buildInvoice({
            folio: 7,
            status: "stamping",
            balanceDue: 0,
          }),
        ]}
        isLoading={false}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("Timbrando…")).toBeInTheDocument();
    expect(screen.queryByText(/^stamping$/)).not.toBeInTheDocument();
  });

  it("shows Enviada chip when dispatchSentAt is set on stamped rows", () => {
    render(
      <FinanceInvoiceListTable
        invoices={[
          buildInvoice({
            dispatchSentAt: "2026-09-11T12:00:00.000Z",
          }),
        ]}
        isLoading={false}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("Enviada")).toBeInTheDocument();
  });

  it("shows No enviada chip for stamped rows without dispatchSentAt", () => {
    render(
      <FinanceInvoiceListTable
        invoices={[buildInvoice({ dispatchSentAt: null })]}
        isLoading={false}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("No enviada")).toBeInTheDocument();
  });
});
