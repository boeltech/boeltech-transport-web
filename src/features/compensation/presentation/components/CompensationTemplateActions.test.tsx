import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps } from "react";
import { CompensationTemplateActions } from "./CompensationTemplateActions";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { makeCompensationTemplate } from "../utils/makeCompensationTemplate";

const mockDeleteMutateAsync = vi.fn();
const mockActivateMutateAsync = vi.fn();
const mockDeactivateMutateAsync = vi.fn();
const mockCreateVersionMutateAsync = vi.fn();
const mockHasPermission = vi.fn();
const mockToast = vi.fn();

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

const template = makeCompensationTemplate({
  id: "tpl-1",
  name: "Operador foráneo",
  status: "active",
});

function renderActions(
  props: ComponentProps<typeof CompensationTemplateActions>,
) {
  return render(
    <MemoryRouter>
      <CompensationTemplateActions {...props} />
    </MemoryRouter>,
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

  it("no renderiza menú sin permiso settlements.delete ni update", () => {
    mockHasPermission.mockReturnValue(false);

    renderActions({ template });

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("muestra eliminar con settlements.delete", async () => {
    const user = userEvent.setup();

    renderActions({ template, onDeleted: vi.fn() });

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Eliminar tarifa")).toBeInTheDocument();
  });

  it("confirma y elimina, luego llama onDeleted", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();

    renderActions({ template, onDeleted });

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Eliminar tarifa"));
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

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Eliminar tarifa"));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(onDeleted).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "No se pudo eliminar la tarifa",
        variant: "error",
      }),
    );
  });

  it("muestra activar en borrador con settlements.update", async () => {
    const user = userEvent.setup();
    mockHasPermission.mockImplementation(
      (_module: string, action: string) => action === "update",
    );

    renderActions({
      template: makeCompensationTemplate({
        id: "tpl-draft",
        name: "Borrador",
        status: "draft",
      }),
    });

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Activar tarifa")).toBeInTheDocument();
    expect(screen.queryByText("Eliminar tarifa")).not.toBeInTheDocument();
  });
});
