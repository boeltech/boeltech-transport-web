import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import type { InvoiceListItem } from "@features/invoicing/domain";
import { FinanceDispatchSentTable } from "./FinanceDispatchSentTable";

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
    dispatchSentAt: "2026-08-02T09:15:00.000Z",
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
  props: Partial<ComponentProps<typeof FinanceDispatchSentTable>> = {},
) {
  const invoices = props.invoices ?? [buildInvoice()];
  return render(
    <MemoryRouter>
      <FinanceDispatchSentTable
        invoices={invoices}
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
  it("links folio, shows Enviada el and receiverName, not trip clientName", () => {
    renderTable();

    const folioLinks = screen.getAllByRole("link", { name: "A-10" });
    expect(folioLinks[0]).toHaveAttribute("href", "/invoices/inv-1");
    expect(screen.getAllByText("Receptor Demo").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Cliente A")).toHaveLength(0);
    expect(screen.getAllByText("Enviada el").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Manual").length).toBeGreaterThan(0);
    expect(screen.getAllByText("TRP-001").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+1").length).toBeGreaterThan(0);
  });

  it("shows Automática when lastScheduledRunId is set", () => {
    renderTable({
      invoices: [
        buildInvoice({
          autoDispatch: {
            enabledForClient: true,
            lastScheduledRunId: "run-9",
            lastItemStatus: "sent",
            lastError: null,
          },
        }),
      ],
    });

    expect(screen.getAllByText("Automática").length).toBeGreaterThan(0);
  });

  it("allows selecting invoices from different clients", async () => {
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

  it("exposes Reenviar and Ver factura in row menu", async () => {
    const user = userEvent.setup();
    const onResend = vi.fn();
    const onView = vi.fn();
    renderTable({ onResend, onView });

    await user.click(
      screen.getAllByRole("button", { name: "Acciones de factura A-10" })[0]!,
    );
    await user.click(screen.getByRole("menuitem", { name: "Ver factura" }));
    expect(onView).toHaveBeenCalledWith(
      expect.objectContaining({ id: "inv-1" }),
    );

    await user.click(
      screen.getAllByRole("button", { name: "Acciones de factura A-10" })[0]!,
    );
    await user.click(screen.getByRole("menuitem", { name: "Reenviar" }));
    await waitFor(() => {
      expect(onResend).toHaveBeenCalledWith(
        expect.objectContaining({ id: "inv-1" }),
      );
    });
  });

  it("hides checkboxes and Reenviar without selectable", async () => {
    const user = userEvent.setup();
    renderTable({ selectable: false });

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: "Acciones de factura A-10" })[0]!,
    );
    expect(
      screen.queryByRole("menuitem", { name: "Reenviar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Ver factura" }),
    ).toBeInTheDocument();
  });
});
