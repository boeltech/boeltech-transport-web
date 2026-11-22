import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";
import { BuilderInspectorPanel } from "./BuilderInspectorPanel";
import { makeCompensationTemplate } from "../utils/makeCompensationTemplate";
import { templateToForm } from "../utils/templateFormMappers";
import { compensationCopy } from "../copy/compensationCopy";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";

vi.mock("./BuilderSimulationPanel", () => ({
  BuilderSimulationPanel: () => <div data-testid="builder-sim-panel">sim</div>,
}));

vi.mock("./BuilderHistoryPanel", () => ({
  BuilderHistoryPanel: () => <div data-testid="builder-history-panel">hist</div>,
}));

const template = makeCompensationTemplate({
  id: "tpl-1",
  name: "Operador foráneo",
  rules: [
    {
      routeType: "long_haul",
      commissionType: "rate_per_km",
      rateValue: 3,
      minimumGuaranteedAmount: 0,
      notes: null,
    },
  ],
});

const simCopy = compensationCopy.simulation;
const builderCopy = compensationCopy.builder;

function Harness() {
  const form = useForm<CompensationTemplateFormData>({
    defaultValues: templateToForm(template),
  });
  return (
    <MemoryRouter>
      <FormProvider {...form}>
        <BuilderInspectorPanel control={form.control} template={template} />
      </FormProvider>
    </MemoryRouter>
  );
}

describe("BuilderInspectorPanel — Tabs canónico (B-tabs-opt)", () => {
  it("usa tablist canónico con labels Resumen / Simulación / Historial (C2=0)", () => {
    render(<Harness />);

    const tablist = screen.getByRole("tablist", { name: "Inspector" });
    expect(tablist).toBeInTheDocument();

    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual([
      simCopy.summaryTabLabel,
      simCopy.tabLabel,
      builderCopy.historyTabLabel,
    ]);
    expect(tabs.map((t) => t.textContent)).toEqual([
      "Resumen",
      "Simulación",
      "Historial",
    ]);

    expect(screen.getByText(builderCopy.inspectorLiveLabel)).toBeInTheDocument();
  });

  it("cambia de panel al activar Simulación e Historial", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryByTestId("builder-sim-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("builder-history-panel")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: simCopy.tabLabel }));
    expect(screen.getByTestId("builder-sim-panel")).toBeInTheDocument();
    expect(screen.queryByText(builderCopy.inspectorLiveLabel)).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: builderCopy.historyTabLabel }));
    expect(screen.getByTestId("builder-history-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("builder-sim-panel")).not.toBeInTheDocument();
  });
});
