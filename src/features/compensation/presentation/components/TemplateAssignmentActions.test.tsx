import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TemplateAssignmentActions } from "./TemplateAssignmentActions";
import type { TemplateAssignment } from "../../domain/entities";

const mockUsePermissions = vi.fn();
const mockToast = vi.fn();
const mockUpdateAssignment = vi.fn();
const mockDeleteAssignment = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => mockUsePermissions(),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../application/hooks", () => ({
  useUpdateTemplateAssignment: () => ({
    mutateAsync: mockUpdateAssignment,
    isPending: false,
  }),
  useDeleteTemplateAssignment: () => ({
    mutateAsync: mockDeleteAssignment,
    isPending: false,
  }),
}));

const sampleAssignment: TemplateAssignment = {
  id: "assign-1",
  employeeId: "emp-1",
  employeeFullName: "Carlos López",
  templateId: "tpl-1",
  templateName: "Esquema demo",
  effectiveFrom: "2026-08-01",
  effectiveTo: null,
  isActive: true,
  assignedBy: null,
  reason: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z",
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

describe("TemplateAssignmentActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateAssignment.mockResolvedValue({ ...sampleAssignment, isActive: false });
    mockDeleteAssignment.mockResolvedValue(undefined);
  });

  it("no renderiza menú sin permisos settlements update/delete", () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn(() => false),
    });

    const queryClient = createTestQueryClient();
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <TemplateAssignmentActions assignment={sampleAssignment} />
      </QueryClientProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("muestra acciones con permisos y desactiva vía PATCH", async () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn((resource: string, action: string) => {
        if (resource === "settlements" && action === "update") return true;
        if (resource === "settlements" && action === "delete") return true;
        return false;
      }),
    });

    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TemplateAssignmentActions assignment={sampleAssignment} />
      </QueryClientProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: /Abrir menú de acciones de asignación/i }),
    );
    expect(screen.getByText("Desactivar asignación")).toBeInTheDocument();
    expect(screen.getByText("Eliminar asignación")).toBeInTheDocument();

    await user.click(screen.getByText("Desactivar asignación"));
    await user.click(screen.getByRole("button", { name: /^Desactivar$/i }));

    await waitFor(() => {
      expect(mockUpdateAssignment).toHaveBeenCalledWith({
        id: "assign-1",
        payload: { isActive: false },
      });
    });
  });
});
