import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ApprovableItem } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import { ApprovalInbox } from "./ApprovalInbox";

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

const baseProps = {
  items: [tripExpenseItem],
  isLoading: false,
  selectedIds: new Set<string>(),
  canUpdate: true,
  onToggleItem: vi.fn(),
  onToggleAll: vi.fn(),
  onApprove: vi.fn(),
  onReject: vi.fn(),
};

describe("ApprovalInbox F3 D7", () => {
  it("oculta columna Tipo cuando hideTypeColumn (tipo fijo)", () => {
    render(
      <MemoryRouter>
        <ApprovalInbox {...baseProps} hideTypeColumn />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole("columnheader", { name: approvalsCopy.inbox.table.type }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Gasto de viaje")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "V-2026-001" })).toBeInTheDocument();
  });

  it("muestra columna Tipo cuando hideTypeColumn=false", () => {
    render(
      <MemoryRouter>
        <ApprovalInbox {...baseProps} hideTypeColumn={false} />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("columnheader", { name: approvalsCopy.inbox.table.type }),
    ).toBeInTheDocument();
    expect(screen.getByText("Gasto de viaje")).toBeInTheDocument();
  });
});
