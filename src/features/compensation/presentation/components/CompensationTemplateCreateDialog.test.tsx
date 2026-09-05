import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { CompensationTemplateCreateDialog } from "./CompensationTemplateCreateDialog";
import type { CompensationTemplate } from "../../domain/entities";

const mockCreateMutate = vi.fn();
const mockToast = vi.fn();
const mockOnOpenChange = vi.fn();
const mockOnCreated = vi.fn();

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../application/hooks", () => ({
  useCreateCompensationTemplate: () => ({
    mutateAsync: mockCreateMutate,
    isPending: false,
  }),
}));

const createdTemplate: CompensationTemplate = {
  id: "tpl-new",
  name: "Esquema local",
  description: null,
  isActive: true,
  rules: [],
  fixedAllowances: [],
  corridorIds: [],
  corridors: [],
  activeAssignmentsCount: 0,
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderDialog(open = true) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CompensationTemplateCreateDialog
          open={open}
          onOpenChange={mockOnOpenChange}
          onCreated={mockOnCreated}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CompensationTemplateCreateDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateMutate.mockResolvedValue(createdTemplate);
  });

  it("envía POST con metadata mínima y arrays vacíos", async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Nombre"), "Esquema local");
    await user.click(screen.getByRole("button", { name: /Guardar/i }));

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateMutate).toHaveBeenCalledWith({
      name: "Esquema local",
      description: null,
      isActive: true,
      rules: [],
      fixedAllowances: [],
      corridorIds: [],
    });
    expect(mockOnCreated).toHaveBeenCalledWith(createdTemplate);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ variant: "success" }),
    );
  });

  it("recorta description vacía a null", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText("Nombre"), "Esquema con notas");
    await user.type(screen.getByLabelText("Descripción"), "   ");
    await user.click(screen.getByRole("button", { name: /Guardar/i }));

    await waitFor(() => {
      expect(mockCreateMutate).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Esquema con notas",
        description: null,
      }),
    );
  });

  it("no envía si falta nombre", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: /Guardar/i }));

    expect(mockCreateMutate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("El nombre es obligatorio");
  });

  it("muestra error de API inline sin toast", async () => {
    const user = userEvent.setup();
    mockCreateMutate.mockRejectedValue(new Error("Nombre duplicado"));

    renderDialog();

    await user.type(screen.getByLabelText("Nombre"), "Esquema local");
    await user.click(screen.getByRole("button", { name: /Guardar/i }));

    await waitFor(() => {
      expect(screen.getByText("Nombre duplicado")).toBeInTheDocument();
    });

    expect(mockToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ variant: "error" }),
    );
    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
  });
});
