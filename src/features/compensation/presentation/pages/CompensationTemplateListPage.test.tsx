import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompensationTemplateListPage } from "./CompensationTemplateListPage";

const mockNavigate = vi.fn();
const mockBatchMutate = vi.fn();
const mockRefetchTemplates = vi.fn();

const { mockUseCompensationTemplates, mockUseCompensationTemplate } = vi.hoisted(() => ({
  mockUseCompensationTemplates: vi.fn(),
  mockUseCompensationTemplate: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../application/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../application/hooks")>();
  return {
    ...actual,
    useCompensationTemplates: (...args: unknown[]) => mockUseCompensationTemplates(...args),
    useCompensationTemplate: (...args: unknown[]) => mockUseCompensationTemplate(...args),
    useCreateCompensationTemplate: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useBatchCreateTemplateAssignments: () => ({
      mutateAsync: mockBatchMutate,
      isPending: false,
    }),
    useDeleteCompensationTemplate: () => ({
      mutateAsync: vi.fn(),
      isPending: false,
    }),
    useTemplateAssignments: () => ({
      data: { data: [] },
      isLoading: false,
      refetch: vi.fn(),
    }),
  };
});

vi.mock("@features/employees", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/employees")>();
  return {
    ...actual,
    useEmployee: () => ({
      data: {
        data: {
          fullName: "Juan Pérez",
        },
      },
    }),
  };
});

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
    useMediaQuery: (query: string) => query !== "(max-width: 1023px)",
  };
});

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({ data: { data: [] } }),
}));

vi.mock("../../application/hooks/useCorridors", () => ({
  useCorridorTariffs: () => ({ data: { data: [] } }),
}));

function renderPage(initialPath = "/finance/compensation/templates") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/finance/compensation/templates" element={<CompensationTemplateListPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("CompensationTemplateListPage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockBatchMutate.mockReset();
    mockBatchMutate.mockResolvedValue({ createdCount: 1, skippedCount: 0 });
    mockRefetchTemplates.mockReset();
    mockUseCompensationTemplate.mockReturnValue({ data: undefined });
    mockUseCompensationTemplates.mockReturnValue({
      data: {
        data: [
          {
            id: "tpl-1",
            name: "Operador foráneo",
            description: null,
            isActive: true,
            status: "active",
            version: 1,
            familyId: "tpl-1",
            lockedForEdit: false,
            rules: [],
            fixedAllowances: [],
            deductions: [],
            corridorIds: [],
            corridors: [],
            activeAssignmentsCount: 2,
          },
          {
            id: "tpl-2",
            name: "Esquema local",
            description: null,
            isActive: true,
            status: "active",
            version: 1,
            familyId: "tpl-2",
            lockedForEdit: false,
            rules: [
              {
                routeType: "local",
                commissionType: "none",
                rateValue: 0,
                minimumGuaranteedAmount: 0,
              },
            ],
            fixedAllowances: [],
            deductions: [],
            corridorIds: [],
            corridors: [],
            activeAssignmentsCount: 0,
          },
        ],
        pagination: { page: 1, limit: 20, total: 25, totalPages: 2 },
      },
      isLoading: false,
      isFetching: false,
      refetch: mockRefetchTemplates,
    });
  });

  it("muestra catálogo con Uso, Cómo se paga y operadores", () => {
    renderPage();

    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument();
    expect(screen.getByText("Operador foráneo")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Uso" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Cómo se paga" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Operadores" })).toBeInTheDocument();
    expect(screen.getByTitle("2 operadores")).toBeInTheDocument();
    expect(screen.getByText("Falta definir el pago")).toBeInTheDocument();
    expect(screen.getByText("Listo para usar en pagos")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Completar pago/i }),
    ).toHaveAttribute("href", "/finance/compensation/templates/tpl-1/build");
    expect(screen.getByRole("link", { name: /^Editar$/i })).toHaveAttribute(
      "href",
      "/finance/compensation/templates/tpl-2/build",
    );
  });

  it("abre Sheet de operadores al asignar desde banner employeeId solo en esquemas listos", async () => {
    const user = userEvent.setup();
    renderPage("/finance/compensation/templates?employeeId=emp-1");

    expect(
      screen.getByText(/Este operador aún no tiene tarifa de pago/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Juan Pérez no tiene una tarifa de pago vigente/i),
    ).toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: /Asignar a esta tarifa/i })).toHaveLength(
      1,
    );

    await user.click(screen.getByRole("button", { name: /Asignar a esta tarifa/i }));

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      await screen.findByRole("heading", { name: /Operadores — Esquema local/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Asignación masiva/i })).toBeInTheDocument();
  });

  it("abre Sheet de operadores con deep link ?operators=", async () => {
    renderPage("/finance/compensation/templates?operators=tpl-1");

    expect(
      await screen.findByRole("heading", { name: /Operadores — Operador foráneo/i }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /Asignar operadores/i }),
    ).toBeInTheDocument();
  });

  it("Completar pago apunta al editor de esquema", () => {
    renderPage();

    expect(screen.getByRole("link", { name: /Completar pago/i })).toHaveAttribute(
      "href",
      "/finance/compensation/templates/tpl-1/build",
    );
  });

  it("abre operadores con assign pre-cargado", async () => {
    renderPage("/finance/compensation/templates?operators=tpl-2&assign=emp-9");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Operadores — Esquema local/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: /Asignación masiva/i })).toBeInTheDocument();
  });

  it("tras confirmar asignación cierra sheets y limpia banner employeeId", async () => {
    const user = userEvent.setup();
    const employeeId = "11111111-1111-4111-8111-111111111111";
    renderPage(`/finance/compensation/templates?employeeId=${employeeId}`);

    expect(
      screen.getByText(/Este operador aún no tiene tarifa de pago/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Asignar a esta tarifa/i }));

    expect(
      await screen.findByRole("heading", { name: /Asignación masiva/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Confirmar asignación/i }));

    await waitFor(() => {
      expect(mockBatchMutate).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        screen.queryByText(/Este operador aún no tiene tarifa de pago/i),
      ).not.toBeInTheDocument();
    });
    expect(
      screen.queryByRole("heading", { name: /Asignación masiva/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Operadores —/i }),
    ).not.toBeInTheDocument();
    expect(mockRefetchTemplates).toHaveBeenCalled();
  });
});
