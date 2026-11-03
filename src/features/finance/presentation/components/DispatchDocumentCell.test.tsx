import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { DispatchDocumentItem } from "@features/invoicing/domain";
import { DispatchDocumentCell } from "./DispatchDocumentCell";

function buildDoc(
  overrides: Partial<DispatchDocumentItem> = {},
): DispatchDocumentItem {
  return {
    id: "pay-1",
    documentKind: "rep",
    clientId: "client-a",
    clientName: "Demo",
    receiverRfc: "XAXX010101000",
    folioLabel: "REP-abcdef12",
    amount: 100,
    currency: "MXN",
    stampedAt: "2026-08-01T12:00:00.000Z",
    dispatchSentAt: null,
    groupKey: "client-a",
    relatedInvoices: [],
    ...overrides,
  };
}

describe("DispatchDocumentCell", () => {
  it("REP without related shows only seudofolio (no inventar)", () => {
    render(
      <MemoryRouter>
        <DispatchDocumentCell doc={buildDoc()} />
      </MemoryRouter>,
    );
    expect(screen.getByText("REP-abcdef12")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("REP with related shows seudofolio · linked folios and +N", () => {
    render(
      <MemoryRouter>
        <DispatchDocumentCell
          doc={buildDoc({
            relatedInvoices: [
              { id: "inv-1", folioLabel: "A-71" },
              { id: "inv-2", folioLabel: "B-2" },
              { id: "inv-3", folioLabel: "C-3" },
            ],
          })}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText(/REP-abcdef12/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "A-71" })).toHaveAttribute(
      "href",
      "/invoices/inv-1",
    );
    expect(screen.getByRole("link", { name: "B-2" })).toHaveAttribute(
      "href",
      "/invoices/inv-2",
    );
    expect(screen.queryByRole("link", { name: "C-3" })).not.toBeInTheDocument();
    expect(screen.getByText(/\+1/)).toBeInTheDocument();
  });

  it("invoice links to its own detail", () => {
    render(
      <MemoryRouter>
        <DispatchDocumentCell
          doc={buildDoc({
            id: "inv-9",
            documentKind: "invoice",
            folioLabel: "A-10",
          })}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "A-10" })).toHaveAttribute(
      "href",
      "/invoices/inv-9",
    );
  });
});
