/**
 * Tabla bandeja Cobros sin factura — una tabla con filas de grupo por cliente.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { OperationalCashPendingTrip } from "@features/finance/domain";
import {
  grantPermissions,
  resetPermissionsMock,
} from "@/test/mocks/permissions";
import { financeCopy, operationalReceiptBatchCopy } from "../copy";
import type { OperationalCashPendingClientGroup } from "../utils/groupOperationalCashPending";
import { OperationalCashPendingTable } from "./OperationalCashPendingTable";

vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

vi.mock("./OperationalReceiptBatchSheet", () => ({
  OperationalReceiptBatchSheet: () => null,
}));

const copy = financeCopy.efectivoPorCobrar;
const trayCopy = operationalReceiptBatchCopy.tray;

function buildTrip(
  overrides: Partial<OperationalCashPendingTrip> = {},
): OperationalCashPendingTrip {
  return {
    id: "trip-1",
    code: "V-100",
    status: "completed",
    clientId: "client-a",
    clientName: "Cliente Alpha",
    baseRate: 10000,
    scheduledDeparture: "2026-11-01T12:00:00.000Z",
    operationalCash: {
      status: "pending",
      collectedTotal: 0,
      pendingAmount: 10000,
      receiptCount: 0,
    },
    lastActiveReceipt: null,
    ...overrides,
  };
}

function buildGroup(
  overrides: Partial<OperationalCashPendingClientGroup> = {},
): OperationalCashPendingClientGroup {
  return {
    clientId: "client-a",
    clientName: "Cliente Alpha",
    pendingAmount: 10000,
    tripCount: 1,
    trips: [buildTrip()],
    ...overrides,
  };
}

const betaGroup = buildGroup({
  clientId: "client-b",
  clientName: "ORGANICOS ÑAVEZ OSORIO",
  pendingAmount: 3000,
  tripCount: 1,
  trips: [
    buildTrip({
      id: "trip-2",
      code: "V-200",
      status: "in_progress",
      clientId: "client-b",
      clientName: "ORGANICOS ÑAVEZ OSORIO",
      baseRate: 5000,
      operationalCash: {
        status: "partial",
        collectedTotal: 2000,
        pendingAmount: 3000,
        receiptCount: 1,
      },
      lastActiveReceipt: {
        paymentInstrument: "cash",
        reference: null,
        batchId: "batch-1",
        collectedAt: "2026-11-02T12:00:00.000Z",
      },
    }),
  ],
});

function renderTable(groups: OperationalCashPendingClientGroup[]) {
  return render(
    <MemoryRouter initialEntries={["/finance/operational-cash-pending"]}>
      <OperationalCashPendingTable groups={groups} isLoading={false} />
    </MemoryRouter>,
  );
}

function groupRows(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll("tr[data-entity-group-row]"));
}

describe("OperationalCashPendingTable", () => {
  beforeEach(() => {
    resetPermissionsMock();
    grantPermissions("all");
  });

  it("un solo encabezado de columnas y una fila de grupo por cliente", () => {
    const { container } = renderTable([buildGroup(), betaGroup]);

    expect(screen.getAllByRole("table")).toHaveLength(1);
    expect(container.querySelectorAll("thead")).toHaveLength(1);
    expect(
      screen.getAllByRole("columnheader", { name: copy.columns.pending }),
    ).toHaveLength(1);

    const rows = groupRows(container);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Cliente Alpha");
    expect(rows[1]).toHaveTextContent("ORGANICOS ÑAVEZ OSORIO");
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("subtotal del cliente en la columna Por cobrar, sin «Subtotal»", () => {
    const { container } = renderTable([buildGroup(), betaGroup]);

    const headers = screen.getAllByRole("columnheader");
    const pendingIndex = headers.findIndex(
      (h) => h.textContent === copy.columns.pending,
    );

    const [alphaRow] = groupRows(container);
    const cells = within(alphaRow!).getAllByRole("cell");
    const labelSpan = Number(cells[0]!.getAttribute("colspan") ?? "1");
    const subtotalCell = cells[pendingIndex - labelSpan + 1]!;
    expect(subtotalCell).toHaveTextContent(formatMxCurrency(10000));
    expect(subtotalCell.className).toContain("font-semibold");
    expect(subtotalCell.className).toContain("text-right");
    expect(screen.queryByText(/Subtotal/)).not.toBeInTheDocument();
  });

  it("cliente partido entre páginas: «k de n viajes» y subtotal = total del cliente", () => {
    const { container } = renderTable([
      buildGroup({ tripCount: 3, pendingAmount: 30000 }),
    ]);

    const [row] = groupRows(container);
    expect(row).toHaveTextContent(copy.groupTripCount(3, 1));
    expect(row).toHaveTextContent("1 de 3 viajes");
    expect(row).toHaveTextContent(formatMxCurrency(30000));
  });

  it("cliente completo en página: «N viajes» sin «de»", () => {
    const { container } = renderTable([buildGroup()]);
    const [row] = groupRows(container);
    expect(row).toHaveTextContent("1 viaje");
    expect(row).not.toHaveTextContent(/ de /);
  });

  it("un solo badge por fila: sin columna Cobro (Pendiente/Parcial)", () => {
    renderTable([buildGroup(), betaGroup]);
    expect(
      screen.queryByRole("columnheader", { name: "Cobro" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Parcial")).not.toBeInTheDocument();
    expect(screen.queryByText("Pendiente")).not.toBeInTheDocument();
  });

  it("Cobrado: «Sin abonos» si 0; «Último: … · Lote» si hay abonos", () => {
    renderTable([buildGroup(), betaGroup]);
    expect(screen.getByText(copy.noReceipts)).toBeInTheDocument();
    expect(
      screen.getByText(trayCopy.lastReceipt("Efectivo", null), {
        exact: false,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: trayCopy.batchLink }),
    ).toBeInTheDocument();
  });

  it("sin operational_cash.create no se ve «Cobro por lote»", () => {
    grantPermissions(["finance.read"]);
    renderTable([buildGroup(), betaGroup]);
    expect(
      screen.queryByRole("link", { name: /cobro por lote/i }),
    ).not.toBeInTheDocument();
  });

  it("orden de tab: lote del grupo → código de viaje → Abrir Costos → lote del siguiente grupo", async () => {
    const user = userEvent.setup();
    const betaWithoutReceipts = buildGroup({
      ...betaGroup,
      trips: [buildTrip({ id: "trip-2", code: "V-200", clientId: "client-b" })],
    });
    renderTable([buildGroup(), betaWithoutReceipts]);

    await user.tab();
    expect(
      screen.getByRole("link", {
        name: copy.groupBatchAria("Cliente Alpha"),
      }),
    ).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "V-100" })).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("link", { name: copy.openCostsAria("V-100") }),
    ).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole("link", {
        name: copy.groupBatchAria("ORGANICOS ÑAVEZ OSORIO"),
      }),
    ).toHaveFocus();
  });

  it("propaga state.from de la bandeja al Link de Cobro por lote", async () => {
    const user = userEvent.setup();
    function CreateProbe() {
      const location = useLocation();
      return <div>{JSON.stringify(location.state)}</div>;
    }

    render(
      <MemoryRouter
        initialEntries={[
          "/finance/operational-cash-pending?clientId=client-a&page=2",
        ]}
      >
        <Routes>
          <Route
            path="/finance/operational-cash-pending"
            element={
              <OperationalCashPendingTable
                groups={[buildGroup()]}
                isLoading={false}
              />
            }
          />
          <Route
            path="/finance/collections/new"
            element={<CreateProbe />}
          />
        </Routes>
      </MemoryRouter>,
    );

    const batchLink = screen.getByRole("link", {
      name: copy.groupBatchAria("Cliente Alpha"),
    });
    expect(batchLink).toHaveTextContent(copy.groupBatchCta);
    await user.click(batchLink);

    expect(
      screen.getByText(
        JSON.stringify({
          from: "/finance/operational-cash-pending?clientId=client-a&page=2",
        }),
      ),
    ).toBeInTheDocument();
  });
});
