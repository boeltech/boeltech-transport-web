import type { ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { financeCopy } from "../copy";
import {
  COBROS_INVOICE_NAV_SHEET_THRESHOLD,
  type CobrosInvoiceNavTarget,
} from "../utils/cobrosInvoiceNav";
import { CobrosInvoiceFolioChips, CobrosInvoiceNavCta } from "./CobrosInvoiceNav";

const copy = financeCopy.cobros.invoiceNav;

function renderNav(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

function buildInvoices(count: number): CobrosInvoiceNavTarget[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `inv-${index + 1}`,
    serie: "A",
    folio: 10 + index,
  }));
}

describe("CobrosInvoiceNavCta", () => {
  it("N=1: Ir a factura links to #invoice-payments", () => {
    renderNav(<CobrosInvoiceNavCta invoices={buildInvoices(1)} />);

    expect(
      screen.getByRole("link", { name: copy.goToInvoice }),
    ).toHaveAttribute("href", "/invoices/inv-1#invoice-payments");
    expect(
      screen.queryByRole("button", { name: copy.viewInInvoiceAria }),
    ).not.toBeInTheDocument();
  });

  it("N>1: Ver en factura… lists every invoice without auto-nav to [0]", async () => {
    const user = userEvent.setup();
    renderNav(<CobrosInvoiceNavCta invoices={buildInvoices(3)} />);

    expect(
      screen.queryByRole("link", { name: copy.goToInvoice }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.viewInInvoiceAria }),
    );

    expect(screen.getByText(copy.pickerTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: copy.openInvoice("A-10") }),
    ).toHaveAttribute("href", "/invoices/inv-1#invoice-payments");
    expect(
      screen.getByRole("menuitem", { name: copy.openInvoice("A-11") }),
    ).toHaveAttribute("href", "/invoices/inv-2#invoice-payments");
    expect(
      screen.getByRole("menuitem", { name: copy.openInvoice("A-12") }),
    ).toHaveAttribute("href", "/invoices/inv-3#invoice-payments");
  });

  it("N≥12: opens Sheet instead of dropdown", async () => {
    const user = userEvent.setup();
    renderNav(
      <CobrosInvoiceNavCta
        invoices={buildInvoices(COBROS_INVOICE_NAV_SHEET_THRESHOLD)}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: copy.viewInInvoiceAria }),
    );

    expect(
      screen.getByRole("heading", { name: copy.pickerTitle }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.pickerHint)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.openInvoice("A-10") }),
    ).toHaveAttribute("href", "/invoices/inv-1#invoice-payments");
    expect(
      screen.getByRole("link", {
        name: copy.openInvoice(`A-${9 + COBROS_INVOICE_NAV_SHEET_THRESHOLD}`),
      }),
    ).toBeInTheDocument();
  });
});

describe("CobrosInvoiceFolioChips", () => {
  it("shows ≤3 folios and +N más opens the picker for the full lote", async () => {
    const user = userEvent.setup();
    renderNav(<CobrosInvoiceFolioChips invoices={buildInvoices(5)} />);

    expect(
      screen.getByRole("link", { name: copy.openInvoice("A-10") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.openInvoice("A-11") }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: copy.openInvoice("A-12") }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: copy.openInvoice("A-13") }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: copy.viewInInvoiceAria }),
    );

    const menu = screen.getByRole("menu");
    expect(
      within(menu).getByRole("menuitem", { name: copy.openInvoice("A-13") }),
    ).toHaveAttribute("href", "/invoices/inv-4#invoice-payments");
    expect(
      within(menu).getByRole("menuitem", { name: copy.openInvoice("A-14") }),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.moreInvoices(2))).toBeInTheDocument();
  });
});
