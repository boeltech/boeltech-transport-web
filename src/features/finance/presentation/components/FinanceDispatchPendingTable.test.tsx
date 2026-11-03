import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { ComponentProps } from "react";
import type { DispatchDocumentItem } from "@features/invoicing/domain";
import { FinanceDispatchPendingTable } from "./FinanceDispatchPendingTable";

function buildDocument(
  overrides: Partial<DispatchDocumentItem> = {},
): DispatchDocumentItem {
  return {
    id: "inv-1",
    documentKind: "invoice",
    clientId: "client-a",
    clientName: "Receptor Demo",
    receiverRfc: "XAXX010101000",
    folioLabel: "A-10",
    amount: 1160,
    currency: "MXN",
    stampedAt: "2026-08-01T12:00:00.000Z",
    dispatchSentAt: null,
    groupKey: "client-a",
    relatedInvoices: [],
    ...overrides,
  };
}

function renderTable(
  props: Partial<ComponentProps<typeof FinanceDispatchPendingTable>> = {},
) {
  const documents = props.documents ?? [buildDocument()];
  return render(
    <MemoryRouter>
      <FinanceDispatchPendingTable
        documents={documents}
        selected={props.selected ?? {}}
        selectable={props.selectable}
        onToggle={props.onToggle ?? vi.fn()}
        onTogglePage={props.onTogglePage ?? vi.fn()}
        isLoading={props.isLoading}
      />
    </MemoryRouter>,
  );
}

describe("FinanceDispatchPendingTable", () => {
  it("links folio and shows receptor + RFC", () => {
    renderTable();

    const folioLinks = screen.getAllByRole("link", { name: "A-10" });
    expect(folioLinks[0]).toHaveAttribute("href", "/invoices/inv-1");
    expect(screen.getAllByText("Receptor Demo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("XAXX010101000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Factura").length).toBeGreaterThan(0);
  });

  it("preserves the envíos queue in location.state.from", async () => {
    const user = userEvent.setup();
    function InvoiceProbe() {
      const location = useLocation();
      return <div>{JSON.stringify(location.state)}</div>;
    }

    render(
      <MemoryRouter initialEntries={["/finance/dispatch?tab=pending"]}>
        <Routes>
          <Route
            path="/finance/dispatch"
            element={
              <FinanceDispatchPendingTable
                documents={[buildDocument()]}
                selected={{}}
                onToggle={vi.fn()}
                onTogglePage={vi.fn()}
              />
            }
          />
          <Route path="/invoices/:id" element={<InvoiceProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getAllByRole("link", { name: "A-10" })[0]);
    expect(
      screen.getByText(
        JSON.stringify({ from: "/finance/dispatch?tab=pending" }),
      ),
    ).toBeInTheDocument();
  });

  it("allows selecting documents from different clients", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderTable({
      documents: [
        buildDocument(),
        buildDocument({
          id: "inv-2",
          folioLabel: "A-11",
          clientId: "client-b",
          clientName: "Cliente B",
          receiverRfc: "XEXX010101000",
          groupKey: "client-b",
        }),
      ],
      selected: { "invoice:inv-1": true },
      onToggle,
    });

    const second = screen.getAllByRole("checkbox", {
      name: "Seleccionar A-11",
    })[0]!;
    expect(second).toBeEnabled();
    await user.click(second);
    expect(onToggle).toHaveBeenCalledWith(
      expect.objectContaining({ id: "inv-2", clientId: "client-b" }),
      true,
    );
  });

  it("shows short seudofolio for REP rows without related", () => {
    renderTable({
      documents: [
        buildDocument({
          id: "pay-1",
          documentKind: "rep",
          folioLabel: "REP-abcdef12",
        }),
      ],
    });

    expect(screen.getAllByText("REP-abcdef12").length).toBeGreaterThan(0);
    expect(screen.getAllByText("REP").length).toBeGreaterThan(0);
    expect(screen.queryByRole("link", { name: "A-71" })).not.toBeInTheDocument();
  });

  it("links related income folios for REP (cap 2 +N)", () => {
    renderTable({
      documents: [
        buildDocument({
          id: "pay-1",
          documentKind: "rep",
          folioLabel: "REP-abcdef12",
          relatedInvoices: [
            { id: "inv-a", folioLabel: "A-71" },
            { id: "inv-b", folioLabel: "B-2" },
            { id: "inv-c", folioLabel: "C-3" },
          ],
        }),
      ],
    });

    expect(screen.getAllByText(/REP-abcdef12/).length).toBeGreaterThan(0);
    const linkA = screen.getAllByRole("link", { name: "A-71" })[0];
    const linkB = screen.getAllByRole("link", { name: "B-2" })[0];
    expect(linkA).toHaveAttribute("href", "/invoices/inv-a");
    expect(linkB).toHaveAttribute("href", "/invoices/inv-b");
    expect(screen.queryByRole("link", { name: "C-3" })).not.toBeInTheDocument();
    expect(screen.getAllByText(/\+1/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("REP").length).toBeGreaterThan(0);
  });

  it("hides checkboxes when selectable is false", () => {
    renderTable({ selectable: false });

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
