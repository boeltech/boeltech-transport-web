import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import type { FinanceInvoiceListItem } from "@features/finance/domain";
import { FinanceCobrosInvoiceTable } from "./FinanceCobrosInvoiceTable";

function buildInvoice(
  overrides: Partial<FinanceInvoiceListItem> = {},
): FinanceInvoiceListItem {
  return {
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
    ...overrides,
  };
}

function renderTable(
  props: Partial<ComponentProps<typeof FinanceCobrosInvoiceTable>> = {},
) {
  const invoices = props.invoices ?? [buildInvoice()];
  return render(
    <MemoryRouter>
      <FinanceCobrosInvoiceTable
        invoices={invoices}
        selected={props.selected ?? {}}
        anchorRfc={props.anchorRfc}
        onToggle={props.onToggle ?? vi.fn()}
        onTogglePage={props.onTogglePage ?? vi.fn()}
        isLoading={props.isLoading}
      />
    </MemoryRouter>,
  );
}

describe("FinanceCobrosInvoiceTable", () => {
  it("links the folio and shows client with RFC for the mixed queue", () => {
    renderTable();

    const folioLinks = screen.getAllByRole("link", { name: "A-10" });
    expect(folioLinks[0]).toHaveAttribute("href", "/invoices/inv-1");
    expect(screen.getAllByText("TRP-001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cliente Demo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("XAXX010101000").length).toBeGreaterThan(0);
    expect(screen.queryByText("A crédito")).not.toBeInTheDocument();
  });

  it("disables checkboxes for invoices outside the selection RFC anchor", () => {
    renderTable({
      invoices: [
        buildInvoice(),
        buildInvoice({
          id: "inv-2",
          folio: 11,
          receiverRfc: "XEXX010101000",
          receiverName: "Otro",
        }),
      ],
      selected: { "inv-1": true },
      anchorRfc: "XAXX010101000",
    });

    expect(
      screen.getAllByRole("checkbox", { name: "Seleccionar factura A-10" })[0],
    ).toBeEnabled();
    expect(
      screen.getAllByRole("checkbox", {
        name: "No seleccionable: factura A-11 es de otro RFC",
      })[0],
    ).toBeDisabled();
  });

  it("selects the current page from the header checkbox", async () => {
    const user = userEvent.setup();
    const onTogglePage = vi.fn();
    renderTable({
      invoices: [
        buildInvoice(),
        buildInvoice({ id: "inv-2", folio: 11, tripCodes: [] }),
      ],
      onTogglePage,
    });

    const selectAll = screen.getAllByRole("checkbox", {
      name: "Seleccionar todas las facturas del mismo RFC en esta página",
    });
    await user.click(selectAll[0]!);
    expect(onTogglePage).toHaveBeenCalledWith(true);
  });
});
