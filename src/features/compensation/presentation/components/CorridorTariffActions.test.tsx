import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CorridorTariffActions } from "./CorridorTariffActions";
import { ApiError } from "@shared/api/interceptors/error-handler";

const mockDeleteMutateAsync = vi.fn();
const mockHasPermission = vi.fn();

vi.mock("../../application/hooks", () => ({
  useDeleteCorridorTariff: () => ({
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
  useToast: () => ({ toast: vi.fn() }),
}));

const corridor = {
  id: "cor-1",
  name: "CDMX → MTY",
  originRefType: "city_label" as const,
  originRefValue: "Ciudad de México",
  destinationRefType: "city_label" as const,
  destinationRefValue: "Monterrey",
  fixedAmount: 1500,
  notes: null,
  isActive: true,
};

describe("CorridorTariffActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockImplementation(
      (_module: string, action: string) => action === "update" || action === "delete",
    );
  });

  it("no renderiza menú sin permisos de update ni delete", () => {
    mockHasPermission.mockReturnValue(false);

    render(<CorridorTariffActions corridor={corridor} />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("muestra eliminar solo con settlements.delete", async () => {
    mockHasPermission.mockImplementation(
      (_module: string, action: string) => action === "delete",
    );
    const user = userEvent.setup();

    render(<CorridorTariffActions corridor={corridor} onActionComplete={vi.fn()} />);

    await user.click(screen.getByRole("button"));
    expect(screen.getByText("Eliminar ruta")).toBeInTheDocument();
    expect(screen.queryByText("Editar ruta")).not.toBeInTheDocument();
  });

  it("propaga mensaje de error en delete 409", async () => {
    const user = userEvent.setup();
    mockDeleteMutateAsync.mockRejectedValue(
      new ApiError("Corredor vinculado a plantillas", 409, "CORRIDOR_IN_USE"),
    );

    render(<CorridorTariffActions corridor={corridor} onActionComplete={vi.fn()} />);

    await user.click(screen.getByRole("button"));
    await user.click(screen.getByText("Eliminar ruta"));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(mockDeleteMutateAsync).toHaveBeenCalledWith("cor-1");
  });
});
