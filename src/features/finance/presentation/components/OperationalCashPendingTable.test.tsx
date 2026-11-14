/**
 * Tabla bandeja Cobros sin factura — wayfinding al alta + copy subtotal paginado.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
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

function buildGroup(
  overrides: Partial<OperationalCashPendingClientGroup> = {},
): OperationalCashPendingClientGroup {
  return {
    clientId: "client-a",
    clientName: "Cliente Alpha",
    pendingAmount: 20000,
    tripCount: 2,
    trips: [
      {
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
      },
    ],
    ...overrides,
  };
}

describe("OperationalCashPendingTable", () => {
  beforeEach(() => {
    resetPermissionsMock();
    grantPermissions("all");
  });

  it("propaga state.from de la bandeja al Link de Registrar cobro por lote", async () => {
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
            path="/clients/:id/operational-receipt-batches/new"
            element={<CreateProbe />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(
      screen.getByRole("link", { name: trayCopy.registerBatchCta }),
    );

    expect(
      screen.getByText(
        JSON.stringify({
          from: "/finance/operational-cash-pending?clientId=client-a&page=2",
        }),
      ),
    ).toBeInTheDocument();
  });

  it("aclara subtotal del cliente cuando hay menos filas visibles que tripCount", () => {
    render(
      <MemoryRouter initialEntries={["/finance/operational-cash-pending"]}>
        <OperationalCashPendingTable
          groups={[buildGroup({ tripCount: 3, pendingAmount: 30000 })]}
          isLoading={false}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(
        copy.clientSubtotal(formatMxCurrency(30000), 3, 1),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/mostrando 1 de 3/)).toBeInTheDocument();
    expect(screen.getByText(/Subtotal del cliente/)).toBeInTheDocument();
  });

  it("no muestra «mostrando k de n» cuando todas las filas del cliente están en página", () => {
    render(
      <MemoryRouter initialEntries={["/finance/operational-cash-pending"]}>
        <OperationalCashPendingTable
          groups={[
            buildGroup({
              tripCount: 1,
              pendingAmount: 10000,
              trips: [
                {
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
                },
              ],
            }),
          ]}
          isLoading={false}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(copy.clientSubtotal(formatMxCurrency(10000), 1, 1)),
    ).toBeInTheDocument();
    expect(screen.queryByText(/mostrando/)).not.toBeInTheDocument();
  });
});
