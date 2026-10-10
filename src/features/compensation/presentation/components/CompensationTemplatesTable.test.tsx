import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CompensationTemplatesTable } from "./CompensationTemplatesTable";
import { compensationCopy } from "../copy/compensationCopy";
import { makeCompensationTemplate } from "../utils/makeCompensationTemplate";
import type { CompensationTemplate } from "../../domain/entities";
import { compensationTemplateBuildPath } from "../../application/compensationRoutes";

const mockHasPermission = vi.fn();
const mockUseTemplateVersions = vi.fn();

vi.mock("../../application/hooks", () => ({
  useTemplateVersions: (...args: unknown[]) => mockUseTemplateVersions(...args),
  useDeleteCompensationTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useActivateCompensationTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeactivateCompensationTemplate: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateCompensationTemplateVersion: () => ({ mutateAsync: vi.fn(), isPending: false }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (...args: unknown[]) => mockHasPermission(...args),
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

const copy = compensationCopy.templates;
const MENU = compensationCopy.templateActions.openMenuSr;
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

function activeTemplate(overrides: Partial<CompensationTemplate> = {}) {
  return makeCompensationTemplate({
    id: "tpl-1",
    name: "Operador foráneo",
    status: "active",
    ...complete,
    ...overrides,
  });
}

function renderTable(
  templates: CompensationTemplate[],
  layout: "table" | "cards" = "table",
  extra: {
    onOpenOperators?: Mock<(templateId: string, assignEmployeeId?: string) => void>;
    pendingEmployeeId?: string;
  } = {},
) {
  const onOpenOperators =
    extra.onOpenOperators ?? vi.fn<(templateId: string, assignEmployeeId?: string) => void>();
  render(
    <MemoryRouter>
      <CompensationTemplatesTable
        templates={templates}
        layout={layout}
        pendingEmployeeId={extra.pendingEmployeeId}
        onOpenOperators={onOpenOperators}
      />
    </MemoryRouter>,
  );
  return { onOpenOperators };
}

function bodyRows(): HTMLElement[] {
  return screen.getAllByRole("row").slice(1);
}

/** Botones y enlaces visibles de la celda de acciones, sin el disparador «···». */
function visibleRowActions(container: HTMLElement): HTMLElement[] {
  const actions = within(container).getByTestId("template-row-actions");
  return [
    ...within(actions).queryAllByRole("button"),
    ...within(actions).queryAllByRole("link"),
  ].filter((element) => element.getAttribute("aria-haspopup") !== "menu");
}

beforeEach(() => {
  vi.clearAllMocks();
  mockHasPermission.mockImplementation(() => true);
  mockUseTemplateVersions.mockReturnValue({
    data: undefined,
    isError: false,
    isFetching: true,
    refetch: vi.fn(),
  });
});

describe("CompensationTemplatesTable — columna Estado (PRD D10)", () => {
  it("CA6: no hay columna «Uso»; activa completa muestra solo «Activa»", () => {
    renderTable([activeTemplate()]);

    expect(screen.queryByRole("columnheader", { name: "Uso" })).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Estado" })).toBeInTheDocument();
    expect(screen.getByText(copy.status.active)).toBeInTheDocument();
    expect(screen.queryByTestId("template-status-line")).not.toBeInTheDocument();
  });

  it("reemplazada con operadores: «Reemplazada» + «Paga a 3…»; tooltip con ratón", async () => {
    const user = userEvent.setup();
    renderTable([inactiveTemplate({ inactiveReason: "superseded" })]);

    expect(screen.getByText(copy.status.superseded)).toBeInTheDocument();
    expect(screen.getByTestId("template-status-line")).toHaveTextContent(
      "Paga a 3 operadores hasta que los reasignes",
    );
    expect(screen.queryByText(/Sigue pagando a asignados/)).not.toBeInTheDocument();

    await user.hover(screen.getByText(copy.status.superseded));
    expect(
      await screen.findByRole("tooltip", { name: SUPERSEDED_TOOLTIP }),
    ).toBeInTheDocument();
  });

  it("el tooltip de la insignia también abre con teclado", async () => {
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

  it("CA5: reemplazada con 0 operadores → «Sin operadores asignados», nunca «Paga a…»", () => {
    renderTable([inactiveTemplate({ inactiveReason: "superseded", activeAssignmentsCount: 0 })]);

    expect(screen.getByTestId("template-status-line")).toHaveTextContent(
      "Sin operadores asignados",
    );
    expect(screen.queryByText(/Paga a|Sigue pagando/)).not.toBeInTheDocument();
  });

  it.each([
    ["manual", "manual" as const],
    ["null", null],
  ])("inactive_reason %s → «Desactivada» + «No calcula pagos» con tooltip", async (_label, inactiveReason) => {
    const user = userEvent.setup();
    renderTable([inactiveTemplate({ inactiveReason })]);

    expect(screen.getByText(copy.status.deactivated)).toBeInTheDocument();
    expect(screen.getByTestId("template-status-line")).toHaveTextContent("No calcula pagos");

    await user.hover(screen.getByText(copy.status.deactivated));
    expect(
      await screen.findByRole("tooltip", { name: DEACTIVATED_TOOLTIP }),
    ).toBeInTheDocument();
  });

  it("sin inactive_reason muestra «Inactiva», sin línea ni tooltip", () => {
    renderTable([inactiveTemplate()]);

    expect(screen.getByText(copy.status.inactive)).toBeInTheDocument();
    expect(screen.queryByTestId("template-status-line")).not.toBeInTheDocument();
    expect(screen.queryByTestId("template-display-status-trigger")).not.toBeInTheDocument();
  });

  it("D11: reemplazada se atenúa", () => {
    renderTable([inactiveTemplate({ inactiveReason: "superseded" })]);

    expect(screen.getByRole("button", { name: "Abrir operadores de Operador foráneo v2" })).toHaveClass(
      "text-muted-foreground",
    );
  });
});

describe("CompensationTemplatesTable — «Cómo se paga» (PRD D7–D9)", () => {
  const withRouteAndAllowance = () =>
    activeTemplate({
        corridorIds: ["cor-1"],
        corridors: [
          {
            id: "cor-1",
            name: "México → MTY",
            originRefType: "city_label",
            originRefValue: "Ciudad de México",
            destinationRefType: "city_label",
            destinationRefValue: "Monterrey",
            fixedAmount: 1500,
            isActive: true,
          },
        ],
        fixedAllowances: [
          {
            allowanceType: "meals",
            label: "Comidas",
            amount: 500,
            period: "weekly",
            isMandatory: true,
          },
        ],
      });

  it("CA7: importe completo por clase y conteos en gris; tooltip con cursor", async () => {
    const user = userEvent.setup();
    renderTable([withRouteAndAllowance()]);

    const summary = screen.getByTestId("template-summary");
    expect(within(summary).getByText("Foráneo $3.00/km")).toHaveClass("whitespace-nowrap");
    expect(summary).toHaveTextContent("1 ruta fija $1,500.00 · +1 pago fijo");
    expect(summary).not.toHaveTextContent("México → MTY");

    await user.hover(summary);
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Cómo se paga");
    expect(tooltip).toHaveTextContent(
      "México → MTY: Ciudad de México → Monterrey · $1,500.00",
    );
  });

  it("CA7: el tooltip de «Cómo se paga» abre con foco", async () => {
    renderTable([withRouteAndAllowance()]);

    const trigger = screen.getByTestId("template-summary-trigger");
    expect(trigger).toHaveAttribute("tabindex", "0");
    act(() => trigger.focus());
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Comidas: $500.00");
  });

  it("D9: sin pago definido → «Sin configurar» en gris", () => {
    renderTable([makeCompensationTemplate({ id: "tpl-d", name: "Borrador", status: "draft" })]);

    const empty = within(screen.getByTestId("template-summary")).getByText(copy.summaryEmpty);
    expect(empty).toHaveClass("text-muted-foreground");
    expect(screen.queryByTestId("template-summary-trigger")).not.toBeInTheDocument();
  });
});

describe("CompensationTemplatesTable — fila y acciones (PRD D1–D3)", () => {
  const mixed = () => [
    makeCompensationTemplate({ id: "tpl-draft", name: "Borrador", status: "draft" }),
    makeCompensationTemplate({ id: "tpl-ready", name: "Lista", status: "draft", ...complete }),
    activeTemplate({ id: "tpl-active", name: "Tarifa activa" }),
    inactiveTemplate({ id: "tpl-old", name: "Vieja", inactiveReason: "superseded" }),
  ];

  it("CA1: máximo un botón además de «···» y ninguno primario", () => {
    renderTable(mixed());

    for (const row of bodyRows()) {
      const visible = visibleRowActions(row);
      expect(visible.length).toBeLessThanOrEqual(1);
      for (const element of visible) {
        expect(element).not.toHaveClass("bg-primary");
      }
      expect(within(row).getByRole("button", { name: MENU })).toBeInTheDocument();
    }
  });

  it("CA3: clic en la fila abre el panel de esa versión", async () => {
    const user = userEvent.setup();
    const { onOpenOperators } = renderTable(mixed());

    await user.click(within(bodyRows()[2]).getByText(copy.status.active));

    expect(onOpenOperators).toHaveBeenCalledTimes(1);
    expect(onOpenOperators).toHaveBeenCalledWith("tpl-active");
  });

  it("CA3: Tab llega al nombre y Enter abre el panel una sola vez", async () => {
    const user = userEvent.setup();
    const { onOpenOperators } = renderTable([activeTemplate({ id: "tpl-active", name: "Tarifa activa" })]);

    const nameButton = screen.getByRole("button", { name: "Abrir operadores de Tarifa activa v1" });
    await user.tab();
    expect(nameButton).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(onOpenOperators).toHaveBeenCalledTimes(1);
    expect(onOpenOperators).toHaveBeenCalledWith("tpl-active");
  });

  it("clic en el botón contextual no abre el panel", async () => {
    const user = userEvent.setup();
    const { onOpenOperators } = renderTable(mixed());

    await user.click(within(bodyRows()[1]).getByRole("button", { name: "Activar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onOpenOperators).not.toHaveBeenCalled();
  });

  it("overlays: «Cancelar» de un diálogo e ítems del menú no abren el panel por propagación", async () => {
    const user = userEvent.setup();
    const { onOpenOperators } = renderTable([activeTemplate({ id: "tpl-active", name: "Tarifa activa" })]);

    await user.click(screen.getByRole("button", { name: MENU }));
    await user.click(screen.getByRole("menuitem", { name: "Desactivar tarifa" }));
    const dialog = screen.getByRole("alertdialog");
    await user.click(dialog);
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));

    await user.click(screen.getByRole("button", { name: MENU }));
    await user.click(screen.getByRole("menuitem", { name: "Crear nueva versión" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));

    expect(onOpenOperators).not.toHaveBeenCalled();
  });

  it("«Ver operadores» del menú abre el panel una sola vez", async () => {
    const user = userEvent.setup();
    const { onOpenOperators } = renderTable([activeTemplate({ id: "tpl-active", name: "Tarifa activa" })]);

    await user.click(screen.getByRole("button", { name: MENU }));
    await user.click(screen.getByRole("menuitem", { name: "Ver operadores" }));

    await waitFor(() => expect(onOpenOperators).toHaveBeenCalledTimes(1));
    expect(onOpenOperators).toHaveBeenCalledWith("tpl-active");
  });

  it("CA10: sin permiso de editar, la fila abre el panel y el menú solo ofrece «Ver operadores»", async () => {
    const user = userEvent.setup();
    mockHasPermission.mockReturnValue(false);
    const { onOpenOperators } = renderTable(mixed());

    for (const row of bodyRows()) {
      expect(visibleRowActions(row)).toHaveLength(0);
    }
    await user.click(within(bodyRows()[0]).getByRole("button", { name: MENU }));
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Ver operadores",
    ]);
    await user.keyboard("{Escape}");

    await user.click(within(bodyRows()[3]).getByText(copy.status.superseded));
    expect(onOpenOperators).toHaveBeenCalledWith("tpl-old");
  });

  it("CA12: modo asignar → «Asignar a esta tarifa» solo en la tarifa lista y es el único botón", () => {
    renderTable(mixed(), "table", { pendingEmployeeId: "emp-1" });

    const assign = screen.getAllByRole("button", { name: "Asignar a esta tarifa" });
    expect(assign).toHaveLength(1);
    const activeRow = bodyRows()[2];
    expect(visibleRowActions(activeRow)).toEqual([assign[0]]);
  });
});

describe("CompensationTemplatesTable — tarjetas móvil (PRD D13)", () => {
  it("CA11: tarjeta clicable, «···» arriba a la derecha y máximo un botón", async () => {
    const user = userEvent.setup();
    const { onOpenOperators } = renderTable(
      [
        makeCompensationTemplate({ id: "tpl-draft", name: "Borrador", status: "draft" }),
        inactiveTemplate({ inactiveReason: "superseded", lockedForEdit: true }),
      ],
      "cards",
    );

    const [draftCard, oldCard] = screen.getAllByTestId("template-catalog-card");
    expect(within(draftCard).getByRole("button", { name: MENU })).toHaveClass("absolute", "right-2", "top-2");
    expect(visibleRowActions(draftCard).map((element) => element.textContent)).toEqual([
      "Completar pago",
    ]);
    expect(visibleRowActions(oldCard)).toHaveLength(0);
    expect(within(oldCard).getByText(copy.status.superseded)).toBeInTheDocument();
    expect(within(oldCard).getByTestId("template-status-line")).toHaveTextContent(
      "Paga a 3 operadores hasta que los reasignes",
    );

    await user.click(within(oldCard).getByTestId("template-summary"));
    expect(onOpenOperators).toHaveBeenCalledWith("tpl-2");

    onOpenOperators.mockClear();
    await user.click(within(oldCard).getByRole("button", { name: MENU }));
    await user.click(screen.getByRole("menuitem", { name: "Volver a activar esta versión" }));
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));
    expect(onOpenOperators).not.toHaveBeenCalled();
  });
});

describe("CompensationTemplatesTable — columna Operadores (PRD D15/D16)", () => {
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

describe("CompensationTemplatesTable — familias (PRD D15–D20, D25)", () => {
  const FAMILY = "fam-1";
  const familyCopy = copy.family;
  const D18_TOOLTIP =
    "3 cobran hoy y 1 empiezan después con una versión reemplazada. Para que cobren con esta versión, asígnalos aquí indicando desde qué fecha.";

  const v1 = () =>
    inactiveTemplate({
      id: "tpl-v1",
      familyId: FAMILY,
      version: 1,
      inactiveReason: "superseded",
      activeAssignmentsCount: 3,
      scheduledAssignmentsCount: 1,
    });
  const v2 = () =>
    activeTemplate({ id: "tpl-v2", familyId: FAMILY, version: 2, activeAssignmentsCount: 5 });
  const v3 = () =>
    makeCompensationTemplate({
      id: "tpl-v3",
      familyId: FAMILY,
      name: "Operador foráneo",
      status: "draft",
      version: 3,
      ...complete,
    });

  const v2Row = (family: Partial<NonNullable<CompensationTemplate["family"]>> = {}) => ({
    ...v2(),
    family: {
      versionsCount: 3,
      activeVersion: { id: "tpl-v2", version: 2 },
      draftVersion: { id: "tpl-v3", version: 3 },
      supersededActiveAssignmentsCount: 3,
      supersededScheduledAssignmentsCount: 1,
      ...family,
    },
  });

  function mockVersions(data: CompensationTemplate[] | undefined, extra: { isError?: boolean } = {}) {
    const refetch = vi.fn();
    mockUseTemplateVersions.mockReturnValue({
      data,
      isError: extra.isError ?? false,
      isFetching: false,
      refetch,
    });
    return refetch;
  }

  const toggle = () =>
    screen.getByRole("button", { name: /otras versiones de Operador foráneo/ });

  it.each(["table", "cards"] as const)(
    "CA14/CA27 (%s): fila v2 con «Otras versiones (2)», «Continuar borrador v3» y sin «Crear nueva versión»",
    async (layout) => {
      const user = userEvent.setup();
      renderTable([v2Row()], layout);

      expect(toggle()).toHaveAccessibleName("Ver otras versiones de Operador foráneo (2)");
      expect(toggle()).toHaveTextContent(familyCopy.otherVersions(2));
      expect(toggle()).toHaveAttribute("aria-expanded", "false");
      const draftLink = screen.getByRole("link", { name: "Continuar borrador v3" });
      expect(draftLink).toHaveAttribute("href", compensationTemplateBuildPath("tpl-v3"));
      expect(draftLink).not.toHaveClass("bg-primary");

      await user.click(screen.getByRole("button", { name: MENU }));
      const items = screen.getAllByRole("menuitem").map((item) => item.textContent);
      expect(items).not.toContain("Crear nueva versión");
    },
  );

  it("CA15: «Continuar borrador v3» no abre el panel", async () => {
    const user = userEvent.setup();
    const { onOpenOperators } = renderTable([v2Row()]);

    await user.click(screen.getByRole("link", { name: "Continuar borrador v3" }));

    expect(onOpenOperators).not.toHaveBeenCalled();
  });

  it("sin borrador en la familia, la fila activa sí ofrece «Crear nueva versión»", async () => {
    const user = userEvent.setup();
    renderTable([v2Row({ draftVersion: null, versionsCount: 2 })]);

    expect(screen.queryByRole("link", { name: /Continuar borrador/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: MENU }));
    expect(screen.getByRole("menuitem", { name: "Crear nueva versión" })).toBeInTheDocument();
  });

  it("una sola versión: sin botón de versiones", () => {
    renderTable([v2Row({ versionsCount: 1, draftVersion: null })]);

    expect(screen.queryByTestId("template-family-toggle")).not.toBeInTheDocument();
  });

  it("CA16: al abrir, v3 y v1 en ese orden con insignia, línea, conteo y acción; la sub-fila abre su panel", async () => {
    const user = userEvent.setup();
    mockVersions([v1(), v2(), v3()]);
    const { onOpenOperators } = renderTable([v2Row()]);

    await user.click(toggle());

    expect(onOpenOperators).not.toHaveBeenCalled();
    expect(mockUseTemplateVersions).toHaveBeenCalledWith("tpl-v2", true, { keepPrevious: true });
    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(toggle()).toHaveTextContent(familyCopy.hideOtherVersions);
    const container = screen.getByTestId("template-family-versions");
    expect(toggle()).toHaveAttribute("aria-controls", container.id);

    const [draftRow, oldRow] = screen.getAllByTestId("template-family-version-row");
    expect(screen.getAllByTestId("template-family-version-row")).toHaveLength(2);
    expect(
      within(draftRow).getByRole("button", { name: "Abrir operadores de Operador foráneo v3" }),
    ).toHaveTextContent(/^v3$/);
    expect(within(draftRow).getByText(copy.status.draft)).toBeInTheDocument();
    expect(within(draftRow).getByRole("button", { name: "Activar" })).toBeInTheDocument();
    expect(within(oldRow).getByText(copy.status.superseded)).toBeInTheDocument();
    expect(within(oldRow).getByTestId("template-status-line")).toHaveTextContent(
      "Paga a 3 operadores hasta que los reasignes",
    );
    expect(within(oldRow).getByTestId("template-operators-count-trigger")).toHaveTextContent(
      /^3 · \+1 programada$/,
    );

    await user.click(within(oldRow).getByText(copy.status.superseded));
    expect(onOpenOperators).toHaveBeenCalledTimes(1);
    expect(onOpenOperators).toHaveBeenCalledWith("tpl-v1");

    await user.click(toggle());
    expect(screen.queryByTestId("template-family-versions")).not.toBeInTheDocument();
  });

  it("sub-fila con nombre distinto lo muestra junto a «v{n}»", async () => {
    const user = userEvent.setup();
    mockVersions([{ ...v1(), name: "Foráneo 2025" }, v2()]);
    renderTable([v2Row({ versionsCount: 2, draftVersion: null })]);

    await user.click(toggle());

    expect(
      screen.getByRole("button", { name: "Abrir operadores de Foráneo 2025 v1" }),
    ).toHaveTextContent("v1Foráneo 2025");
  });

  it("CA17: aviso de operadores en reemplazadas despliega la familia sin abrir el panel; tooltip con desglose", async () => {
    const user = userEvent.setup();
    mockVersions([v1(), v2(), v3()]);
    const { onOpenOperators } = renderTable([v2Row()]);

    expect(screen.getByText(copy.status.active)).toBeInTheDocument();
    const warning = screen.getByTestId("template-family-superseded-operators");
    expect(warning).toHaveTextContent("4 operadores siguen con una versión reemplazada");
    expect(warning).toHaveClass("text-warning");
    expect(screen.queryByTestId("template-status-line")).not.toBeInTheDocument();

    await user.hover(warning);
    expect(await screen.findByRole("tooltip", { name: D18_TOOLTIP })).toBeInTheDocument();

    await user.click(warning);
    expect(screen.getByTestId("template-family-versions")).toBeInTheDocument();
    expect(onOpenOperators).not.toHaveBeenCalled();
  });

  it("CA17: Enter sobre el aviso también despliega la familia", async () => {
    const user = userEvent.setup();
    mockVersions([v1(), v2(), v3()]);
    const { onOpenOperators } = renderTable([v2Row()]);

    act(() => screen.getByTestId("template-family-superseded-operators").focus());
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("template-family-versions")).toBeInTheDocument();
    expect(onOpenOperators).not.toHaveBeenCalled();
  });

  it("CA17: un operador en singular y sin programados el tooltip omite «empiezan después»", async () => {
    const user = userEvent.setup();
    renderTable([
      v2Row({ supersededActiveAssignmentsCount: 1, supersededScheduledAssignmentsCount: 0 }),
    ]);

    const warning = screen.getByTestId("template-family-superseded-operators");
    expect(warning).toHaveTextContent("1 operador sigue con una versión reemplazada");
    await user.hover(warning);
    expect(await screen.findByRole("tooltip")).not.toHaveTextContent("empiezan después");
  });

  it("CA18: sin asignaciones en reemplazadas no hay aviso", () => {
    renderTable([
      v2Row({ supersededActiveAssignmentsCount: 0, supersededScheduledAssignmentsCount: 0 }),
    ]);

    expect(screen.queryByTestId("template-family-superseded-operators")).not.toBeInTheDocument();
  });

  it("CA18: en filas que no están activas manda la línea D10", () => {
    renderTable([
      {
        ...v1(),
        family: {
          versionsCount: 2,
          activeVersion: null,
          draftVersion: null,
          supersededActiveAssignmentsCount: 2,
          supersededScheduledAssignmentsCount: 0,
        },
      },
    ]);

    expect(screen.queryByTestId("template-family-superseded-operators")).not.toBeInTheDocument();
    expect(screen.getByTestId("template-status-line")).toBeInTheDocument();
  });

  it("CA22: mientras carga hay una sub-fila esqueleto", async () => {
    const user = userEvent.setup();
    renderTable([v2Row()]);

    await user.click(toggle());

    const container = screen.getByTestId("template-family-versions");
    expect(within(container).getAllByRole("row")).toHaveLength(1);
    expect(screen.queryByTestId("template-family-version-row")).not.toBeInTheDocument();
  });

  it("CA22: error → texto + «Reintentar» que reconsulta sin cerrar la familia", async () => {
    const user = userEvent.setup();
    const refetch = mockVersions(undefined, { isError: true });
    const { onOpenOperators } = renderTable([v2Row()]);

    await user.click(toggle());
    const error = screen.getByTestId("template-family-versions-error");
    expect(error).toHaveTextContent(familyCopy.loadError);

    await user.click(within(error).getByRole("button", { name: familyCopy.retry }));

    expect(refetch).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("template-family-versions")).toBeInTheDocument();
    expect(onOpenOperators).not.toHaveBeenCalled();
  });

  it("D20: sin otras versiones → «Sin otras versiones todavía.»", async () => {
    const user = userEvent.setup();
    mockVersions([v2()]);
    renderTable([v2Row({ versionsCount: 2, draftVersion: null })]);

    await user.click(toggle());

    expect(screen.getByTestId("template-family-versions-empty")).toHaveTextContent(
      familyCopy.empty,
    );
  });

  it("CA23: activar v3 desde la sub-fila avisa que la v2 quedará reemplazada; al pasar a fila v3 la familia sigue abierta", async () => {
    const user = userEvent.setup();
    mockVersions([v1(), v2(), v3()]);
    const onOpenOperators = vi.fn();
    const { rerender } = render(
      <MemoryRouter>
        <CompensationTemplatesTable templates={[v2Row()]} onOpenOperators={onOpenOperators} />
      </MemoryRouter>,
    );

    await user.click(toggle());
    const [draftRow] = screen.getAllByTestId("template-family-version-row");
    await user.click(within(draftRow).getByRole("button", { name: "Activar" }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent(
      "La v2, que hoy está activa, quedará reemplazada.",
    );
    await user.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Cancelar" }));

    const v3Row = {
      ...v3(),
      status: "active" as const,
      isActive: true,
      family: {
        versionsCount: 3,
        activeVersion: { id: "tpl-v3", version: 3 },
        draftVersion: null,
        supersededActiveAssignmentsCount: 8,
        supersededScheduledAssignmentsCount: 1,
      },
    };
    rerender(
      <MemoryRouter>
        <CompensationTemplatesTable templates={[v3Row]} onOpenOperators={onOpenOperators} />
      </MemoryRouter>,
    );

    expect(toggle()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("template-family-versions")).toBeInTheDocument();
    expect(onOpenOperators).not.toHaveBeenCalled();
  });

  it("CA25: modo asignar con fila reemplazada → la activa en la expansión solo muestra «Asignar a esta tarifa»", async () => {
    const user = userEvent.setup();
    mockVersions([v1(), v2()]);
    const supersededRow = {
      ...v1(),
      family: {
        versionsCount: 2,
        activeVersion: { id: "tpl-v2", version: 2 },
        draftVersion: null,
        supersededActiveAssignmentsCount: 0,
        supersededScheduledAssignmentsCount: 0,
      },
    };
    const { onOpenOperators } = renderTable([supersededRow], "table", {
      pendingEmployeeId: "emp-1",
    });

    await user.click(toggle());
    const [activeSubRow] = screen.getAllByTestId("template-family-version-row");
    const assign = within(activeSubRow).getByRole("button", { name: "Asignar a esta tarifa" });
    expect(visibleRowActions(activeSubRow)).toEqual([assign]);

    await user.click(assign);
    expect(onOpenOperators).toHaveBeenCalledWith("tpl-v2", "emp-1");
  });

  it("varias familias abiertas a la vez", async () => {
    const user = userEvent.setup();
    mockVersions([v1(), v2()]);
    const other = {
      ...v2Row({ versionsCount: 2, draftVersion: null }),
      id: "tpl-b2",
      familyId: "fam-2",
      name: "Local",
    };
    renderTable([v2Row(), other]);

    await user.click(screen.getByRole("button", { name: "Ver otras versiones de Operador foráneo (2)" }));
    await user.click(screen.getByRole("button", { name: "Ver otras versiones de Local (1)" }));

    expect(screen.getAllByTestId("template-family-versions")).toHaveLength(2);
  });

  it("CA27: en móvil D16/D18 van al pie de la tarjeta y las versiones son mini-tarjetas sin «Cómo se paga»", async () => {
    const user = userEvent.setup();
    mockVersions([v1(), v2(), v3()]);
    const { onOpenOperators } = renderTable([v2Row()], "cards");

    const card = screen.getByTestId("template-catalog-card");
    const footer = within(card).getByTestId("template-card-family-footer");
    expect(within(footer).getByTestId("template-family-superseded-operators")).toHaveTextContent(
      "4 operadores siguen con una versión reemplazada",
    );
    expect(within(footer).getByTestId("template-family-toggle")).toBeInTheDocument();

    await user.click(within(footer).getByTestId("template-family-superseded-operators"));
    expect(onOpenOperators).not.toHaveBeenCalled();

    const miniCards = screen.getAllByTestId("template-family-version-card");
    expect(miniCards).toHaveLength(2);
    expect(card).not.toContainElement(miniCards[0]);
    expect(within(miniCards[0]).queryByTestId("template-summary")).not.toBeInTheDocument();
    expect(within(miniCards[0]).getByText(copy.status.draft)).toBeInTheDocument();

    await user.click(within(miniCards[1]).getByText(copy.status.superseded));
    expect(onOpenOperators).toHaveBeenCalledTimes(1);
    expect(onOpenOperators).toHaveBeenCalledWith("tpl-v1");
  });

  it("D20: el nombre de cada sub-fila marca el destino del foco al cerrar el panel", async () => {
    const user = userEvent.setup();
    mockVersions([v1(), v2(), v3()]);
    renderTable([v2Row()]);

    await user.click(toggle());

    expect(
      screen.getByRole("button", { name: "Abrir operadores de Operador foráneo v1" }),
    ).toHaveAttribute("data-template-focus-id", "tpl-v1");
    expect(
      screen.getByRole("button", { name: "Abrir operadores de Operador foráneo v2" }),
    ).toHaveAttribute("data-template-focus-id", "tpl-v2");
  });
});
