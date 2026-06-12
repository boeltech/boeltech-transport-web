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
  },
};

describe("ApprovalRow", () => {
  it("renders trip expense row with trip code link", () => {
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

    expect(screen.getByRole("link", { name: "V-2026-001" })).toHaveAttribute(
      "href",
      "/trips/trip-1",
    );
    expect(screen.getByText("Combustible")).toBeInTheDocument();
  });

  it("renders fallback for unsupported approvable types", () => {
    const unsupported: ApprovableItem = {
      ...tripExpenseItem,
      approvableType: "fuel_transaction",
      context: { approvableType: "fuel_transaction" },
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
