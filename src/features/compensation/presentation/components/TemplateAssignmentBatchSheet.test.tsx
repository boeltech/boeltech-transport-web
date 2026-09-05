import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TemplateAssignmentBatchSheet } from "./TemplateAssignmentBatchSheet";
import type { TemplateAssignment } from "../../domain/entities";

const mockBatchMutate = vi.fn();
const conflictingEmployeeId = "22222222-2222-4222-8222-222222222222";
const templateId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const existingAssignment: TemplateAssignment = {
  id: "assign-existing",
  employeeId: conflictingEmployeeId,
  employeeFullName: "Operador Demo",
  templateId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  templateName: "Esquema previo",
  effectiveFrom: "2026-01-01",
  effectiveTo: null,
  isActive: true,
  assignedBy: null,
  reason: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

vi.mock("@shared/utils/dateUtils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/utils/dateUtils")>();
  return {
    ...actual,
    getTodayString: () => "2026-09-01",
  };
});

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@shared/ui/employee-async-combobox", () => ({
  EmployeeAsyncCombobox: ({
    onChange,
  }: {
    onChange: (ids: string[]) => void;
  }) => (
    <button type="button" onClick={() => onChange([conflictingEmployeeId])}>
      Seleccionar operador
    </button>
  ),
}));

vi.mock("../../application/hooks", () => ({
  useBatchCreateTemplateAssignments: () => ({
    mutateAsync: mockBatchMutate,
    isPending: false,
  }),
  useTemplateAssignments: () => ({
    data: { data: [existingAssignment] },
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

describe("TemplateAssignmentBatchSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra alerta de conflictos al seleccionar operador con asignación solapada", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <TemplateAssignmentBatchSheet
          open
          onOpenChange={vi.fn()}
          templateId={templateId}
        />
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /Seleccionar operador/i }));

    expect(screen.getByText("Conflictos detectados")).toBeInTheDocument();
    expect(screen.getByText(/22222222/)).toBeInTheDocument();
  });
});
