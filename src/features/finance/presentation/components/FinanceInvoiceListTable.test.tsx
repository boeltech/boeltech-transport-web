import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { FinanceInvoiceListItem } from "@features/finance/domain";
import { financeCopy } from "../copy";
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

function renderTable(
  props: Partial<ComponentProps<typeof FinanceInvoiceListTable>> = {},
) {
  return render(
    <MemoryRouter>
      <FinanceInvoiceListTable
        invoices={props.invoices ?? []}
        isLoading={props.isLoading ?? false}
        onView={props.onView ?? vi.fn()}
        isClientPortal={props.isClientPortal}
      />
    </MemoryRouter>,
  );
}

describe("FinanceInvoiceListTable", () => {
  it("does not render a local empty row (shell owns EmptyState)", () => {
    const { container } = renderTable({ invoices: [], isLoading: false });

    // EntityListTable returns null; MemoryRouter still mounts a wrapper.
    expect(
      screen.queryByText(financeCopy.invoices.empty.title),
    ).not.toBeInTheDocument();
    expect(container.querySelector("table")).not.toBeInTheDocument();
  });

  it("keeps stamped PUE outstanding balance when no payment registered (T5-031)", () => {
    renderTable({
      invoices: [buildInvoice({ totalPaid: 0, balanceDue: 31920 })],
    });

    // Total + Por cobrar both show the amount until there is a registered payment.
    expect(screen.getAllByText("$31,920.00")).toHaveLength(2);
    expect(screen.queryByText("Liquidada")).not.toBeInTheDocument();
    expect(screen.queryByText("Pagado")).not.toBeInTheDocument();
    expect(screen.getByText("No enviada")).toBeInTheDocument();
  });

  it("keeps draft PUE balance from API until the invoice is stamped", () => {
    renderTable({
      invoices: [
        buildInvoice({
          folio: 2,
          status: "draft",
          total: 35340,
          balanceDue: 35340,
          totalPaid: 0,
        }),
      ],
    });

    expect(screen.getAllByText("$35,340.00")).toHaveLength(2);
    expect(screen.queryByText("Pagado")).not.toBeInTheDocument();
    expect(screen.queryByText("Liquidada")).not.toBeInTheDocument();
  });

  it("keeps stamped PPD outstanding balance", () => {
    renderTable({
      invoices: [
        buildInvoice({
          paymentMethod: "PPD",
          total: 1160,
          balanceDue: 660,
          totalPaid: 500,
        }),
      ],
    });

    expect(screen.getByText("$660.00")).toBeInTheDocument();
  });

  it("formats issuedAt in Mexico civil date (not UTC calendar day)", () => {
    renderTable({
      invoices: [
        buildInvoice({
          folio: 6,
          issuedAt: "2026-08-23T01:50:00.000Z",
        }),
      ],
    });

    expect(screen.getByText("22 ago 2026")).toBeInTheDocument();
    expect(screen.queryByText("23 ago 2026")).not.toBeInTheDocument();
  });

  it("shows billing scope badge and share percent for split_share rows", () => {
    renderTable({
      invoices: [
        buildInvoice({
          billingScope: "split_share",
          sharePercent: 40,
          receiverName: "Cliente B",
        }),
      ],
    });

    expect(screen.getByText("Flete prorrateado")).toBeInTheDocument();
    expect(screen.getByText("40% del flete")).toBeInTheDocument();
  });

  it("hides client / RFC column in client portal mode", () => {
    renderTable({
      invoices: [buildInvoice()],
      isClientPortal: true,
    });

    expect(screen.queryByText("Cliente")).not.toBeInTheDocument();
    expect(screen.queryByText("IIA040805DZ4")).not.toBeInTheDocument();
    expect(
      screen.queryByText("INDUSTRIA ILUMINADORA DE ALMACENES"),
    ).not.toBeInTheDocument();
  });

  it("hides dispatch Envío column and uses Facturado in client portal", () => {
    renderTable({
      invoices: [buildInvoice()],
      isClientPortal: true,
    });

    expect(screen.queryByText("Envío")).not.toBeInTheDocument();
    expect(screen.queryByText("Enviada")).not.toBeInTheDocument();
    expect(screen.queryByText("No enviada")).not.toBeInTheDocument();
    expect(screen.getByText("Facturado")).toBeInTheDocument();
    expect(screen.queryByText("Timbrada")).not.toBeInTheDocument();
  });

  it("shows configured label for stamping status (not raw enum)", () => {
    renderTable({
      invoices: [
        buildInvoice({
          folio: 7,
          status: "stamping",
          balanceDue: 0,
        }),
      ],
    });

    expect(screen.getByText("Timbrando…")).toBeInTheDocument();
    expect(screen.queryByText(/^stamping$/)).not.toBeInTheDocument();
  });

  it("shows payment method as muted secondary text, not a Badge (D4)", () => {
    renderTable({
      invoices: [
        buildInvoice({ paymentMethod: "PPD" }),
        buildInvoice({
          id: "inv-2",
          folio: 2,
          paymentMethod: "PUE",
        }),
      ],
    });

    const credit = screen.getByText("A crédito");
    const cash = screen.getByText("De contado");
    expect(credit).toBeInTheDocument();
    expect(cash).toBeInTheDocument();
    // Método de pago ya no va en Badge outline; solo texto L2.
    expect(credit.closest(".rounded-md")).toBeNull();
    expect(cash.closest(".rounded-md")).toBeNull();
  });

  it("shows Enviada as L2 text when dispatchSentAt is set on stamped rows", () => {
    renderTable({
      invoices: [
        buildInvoice({
          dispatchSentAt: "2026-09-11T12:00:00.000Z",
        }),
      ],
    });

    expect(screen.getByText("Enviada")).toBeInTheDocument();
    expect(screen.getByText("Emitida")).toBeInTheDocument();
  });

  it("shows No enviada as L2 text for stamped rows without dispatchSentAt", () => {
    renderTable({
      invoices: [buildInvoice({ dispatchSentAt: null })],
    });

    expect(screen.getByText("No enviada")).toBeInTheDocument();
  });

  it("shows Envío auto falló as L2 text without a second dispatch badge (D2)", () => {
    renderTable({
      invoices: [
        buildInvoice({
          dispatchSentAt: null,
          autoDispatch: { lastItemStatus: "failed" },
        }),
      ],
    });

    expect(screen.getByText("Envío auto falló")).toBeInTheDocument();
    expect(screen.queryByText("No enviada")).not.toBeInTheDocument();
    expect(screen.getByText("Emitida")).toBeInTheDocument();
  });

  it("hides dispatch L2 for non-stamped staff rows (D3)", () => {
    renderTable({
      invoices: [
        buildInvoice({ status: "draft", dispatchSentAt: null }),
        buildInvoice({
          id: "inv-2",
          folio: 2,
          status: "cancelled",
          dispatchSentAt: null,
        }),
      ],
    });

    expect(screen.queryByText("No enviada")).not.toBeInTheDocument();
    expect(screen.queryByText("Enviada")).not.toBeInTheDocument();
    expect(screen.queryByText("Envío auto falló")).not.toBeInTheDocument();
  });
});
