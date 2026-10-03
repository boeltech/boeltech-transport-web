import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  TripExpenseEditableList,
  type TripExpenseListItem,
} from "./TripExpenseEditableList";

vi.mock("@features/approvals", async () => ({
  ...(await import("@features/approvals/testing/selfApprovalTestModule")),
}));

const pendingExpense: TripExpenseListItem = {
  id: "exp-1",
  category: "fuel",
  description: "Diesel Querétaro",
  amount: 1200,
  status: "pending",
  createdBy: "user-1",
};

function renderList(
  items: TripExpenseListItem[],
  getSelfActionUi?: Parameters<typeof TripExpenseEditableList>[0]["getSelfActionUi"],
) {
  return render(
    <TripExpenseEditableList
      items={items}
      emptyTitle="Sin gastos"
      emptyDescription="—"
      showDetailMeta
      onApprove={vi.fn()}
      onReject={vi.fn()}
      getSelfActionUi={getSelfActionUi}
    />,
  );
}

describe("TripExpenseEditableList autoaprobación (ADR-0098)", () => {
  it("normal: ✓ Aprobar a un clic y Rechazar en ⋯ (D8/D14)", () => {
    renderList([pendingExpense], () => "normal");

    expect(screen.getByRole("button", { name: "Aprobar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Más acciones" })).toBeInTheDocument();
    expect(screen.queryByText("Enviada por ti")).not.toBeInTheDocument();
  });

  it("blocked_own: reemplaza las acciones por «Enviada por ti»", () => {
    renderList([pendingExpense], () => "blocked_own");

    expect(screen.getByText("Enviada por ti")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Más acciones" })).not.toBeInTheDocument();
  });

  it("self_confirm: conserva las acciones (la confirmación vive en el tab)", () => {
    renderList([pendingExpense], () => "self_confirm");

    expect(screen.getByRole("button", { name: "Aprobar" })).toBeInTheDocument();
    expect(screen.queryByText("Enviada por ti")).not.toBeInTheDocument();
  });

  it("badge «Autoaprobado» con evidencia del API", () => {
    renderList([
      { ...pendingExpense, status: "approved", selfSegregatedApproval: true },
    ]);

    expect(screen.getByText("Autoaprobado")).toBeInTheDocument();
  });

  it("P2-2: sin badge en un gasto autorrechazado", () => {
    renderList([
      { ...pendingExpense, status: "rejected", selfSegregatedApproval: true },
    ]);

    expect(screen.queryByText("Autoaprobado")).not.toBeInTheDocument();
  });

  it("sin chip en gastos ya revisados aunque sean propios", () => {
    renderList([{ ...pendingExpense, status: "approved" }], () => "blocked_own");

    expect(screen.queryByText("Enviada por ti")).not.toBeInTheDocument();
  });
});
