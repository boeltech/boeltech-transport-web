import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApprovableItem } from "../../domain";
import { RejectExpenseSheet } from "./RejectExpenseSheet";

const item: ApprovableItem = {
  approvableType: "trip_expense",
  id: "expense-1",
  amount: 500,
  currency: "MXN",
  category: "fuel",
  status: "pending",
  submittedAt: "2026-06-01T10:00:00.000Z",
  submittedBy: null,
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  context: {
    approvableType: "trip_expense",
    tripId: "trip-1",
    tripCode: "V-001",
    driverId: null,
    driverFullName: null,
    vehicleId: null,
    vehicleUnitNumber: null,
    expenseCategory: "fuel",
    description: null,
    occurredAt: "2026-06-01T09:00:00.000Z",
  },
};

describe("RejectExpenseSheet", () => {
  it("keeps reject button disabled until reason has at least 5 characters", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <RejectExpenseSheet
        open
        onOpenChange={vi.fn()}
        item={item}
        onSubmit={onSubmit}
      />,
    );

    const submitButton = screen.getByRole("button", { name: "Rechazar" });
    expect(submitButton).toBeDisabled();

    await user.type(
      screen.getByLabelText("Razón del rechazo"),
      "1234",
    );
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("Razón del rechazo"), "5");
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);
    expect(onSubmit).toHaveBeenCalledWith("12345", [item]);
  });

  it("links textarea to counter and error via aria-describedby", async () => {
    const user = userEvent.setup();

    render(
      <RejectExpenseSheet
        open
        onOpenChange={vi.fn()}
        item={item}
        onSubmit={vi.fn()}
      />,
    );

    const textarea = screen.getByLabelText("Razón del rechazo");
    expect(textarea).toHaveAttribute(
      "aria-describedby",
      "reject-expense-reason-counter",
    );

    await user.type(screen.getByLabelText("Razón del rechazo"), "1234");
    await user.tab();
    expect(textarea).toHaveAttribute(
      "aria-describedby",
      "reject-expense-reason-counter reject-expense-reason-error",
    );
  });

  it("uses plural title for bulk reject", () => {
    render(
      <RejectExpenseSheet
        open
        onOpenChange={vi.fn()}
        item={null}
        bulkItems={[item, { ...item, id: "expense-2" }]}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText("Rechazar 2 gastos")).toBeInTheDocument();
  });
});
