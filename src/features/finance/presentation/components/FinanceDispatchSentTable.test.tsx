import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import type { DispatchDocumentItem } from "@features/invoicing/domain";
import { FinanceDispatchSentTable } from "./FinanceDispatchSentTable";

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
    dispatchSentAt: "2026-08-02T09:15:00.000Z",
    groupKey: "client-a",
    relatedInvoices: [],
    ...overrides,
  };
}

function renderTable(
  props: Partial<ComponentProps<typeof FinanceDispatchSentTable>> = {},
) {
  const documents = props.documents ?? [buildDocument()];
  return render(
    <MemoryRouter>
      <FinanceDispatchSentTable
        documents={documents}
        selected={props.selected ?? {}}
        selectable={props.selectable}
        onToggle={props.onToggle ?? vi.fn()}
        onTogglePage={props.onTogglePage ?? vi.fn()}
        onResend={props.onResend ?? vi.fn()}
        onView={props.onView ?? vi.fn()}
        isLoading={props.isLoading}
      />
    </MemoryRouter>,
  );
}

describe("FinanceDispatchSentTable", () => {
  it("links folio and shows receptor + enviado el", () => {
    renderTable();

    const folioLinks = screen.getAllByRole("link", { name: "A-10" });
    expect(folioLinks[0]).toHaveAttribute("href", "/invoices/inv-1");
    expect(screen.getAllByText("Receptor Demo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Enviado el").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Factura").length).toBeGreaterThan(0);
  });

  it("renders short REP seudofolio with row actions menu", () => {
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
    expect(
      screen.getByRole("button", {
        name: /Acciones de REP-abcdef12/,
      }),
    ).toBeInTheDocument();
  });

  it("links related income folios for REP Documento", () => {
    renderTable({
      documents: [
        buildDocument({
          id: "pay-1",
          documentKind: "rep",
          folioLabel: "REP-abcdef12",
          relatedInvoices: [
            { id: "inv-a", folioLabel: "A-71" },
            { id: "inv-b", folioLabel: "B-2" },
          ],
        }),
      ],
    });

    expect(
      screen.getAllByRole("link", { name: "A-71" })[0],
    ).toHaveAttribute("href", "/invoices/inv-a");
    expect(
      screen.getAllByRole("link", { name: "B-2" })[0],
    ).toHaveAttribute("href", "/invoices/inv-b");
    expect(
      screen.getByRole("button", {
        name: /Acciones de REP-abcdef12 · A-71, B-2/,
      }),
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
          clientName: "Otro",
          receiverRfc: "XEXX010101000",
          groupKey: "client-b",
        }),
      ],
      onToggle,
    });

    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar A-10" })[0]!,
    );
    await user.click(
      screen.getAllByRole("checkbox", { name: "Seleccionar A-11" })[0]!,
    );

    expect(onToggle).toHaveBeenCalledTimes(2);
  });
});
