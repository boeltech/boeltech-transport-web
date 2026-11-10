import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import type { OperatorPaymentReadiness } from "../../domain/entities";
import { OperatorPaymentReadinessPanel } from "./OperatorPaymentReadinessPanel";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.operatorsList;

function renderPanel(
  operator: OperatorPaymentReadiness | null,
  onAssign = vi.fn(),
) {
  return renderWithTheme(
    <OperatorPaymentReadinessPanel
      operator={operator}
      canAssign
      onAssignTariff={onAssign}
    />,
  );
}

const noTariff: OperatorPaymentReadiness = {
  employeeId: "emp-m",
  fullName: "Martín Salas",
  employmentType: "permanent",
  status: "no_template",
  template: null,
  salary: { amount: 2500, period: "weekly" },
  hasClabe: true,
  openAdvancesCount: 0,
  openAdvancesBalance: 0,
  attentionReasons: ["no_template"],
};

describe("OperatorPaymentReadinessPanel", () => {
  it("muestra 3 pasos y CTA Asignar tarifa sin editar sueldo/CLABE", async () => {
    const user = userEvent.setup();
    const onAssign = vi.fn();
    renderPanel(noTariff, onAssign);

    expect(screen.getByText("Martín Salas")).toBeInTheDocument();
    expect(screen.getByText(copy.panel.stepTariff)).toBeInTheDocument();
    expect(screen.getByText(copy.panel.stepSalary)).toBeInTheDocument();
    expect(screen.getByText(copy.panel.stepAccount)).toBeInTheDocument();
    expect(screen.getByText(copy.panel.stepAccountOk)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.panel.stepSalaryEdit })).toHaveAttribute(
      "href",
      "/employees/emp-m",
    );

    await user.click(screen.getByTestId("operators-panel-assign"));
    expect(onAssign).toHaveBeenCalledWith("emp-m");
  });

  it("Sin CLABE enlaza a Empleados (HB-T5: no muestra dígitos)", () => {
    renderPanel({
      ...noTariff,
      status: "no_clabe",
      template: {
        id: "tpl-1",
        name: "Local estándar",
        version: 3,
        effectiveFrom: "2026-08-15",
        payability: "active",
      },
      hasClabe: false,
      attentionReasons: ["no_clabe"],
    });

    expect(screen.getByText(copy.panel.stepAccountMissing)).toBeInTheDocument();
    expect(screen.getByTestId("operators-panel-clabe-link")).toHaveAttribute(
      "href",
      "/employees/emp-m",
    );
    expect(screen.queryByText(/5521|CLABE\s*\d/i)).not.toBeInTheDocument();
  });
});
