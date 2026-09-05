import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { TemplateCompositionPanel } from "./TemplateCompositionPanel";
import type { CompensationTemplate } from "../../domain/entities";

const incompleteTemplate: CompensationTemplate = {
  id: "tpl-1",
  name: "Borrador",
  isActive: false,
  rules: [],
  fixedAllowances: [],
  corridorIds: [],
  corridors: [],
  activeAssignmentsCount: 0,
};

describe("TemplateCompositionPanel", () => {
  it("shows pending steps alert for incomplete templates", () => {
    render(
      <MemoryRouter>
        <TemplateCompositionPanel
          template={incompleteTemplate}
          id="panel-1"
          embedded
          hideDetailLink
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Para liquidar, agrega reglas por ruta o vincula una ruta con tarifa fija/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Agrega al menos una regla por tipo de ruta \(opción A\)/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Gestionar operadores/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onShowOperatorsTab from acciones del panel", async () => {
    const user = userEvent.setup();
    const onShowOperatorsTab = vi.fn();

    render(
      <MemoryRouter>
        <TemplateCompositionPanel
          template={incompleteTemplate}
          id="panel-2"
          embedded
          hideDetailLink
          canUpdate
          onShowOperatorsTab={onShowOperatorsTab}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Gestionar operadores/i }));
    expect(onShowOperatorsTab).toHaveBeenCalledTimes(1);
  });
});
