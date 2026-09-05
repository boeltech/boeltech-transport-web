import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ApprovableItem } from "../../domain";
import { ApprovalRow } from "./ApprovalRow";

const tripExpenseItem: ApprovableItem = {
  approvableType: "trip_expense",
  id: "expense-1",
  amount: 500,
  currency: "MXN",
  category: "fuel",
  status: "pending",
  submittedAt: "2026-06-01T10:00:00.000Z",
  submittedBy: "user-1",
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  context: {
    approvableType: "trip_expense",
    tripId: "trip-1",
    tripCode: "V-2026-001",
    driverId: "driver-1",
    driverFullName: "Juan Pérez",
    vehicleId: "vehicle-1",
    vehicleUnitNumber: "T-101",
    expenseCategory: "fuel",
    description: "Diesel",
    occurredAt: "2026-06-01T09:00:00.000Z",
    hasInvoice: true,
  },
};

const advanceItem: ApprovableItem = {
  approvableType: "driver_advance_request",
  id: "adv-1",
  amount: 1500,
  currency: "MXN",
  category: "driver_advance_request",
  status: "pending",
  submittedAt: "2026-08-10T10:00:00.000Z",
  submittedBy: "user-1",
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  context: {
    approvableType: "driver_advance_request",
    advanceId: "adv-1",
    folio: "ANT-2026-001",
    employeeId: "emp-1",
    employeeFullName: "Roberto Garza",
    tripId: "trip-1",
    tripCode: "V-2026-001",
    paymentMethod: "transferencia",
    notes: "Anticipo casetas",
    openAdvancesBalance: 3200,
    openAdvancesCount: 2,
  },
};

describe("ApprovalRow", () => {
  it("renders trip expense row with trip code link and CFDI badge", () => {
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRow
              item={tripExpenseItem}
              selected={false}
              selectable
              canUpdate
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    // El gasto aprobado vive en el tab de costos del viaje.
    expect(screen.getByRole("link", { name: "V-2026-001" })).toHaveAttribute(
      "href",
      "/trips/trip-1?tab=costs",
    );
    expect(screen.getByText("Combustible")).toBeInTheDocument();
    expect(screen.getByText("CFDI validado")).toBeInTheDocument();
  });

  it("renders driver_advance_request row with open debt warning", () => {
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRow
              item={advanceItem}
              selected={false}
              selectable
              canUpdate
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    expect(screen.getByText("ANT-2026-001")).toBeInTheDocument();
    expect(screen.getByText(/Roberto Garza/)).toBeInTheDocument();
    expect(screen.getByText(/Deuda abierta: \$3,200\.00 \(2 anticipos\)/)).toBeInTheDocument();
    expect(screen.getByText(/Método: transferencia/i)).toBeInTheDocument();
  });

  it("renders internal_staff_compensation row with settlement link", () => {
    const compensationItem: ApprovableItem = {
      approvableType: "internal_staff_compensation",
      id: "settlement-123",
      amount: 4500,
      currency: "MXN",
      category: "internal_staff_compensation",
      status: "pending",
      submittedAt: "2026-08-15T10:00:00.000Z",
      submittedBy: "user-1",
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      context: {
        approvableType: "internal_staff_compensation",
        settlementId: "settlement-123",
        settlementNumber: "LIQ-202608-0001",
        employeeId: "emp-1",
        employeeFullName: "Carlos Mendoza",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-15",
        tripsCount: 3,
        grossAmount: 5500,
        totalDeductions: 1000,
        netAmount: 4500,
      },
    };

    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRow
              item={compensationItem}
              selected={false}
              selectable
              canUpdate
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: "LIQ-202608-0001" }),
    ).toHaveAttribute("href", "/finance/settlements/settlement-123");
    expect(screen.getByText(/Carlos Mendoza/)).toBeInTheDocument();
    expect(screen.getAllByText("Liquidación").length).toBeGreaterThanOrEqual(1);
  });

  it("renders fallback for unsupported approvable types", () => {
    const unsupported: ApprovableItem = {
      ...tripExpenseItem,
      approvableType: "fuel_transaction",
      context: { approvableType: "fuel_transaction" } as unknown as ApprovableItem["context"],
    };

    render(
      <table>
        <tbody>
          <ApprovalRow
            item={unsupported}
            selected={false}
            selectable={false}
            canUpdate={false}
            onSelectChange={vi.fn()}
            onApprove={vi.fn()}
            onReject={vi.fn()}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText(/Tipo no soportado/i)).toBeInTheDocument();
  });
});
