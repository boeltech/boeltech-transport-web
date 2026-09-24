import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import type { InvoiceListItem } from "@features/invoicing/domain";
import { FinanceDispatchPendingTable } from "./FinanceDispatchPendingTable";

function buildInvoice(
  overrides: Partial<InvoiceListItem> = {},
): InvoiceListItem {
  return {
    id: "inv-1",
    tenantId: "t-1",
    serie: "A",
    folio: 10,
    cfdiUuid: null,
    receiverRfc: "XAXX010101000",
    receiverName: "Receptor Demo",
    clientId: "client-a",
    clientName: "Cliente A",
    issuedAt: "2026-08-01T12:00:00.000Z",
    paymentForm: "99",
    paymentMethod: "PPD",
    currency: "MXN",
    subtotal: 1000,
    totalTax: 160,
    total: 1160,
    status: "stamped",
    satCancellationStatus: "none",
    satCancellationMessage: null,
    stampedAt: "2026-08-01T12:00:00.000Z",
    dispatchSentAt: null,
    tripCount: 1,
    tripCodes: ["TRP-001", "TRP-002", "TRP-003"],
    totalPaid: 0,
    balanceDue: 1160,
    createdAt: "2026-08-01T10:00:00.000Z",
    createdByName: null,
    ...overrides,
  };
}

function renderTable(
  props: Partial<ComponentProps<typeof FinanceDispatchPendingTable>> = {},
) {
  const invoices = props.invoices ?? [buildInvoice()];
  return render(
    <MemoryRouter>
      <FinanceDispatchPendingTable
        invoices={invoices}
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
  it("links folio and shows receiverName + RFC, not trip clientName", () => {
    renderTable();

    const folioLinks = screen.getAllByRole("link", { name: "A-10" });
    expect(folioLinks[0]).toHaveAttribute("href", "/invoices/inv-1");
    expect(screen.getAllByText("Receptor Demo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("XAXX010101000").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Cliente A")).toHaveLength(0);
    expect(screen.getAllByText("TRP-001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+1").length).toBeGreaterThan(0);
  });

  it("allows selecting invoices from different clients (no RFC anchor)", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderTable({
      invoices: [
        buildInvoice(),
        buildInvoice({
          id: "inv-2",
          folio: 11,
          clientId: "client-b",
          clientName: "Cliente B",
          receiverRfc: "XEXX010101000",
        }),
      ],
      selected: { "inv-1": true },
      onToggle,
    });

    const second = screen.getAllByRole("checkbox", {
      name: "Seleccionar factura A-11",
    })[0]!;
    expect(second).toBeEnabled();
    await user.click(second);
    expect(onToggle).toHaveBeenCalledWith(
      expect.objectContaining({ id: "inv-2", clientId: "client-b" }),
      true,
    );
  });

  it("shows Envío auto falló badge when lastItemStatus is failed", () => {
    renderTable({
      invoices: [
        buildInvoice({
          autoDispatch: {
            enabledForClient: true,
            lastScheduledRunId: "run-1",
            lastItemStatus: "failed",
            lastError: "SMTP",
          },
        }),
      ],
    });

    expect(screen.getAllByText("Envío auto falló").length).toBeGreaterThan(0);
  });

  it("shows Automático al corte when enabled and not failed", () => {
    renderTable({
      invoices: [
        buildInvoice({
          autoDispatch: {
            enabledForClient: true,
            lastScheduledRunId: null,
            lastItemStatus: null,
            lastError: null,
          },
        }),
      ],
    });

    expect(
      screen.getAllByText("Automático al corte").length,
    ).toBeGreaterThan(0);
  });

  it("hides checkboxes when selectable is false", () => {
    renderTable({ selectable: false });

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });
});
