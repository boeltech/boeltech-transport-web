import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CompensationTemplateActions } from "./CompensationTemplateActions";
import { ApiError } from "@shared/api/interceptors/error-handler";
import type { CompensationTemplate } from "../../domain/entities";

const mockDeleteMutateAsync = vi.fn();
const mockHasPermission = vi.fn();
const mockToast = vi.fn();

vi.mock("../../application/hooks", () => ({
  useDeleteCompensationTemplate: () => ({
    mutateAsync: mockDeleteMutateAsync,
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

const template: CompensationTemplate = {
  id: "tpl-1",
  name: "Operador foráneo",
  isActive: true,
  rules: [],
  fixedAllowances: [],
  corridorIds: [],
  corridors: [],
  activeAssignmentsCount: 0,
};

describe("CompensationTemplateActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (_module: string, action: string) => action === "delete",
    );
    mockDeleteMutateAsync.mockResolvedValue(undefined);
  });

  it("no renderiza menú sin permiso settlements.delete", () => {
    mockHasPermission.mockReturnValue(false);

    render(<CompensationTemplateActions template={template} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("muestra eliminar con settlements.delete", async () => {
    const user = userEvent.setup();

    render(<CompensationTemplateActions template={template} onDeleted={vi.fn()} />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Eliminar esquema")).toBeInTheDocument();
  });

  it("confirma y elimina, luego llama onDeleted", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();

    render(<CompensationTemplateActions template={template} onDeleted={onDeleted} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Eliminar esquema"));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith("tpl-1");
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Esquema eliminado", variant: "success" }),
    );
  });

  it("propaga mensaje de error en delete 409 sin llamar onDeleted", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    mockDeleteMutateAsync.mockRejectedValue(
      new ApiError(
        "No se puede eliminar una plantilla con asignaciones activas o liquidaciones",
        409,
        "TEMPLATE_IN_USE",
      ),
    );

    render(<CompensationTemplateActions template={template} onDeleted={onDeleted} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Eliminar esquema"));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith("tpl-1");
    expect(onDeleted).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "No se pudo eliminar el esquema",
        variant: "error",
      }),
    );
  });
});
