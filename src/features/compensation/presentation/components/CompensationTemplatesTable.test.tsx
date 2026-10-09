import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CompensationTemplatesTable } from "./CompensationTemplatesTable";
import { compensationCopy } from "../copy/compensationCopy";
import { makeCompensationTemplate } from "../utils/makeCompensationTemplate";
import type { CompensationTemplate } from "../../domain/entities";

vi.mock("../../application/hooks", () => ({
  useDeleteCompensationTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useActivateCompensationTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeactivateCompensationTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateCompensationTemplateVersion: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: () => false }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const copy = compensationCopy.templates;
const SUPERSEDED_TOOLTIP =
  "Ya hay otra versión activa de esta tarifa. Esta sigue calculando el pago de los operadores asignados a ella hasta que los reasignes.";
const DEACTIVATED_TOOLTIP =
  "No calcula pagos, ni siquiera de los operadores que sigan asignados a ella.";

const complete = {
  rules: [
    {
      routeType: "long_haul" as const,
      commissionType: "rate_per_km" as const,
      rateValue: 3,
      minimumGuaranteedAmount: 0,
    },
  ],
};

function inactiveTemplate(overrides: Partial<CompensationTemplate> = {}) {
  return makeCompensationTemplate({
    id: "tpl-2",
    name: "Operador foráneo",
    status: "inactive",
    version: 2,
    activeAssignmentsCount: 3,
    ...complete,
    ...overrides,
  });
}

function renderTable(
  templates: CompensationTemplate[],
  layout: "table" | "cards" = "table",
) {
  return render(
    <MemoryRouter>
      <CompensationTemplatesTable
        templates={templates}
        canUpdate
        layout={layout}
        onOpenOperators={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describe("CompensationTemplatesTable — Reemplazada / Desactivada (W5)", () => {
  it("criterio 1: superseded muestra «Reemplazada» + «Sigue pagando a asignados»; tooltip con ratón", async () => {
    const user = userEvent.setup();
    renderTable([inactiveTemplate({ inactiveReason: "superseded" })]);

    expect(screen.getByText(copy.status.superseded)).toBeInTheDocument();
    expect(screen.getByText(copy.usage.supersededPaying)).toBeInTheDocument();
    expect(screen.queryByText(copy.usage.paused)).not.toBeInTheDocument();
    expect(screen.queryByText(/reemplazada por la versión/i)).not.toBeInTheDocument();

    await user.hover(screen.getByText(copy.status.superseded));
    expect(
      await screen.findByRole("tooltip", { name: SUPERSEDED_TOOLTIP }),
    ).toBeInTheDocument();
  });

  it("criterio 1: el tooltip también abre con teclado", async () => {
    const user = userEvent.setup();
    renderTable([inactiveTemplate({ inactiveReason: "superseded" })]);

    const trigger = screen.getByTestId("template-display-status-trigger");
    for (let step = 0; step < 10 && document.activeElement !== trigger; step += 1) {
      await user.tab();
    }
    expect(trigger).toHaveFocus();
    expect(
      await screen.findByRole("tooltip", { name: SUPERSEDED_TOOLTIP }),
    ).toBeInTheDocument();
  });

  it.each([
    ["manual", "manual" as const],
    ["null", null],
  ])("criterio 2: inactive_reason %s muestra «Desactivada» + «Pausada» con tooltip", async (_label, inactiveReason) => {
    const user = userEvent.setup();
    renderTable([inactiveTemplate({ inactiveReason })]);

    expect(screen.getByText(copy.status.deactivated)).toBeInTheDocument();
    expect(screen.getByText(copy.usage.paused)).toBeInTheDocument();

    await user.hover(screen.getByText(copy.status.deactivated));
    expect(
      await screen.findByRole("tooltip", { name: DEACTIVATED_TOOLTIP }),
    ).toBeInTheDocument();
  });

  it("criterio 3: sin inactive_reason muestra «Inactiva» + «Pausada», sin tooltip", async () => {
    const user = userEvent.setup();
    renderTable([inactiveTemplate()]);

    expect(screen.getByText(copy.status.inactive)).toBeInTheDocument();
    expect(screen.getByText(copy.usage.paused)).toBeInTheDocument();
    expect(screen.queryByTestId("template-display-status-trigger")).not.toBeInTheDocument();

    await user.hover(screen.getByText(copy.status.inactive));
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("criterio 4: reemplazada bloqueada ofrece «Ver configuración»", () => {
    renderTable([
      inactiveTemplate({
        inactiveReason: "superseded",
        lockedForEdit: true,
        lockedReason: "superseded",
      }),
    ]);

    expect(screen.getByRole("link", { name: copy.viewConfiguration })).toHaveAttribute(
      "href",
      "/finance/compensation/templates/tpl-2/build",
    );
    expect(screen.queryByRole("link", { name: copy.createVersion })).not.toBeInTheDocument();
  });

  it.each([
    ["used_in_settlements", { lockedReason: "used_in_settlements" as const }],
    ["sin locked_reason (API anterior)", {}],
  ])("criterio 4: usada en pagos (%s) sigue con «Crear nueva versión»", (_label, extra) => {
    renderTable([
      makeCompensationTemplate({
        id: "tpl-1",
        name: "Operador foráneo",
        status: "active",
        lockedForEdit: true,
        ...complete,
        ...extra,
      }),
    ]);

    expect(screen.getByRole("link", { name: copy.createVersion })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: copy.viewConfiguration })).not.toBeInTheDocument();
  });

  it("vista de tarjetas usa la misma insignia, uso y botón", () => {
    renderTable(
      [
        inactiveTemplate({
          inactiveReason: "superseded",
          lockedForEdit: true,
          lockedReason: "superseded",
        }),
      ],
      "cards",
    );

    const card = screen.getByText("Operador foráneo").closest("div.rounded-xl, .shadow-sm") as HTMLElement;
    expect(within(card).getByText(copy.status.superseded)).toBeInTheDocument();
    expect(within(card).getByText(copy.usage.supersededPaying)).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: copy.viewConfiguration })).toBeInTheDocument();
  });
});

describe("CompensationTemplatesTable — columna Operadores (PRD D15/D16)", () => {
  function activeTemplate(overrides: Partial<CompensationTemplate>) {
    return makeCompensationTemplate({
      id: "tpl-1",
      name: "Operador foráneo",
      status: "active",
      ...complete,
      ...overrides,
    });
  }

  const operatorsTrigger = () => screen.getByTestId("template-operators-count-trigger");

  it.each(["table", "cards"] as const)(
    "criterio 11 (%s): 2 vigentes y 1 programada → «2 · +1 programada»",
    (layout) => {
      renderTable(
        [activeTemplate({ activeAssignmentsCount: 2, scheduledAssignmentsCount: 1 })],
        layout,
      );

      expect(operatorsTrigger()).toHaveTextContent(/^2 · \+1 programada$/);
      expect(within(operatorsTrigger()).getByText("· +1 programada")).toHaveClass(
        "text-muted-foreground",
      );
    },
  );

  it("0 vigentes y 2 programadas → «0 · +2 programadas»", () => {
    renderTable([activeTemplate({ activeAssignmentsCount: 0, scheduledAssignmentsCount: 2 })]);

    expect(operatorsTrigger()).toHaveTextContent(/^0 · \+2 programadas$/);
  });

  it.each([
    ["campo ausente (API vieja)", undefined],
    ["0 programadas", 0],
  ])("%s → solo el número", (_label, scheduledAssignmentsCount) => {
    renderTable([activeTemplate({ activeAssignmentsCount: 2, scheduledAssignmentsCount })]);

    expect(operatorsTrigger()).toHaveTextContent(/^2$/);
  });

  it("el tooltip es enfocable con teclado y no usa title", async () => {
    const user = userEvent.setup();
    renderTable([activeTemplate({ activeAssignmentsCount: 2, scheduledAssignmentsCount: 1 })]);

    const trigger = operatorsTrigger();
    expect(trigger).not.toHaveAttribute("title");
    for (let step = 0; step < 10 && document.activeElement !== trigger; step += 1) {
      await user.tab();
    }
    expect(trigger).toHaveFocus();
    expect(
      await screen.findByRole("tooltip", {
        name: "2 operadores cobran con esta versión hoy. 1 más empieza después.",
      }),
    ).toBeInTheDocument();
  });

  it("sin programadas el tooltip solo menciona las vigentes, en singular", async () => {
    const user = userEvent.setup();
    renderTable([activeTemplate({ activeAssignmentsCount: 1 })]);

    await user.hover(operatorsTrigger());
    expect(
      await screen.findByRole("tooltip", { name: "1 operador cobra con esta versión hoy." }),
    ).toBeInTheDocument();
  });
});
