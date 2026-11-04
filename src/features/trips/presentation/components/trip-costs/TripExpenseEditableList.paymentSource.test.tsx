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

  it("muestra el badge Regreso vacío por la marca, no por la descripción", () => {
    render(
      <TripExpenseEditableList
        items={[
          makeItem({
            category: "fuel",
            description: "Carga de diésel",
            isEmptyReturn: true,
          }),
        ]}
        emptyTitle="Sin gastos"
        emptyDescription="—"
        onRemove={() => undefined}
      />,
    );
    expect(screen.getByText("Regreso vacío")).toBeInTheDocument();
    expect(
      screen.getByText(/elimine este concepto antes de aprobarlo/i),
    ).toBeInTheDocument();
  });

  it("no muestra el badge si la descripción menciona el regreso pero no hay marca", () => {
    renderList([
      makeItem({
        category: "fuel",
        description: "Diésel del regreso vacío",
        isEmptyReturn: false,
      }),
    ]);
    expect(screen.queryByText("Regreso vacío")).not.toBeInTheDocument();
  });

  it("sin paymentSource (legacy): sin badge adicional", () => {
    renderList([makeItem({})]);
    expect(screen.queryByText("Empresa")).not.toBeInTheDocument();
    expect(screen.queryByText("Con anticipo")).not.toBeInTheDocument();
  });
});
