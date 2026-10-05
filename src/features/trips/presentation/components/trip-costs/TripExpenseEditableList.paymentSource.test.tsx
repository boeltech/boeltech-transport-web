import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  TripExpenseEditableList,
  type TripExpenseListItem,
} from "./TripExpenseEditableList";

vi.mock("@features/approvals", async () => ({
  ...(await import("@features/approvals/testing/selfApprovalTestModule")),
}));

function makeItem(overrides: Partial<TripExpenseListItem>): TripExpenseListItem {
  return {
    id: "exp-1",
    category: "tolls",
    description: "Casetas MTY–SLP",
    amount: 400,
    status: "approved",
    ...overrides,
  };
}

function renderList(items: TripExpenseListItem[]) {
  return render(
    <TripExpenseEditableList
      items={items}
      emptyTitle="Sin gastos"
      emptyDescription="—"
      showDetailMeta
    />,
  );
}

describe("TripExpenseEditableList — badge «Quién pagó»", () => {
  it("company: muestra badge «Empresa»", () => {
    renderList([makeItem({ paymentSource: "company" })]);
    expect(screen.getByText("Empresa")).toBeInTheDocument();
    expect(screen.queryByText("Con anticipo")).not.toBeInTheDocument();
  });

  it("advance: muestra badge «Con anticipo»", () => {
    renderList([makeItem({ paymentSource: "advance" })]);
    expect(screen.getByText("Con anticipo")).toBeInTheDocument();
    expect(screen.queryByText("Empresa")).not.toBeInTheDocument();
  });

  it("driver: sin badge adicional", () => {
    renderList([makeItem({ paymentSource: "driver" })]);
    expect(screen.queryByText("Empresa")).not.toBeInTheDocument();
    expect(screen.queryByText("Con anticipo")).not.toBeInTheDocument();
  });

  it("sin paymentSource (legacy): sin badge adicional", () => {
    renderList([makeItem({})]);
    expect(screen.queryByText("Empresa")).not.toBeInTheDocument();
    expect(screen.queryByText("Con anticipo")).not.toBeInTheDocument();
  });
});
