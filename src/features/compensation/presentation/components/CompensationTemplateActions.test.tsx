import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import { CompensationTemplateActions } from "./CompensationTemplateActions";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { makeCompensationTemplate } from "../utils/makeCompensationTemplate";
import type { CompensationTemplate } from "../../domain/entities";

const mockDeleteMutateAsync = vi.fn();
const mockActivateMutateAsync = vi.fn();
const mockDeactivateMutateAsync = vi.fn();
const mockCreateVersionMutateAsync = vi.fn();
const mockHasPermission = vi.fn();
const mockToast = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../application/hooks", () => ({
  useDeleteCompensationTemplate: () => ({
    mutateAsync: mockDeleteMutateAsync,
    isPending: false,
  }),
  useActivateCompensationTemplate: () => ({
    mutateAsync: mockActivateMutateAsync,
    isPending: false,
  }),
  useDeactivateCompensationTemplate: () => ({
    mutateAsync: mockDeactivateMutateAsync,
    isPending: false,
  }),
  useCreateCompensationTemplateVersion: () => ({
    mutateAsync: mockCreateVersionMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (...args: unknown[]) => mockHasPermission(...args),
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const MENU = "Abrir menú de acciones de la tarifa";

const payRule: CompensationTemplate["rules"][number] = {
  routeType: "long_haul",
  commissionType: "rate_per_km",
  rateValue: 3,
  minimumGuaranteedAmount: 0,
};

const template = makeCompensationTemplate({
  id: "tpl-1",
  name: "Operador foráneo",
  status: "active",
  rules: [payRule],
});

function allowAll() {
  mockHasPermission.mockImplementation(() => true);
}

function renderActions(props: ComponentProps<typeof CompensationTemplateActions>) {
  return render(
    <MemoryRouter>
      <CompensationTemplateActions {...props} />
    </MemoryRouter>,
  );
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: MENU }));
  return screen.getByRole("menu");
}

function menuEntries(menu: HTMLElement): string[] {
  return Array.from(menu.querySelectorAll('[role="menuitem"], [role="separator"]')).map(
    (node) => (node.getAttribute("role") === "separator" ? "—" : (node.textContent ?? "").trim()),
  );
}

describe("CompensationTemplateActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (_module: string, action: string) => action === "delete",
    );
    mockDeleteMutateAsync.mockResolvedValue(undefined);
  });

  it("no renderiza nada sin permisos ni panel de operadores", () => {
    mockHasPermission.mockReturnValue(false);

    renderActions({ template });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("CA10 / ajuste D6: solo lectura ve solo «Ver operadores» y ningún botón", async () => {
    const user = userEvent.setup();
    mockHasPermission.mockReturnValue(false);

    renderActions({
      template: makeCompensationTemplate({ id: "tpl-draft", name: "Borrador", status: "draft" }),
      onOpenOperators: vi.fn(),
    });

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(menuEntries(await openMenu(user))).toEqual(["Ver operadores"]);
  });

  it("muestra eliminar con settlements.delete", async () => {
    const user = userEvent.setup();

    renderActions({ template, onDeleted: vi.fn() });

    expect(menuEntries(await openMenu(user))).toEqual(["Eliminar tarifa"]);
  });

  it("confirma y elimina, luego llama onDeleted", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();

    renderActions({ template, onDeleted });

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Eliminar tarifa" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith("tpl-1");
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Tarifa eliminada", variant: "success" }),
    );
  });

  it("propaga mensaje de error en delete 409 sin llamar onDeleted", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    mockDeleteMutateAsync.mockRejectedValue(
      new ApiError(
        "No se puede eliminar una plantilla con asignaciones activas o pagos",
        409,
        "TEMPLATE_IN_USE",
      ),
    );

    renderActions({ template, onDeleted });

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Eliminar tarifa" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(onDeleted).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "No se pudo eliminar la tarifa",
        variant: "error",
      }),
    );
  });

  describe("PRD D3: botón visible y menú por estado", () => {
    it.each([
      [
        "borrador sin pago",
        { status: "draft" as const },
        "Completar pago",
        ["Ver operadores", "Editar configuración", "—", "Eliminar tarifa"],
      ],
      [
        "borrador listo",
        { status: "draft" as const, rules: [payRule] },
        "Activar",
        ["Ver operadores", "Editar configuración", "—", "Eliminar tarifa"],
      ],
      [
        "activa editable",
        { status: "active" as const, rules: [payRule] },
        null,
        [
          "Ver operadores",
          "Editar configuración",
          "Crear nueva versión",
          "—",
          "Desactivar tarifa",
          "—",
          "Eliminar tarifa",
        ],
      ],
      [
        "activa bloqueada por pagos",
        {
          status: "active" as const,
          rules: [payRule],
          lockedForEdit: true,
          lockedReason: "used_in_settlements" as const,
        },
        null,
        [
          "Ver operadores",
          "Ver configuración",
          "Crear nueva versión",
          "—",
          "Desactivar tarifa",
          "—",
          "Eliminar tarifa",
        ],
      ],
      [
        "reemplazada",
        {
          status: "inactive" as const,
          rules: [payRule],
          inactiveReason: "superseded" as const,
          lockedForEdit: true,
          lockedReason: "superseded" as const,
        },
        null,
        [
          "Ver operadores",
          "Ver configuración",
          "—",
          "Volver a activar esta versión",
          "—",
          "Eliminar tarifa",
        ],
      ],
      [
        "desactivada",
        { status: "inactive" as const, rules: [payRule], inactiveReason: "manual" as const },
        null,
        ["Ver operadores", "Ver configuración", "—", "Activar tarifa", "—", "Eliminar tarifa"],
      ],
    ])("%s", async (_label, overrides, contextual, entries) => {
      const user = userEvent.setup();
      allowAll();

      renderActions({
        template: makeCompensationTemplate({ id: "tpl-x", name: "Tarifa", ...overrides }),
        onOpenOperators: vi.fn(),
      });

      const buttons = screen.getAllByRole("button");
      const links = screen.queryAllByRole("link");
      const visible = [...buttons, ...links].filter(
        (element) => element.getAttribute("aria-haspopup") !== "menu",
      );
      if (contextual) {
        expect(visible.map((element) => element.textContent)).toEqual([contextual]);
        expect(visible[0]).not.toHaveClass("bg-primary");
      } else {
        expect(visible).toHaveLength(0);
      }

      expect(menuEntries(await openMenu(user))).toEqual(entries);
    });
  });

  it("CA8: «Completar pago» lleva al editor", () => {
    allowAll();
    renderActions({
      template: makeCompensationTemplate({ id: "tpl-draft", name: "Borrador", status: "draft" }),
      onOpenOperators: vi.fn(),
    });

    expect(screen.getByRole("link", { name: "Completar pago" })).toHaveAttribute(
      "href",
      "/finance/compensation/templates/tpl-draft/build",
    );
  });

  it("CA8: «Activar» abre el diálogo existente y activa", async () => {
    const user = userEvent.setup();
    allowAll();
    mockActivateMutateAsync.mockResolvedValue(undefined);
    renderActions({
      template: makeCompensationTemplate({
        id: "tpl-draft",
        name: "Borrador",
        status: "draft",
        rules: [payRule],
      }),
      onOpenOperators: vi.fn(),
    });

    await user.click(screen.getByRole("button", { name: "Activar" }));
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("¿Activar esta tarifa?")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Activar" }));

    expect(mockActivateMutateAsync).toHaveBeenCalledWith({ id: "tpl-draft" });
  });

  it("CA4: «Crear nueva versión» confirma, crea y abre el editor del borrador", async () => {
    const user = userEvent.setup();
    allowAll();
    mockCreateVersionMutateAsync.mockResolvedValue({ id: "tpl-v2" });
    renderActions({ template, onOpenOperators: vi.fn() });

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Crear nueva versión" }));
    expect(mockCreateVersionMutateAsync).not.toHaveBeenCalled();

    const dialog = screen.getByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: "Crear versión" }));

    expect(mockCreateVersionMutateAsync).toHaveBeenCalledWith("tpl-1");
    expect(mockNavigate).toHaveBeenCalledWith("/finance/compensation/templates/tpl-v2/build");
  });

  it("CA4: ningún enlace «Crear nueva versión» navega sin crear", async () => {
    const user = userEvent.setup();
    allowAll();
    renderActions({
      template: makeCompensationTemplate({
        id: "tpl-1",
        name: "Tarifa",
        status: "active",
        rules: [payRule],
        lockedForEdit: true,
      }),
      onOpenOperators: vi.fn(),
    });

    await openMenu(user);
    expect(screen.queryByRole("link", { name: "Crear nueva versión" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Crear nueva versión" })).not.toHaveAttribute(
      "href",
    );
  });

  it("CA9: reemplazada v1 avisa que la activa quedará reemplazada", async () => {
    const user = userEvent.setup();
    allowAll();
    renderActions({
      template: makeCompensationTemplate({
        id: "tpl-old",
        name: "Tarifa",
        status: "inactive",
        version: 1,
        rules: [payRule],
        inactiveReason: "superseded",
      }),
      onOpenOperators: vi.fn(),
    });

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Volver a activar esta versión" }));

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("¿Volver a activar v1?")).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Esta versión vuelve a usarse en pagos y la versión activa quedará reemplazada. Los operadores no cambian de versión.",
      ),
    ).toBeInTheDocument();
  });

  it("«Activar tarifa» en desactivada v2 conserva el aviso de reasignación", async () => {
    const user = userEvent.setup();
    allowAll();
    renderActions({
      template: makeCompensationTemplate({
        id: "tpl-off",
        name: "Tarifa",
        status: "inactive",
        version: 2,
        rules: [payRule],
        inactiveReason: "manual",
      }),
      onOpenOperators: vi.fn(),
    });

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Activar tarifa" }));

    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("¿Activar esta tarifa?")).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        "Los operadores en versiones anteriores siguen cobrando con esa versión hasta que los reasignes.",
      ),
    ).toBeInTheDocument();
  });

  it("«Ver operadores» desde el menú abre el panel tras cerrar el menú", async () => {
    const user = userEvent.setup();
    allowAll();
    const onOpenOperators = vi.fn();
    renderActions({ template, onOpenOperators });

    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Ver operadores" }));

    await waitFor(() => expect(onOpenOperators).toHaveBeenCalledWith("tpl-1"));
  });

  describe("CA12: modo «asignar operador»", () => {
    it("en tarifa lista, «Asignar a esta tarifa» es el único botón y precarga al operador", async () => {
      const user = userEvent.setup();
      allowAll();
      const onOpenOperators = vi.fn();
      renderActions({ template, onOpenOperators, pendingEmployeeId: "emp-9" });

      const visible = screen
        .getAllByRole("button")
        .filter((element) => element.getAttribute("aria-haspopup") !== "menu");
      expect(visible.map((element) => element.textContent)).toEqual(["Asignar a esta tarifa"]);

      await user.click(visible[0]);
      expect(onOpenOperators).toHaveBeenCalledWith("tpl-1", "emp-9");
    });

    it("en borrador listo no ofrece asignar", () => {
      allowAll();
      renderActions({
        template: makeCompensationTemplate({
          id: "tpl-draft",
          name: "Borrador",
          status: "draft",
          rules: [payRule],
        }),
        onOpenOperators: vi.fn(),
        pendingEmployeeId: "emp-9",
      });

      expect(screen.queryByRole("button", { name: "Asignar a esta tarifa" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Activar" })).toBeInTheDocument();
    });
  });

  describe("F2b: familia (PRD D17, D24)", () => {
    const family = (
      overrides: Partial<NonNullable<CompensationTemplate["family"]>> = {},
    ): NonNullable<CompensationTemplate["family"]> => ({
      versionsCount: 3,
      activeVersion: { id: "tpl-1", version: 2 },
      draftVersion: { id: "tpl-3", version: 3 },
      supersededActiveAssignmentsCount: 0,
      supersededScheduledAssignmentsCount: 0,
      ...overrides,
    });
    const visibleButtons = () => [
      ...screen
        .queryAllByRole("button")
        .filter((element) => element.getAttribute("aria-haspopup") !== "menu"),
      ...screen.queryAllByRole("link"),
    ];

    it("D17: con borrador más nuevo, «Continuar borrador v3» (outline) y sin «Crear nueva versión»", async () => {
      const user = userEvent.setup();
      allowAll();
      renderActions({ template: { ...template, family: family() }, onOpenOperators: vi.fn() });

      expect(visibleButtons().map((element) => element.textContent)).toEqual([
        "Continuar borrador v3",
      ]);
      expect(screen.getByRole("link", { name: "Continuar borrador v3" })).not.toHaveClass(
        "bg-primary",
      );
      const menu = await openMenu(user);
      expect(menuEntries(menu)).not.toContain("Crear nueva versión");
    });

    it("D17: la familia ya tiene borrador (sub-fila activa) → sin «Crear nueva versión»", async () => {
      const user = userEvent.setup();
      allowAll();
      renderActions({ template, onOpenOperators: vi.fn(), familyHasDraft: true });

      const menu = await openMenu(user);
      expect(menuEntries(menu)).not.toContain("Crear nueva versión");
    });

    it("D17: «Asignar a esta tarifa» gana sobre «Continuar borrador»", () => {
      allowAll();
      renderActions({
        template: { ...template, family: family() },
        onOpenOperators: vi.fn(),
        pendingEmployeeId: "emp-9",
      });

      expect(visibleButtons().map((element) => element.textContent)).toEqual([
        "Asignar a esta tarifa",
      ]);
    });

    it("D17: sin permiso de edición no aparece «Continuar borrador»", () => {
      mockHasPermission.mockReturnValue(false);
      renderActions({ template: { ...template, family: family() }, onOpenOperators: vi.fn() });

      expect(screen.queryByRole("link", { name: /Continuar borrador/ })).not.toBeInTheDocument();
    });

    it("D24: reactivar una reemplazada con otra activa en la familia avisa cuál queda reemplazada", async () => {
      const user = userEvent.setup();
      allowAll();
      renderActions({
        template: makeCompensationTemplate({
          id: "tpl-v1",
          name: "Operador foráneo",
          status: "inactive",
          inactiveReason: "superseded",
          rules: [payRule],
          family: family({ draftVersion: null }),
        }),
        onOpenOperators: vi.fn(),
      });

      await openMenu(user);
      await user.click(screen.getByRole("menuitem", { name: "Volver a activar esta versión" }));

      expect(screen.getByRole("alertdialog")).toHaveTextContent(
        "Esta versión vuelve a usarse en pagos. Los operadores no cambian de versión. La v2, que hoy está activa, quedará reemplazada.",
      );
    });

    it("D24: sin otra versión activa en la familia no menciona reemplazo", async () => {
      const user = userEvent.setup();
      allowAll();
      renderActions({
        template: makeCompensationTemplate({
          id: "tpl-draft",
          name: "Borrador",
          status: "draft",
          rules: [payRule],
        }),
        onOpenOperators: vi.fn(),
        familyActiveVersion: null,
      });

      await user.click(screen.getByRole("button", { name: "Activar" }));

      const dialog = screen.getByRole("alertdialog");
      expect(dialog).toHaveTextContent("Pasará a usarse en pagos.");
      expect(dialog).not.toHaveTextContent("quedará reemplazada");
    });

    it("D24: `familyActiveVersion` (sub-fila) gana sobre el bloque `family`", async () => {
      const user = userEvent.setup();
      allowAll();
      renderActions({
        template: makeCompensationTemplate({
          id: "tpl-3",
          name: "Operador foráneo",
          status: "draft",
          version: 3,
          rules: [payRule],
        }),
        onOpenOperators: vi.fn(),
        familyActiveVersion: { id: "tpl-2", version: 2 },
      });

      await user.click(screen.getByRole("button", { name: "Activar" }));

      expect(screen.getByRole("alertdialog")).toHaveTextContent(
        "La v2, que hoy está activa, quedará reemplazada.",
      );
    });
  });
});
