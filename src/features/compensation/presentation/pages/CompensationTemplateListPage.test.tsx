import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompensationTemplateListPage } from "./CompensationTemplateListPage";

const mockNavigate = vi.fn();

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
      mutateAsync: vi.fn(),
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
    mockUseCompensationTemplate.mockReturnValue({ data: undefined });
    mockUseCompensationTemplates.mockReturnValue({
      data: {
        data: [
          {
            id: "tpl-1",
            name: "Operador foráneo",
            description: null,
            isActive: true,
            rules: [],
            fixedAllowances: [],
            corridorIds: [],
            corridors: [],
            activeAssignmentsCount: 2,
          },
          {
            id: "tpl-2",
            name: "Esquema local",
            description: null,
            isActive: true,
            rules: [
              {
                routeType: "local",
                commissionType: "none",
                rateValue: 0,
                minimumGuaranteedAmount: 0,
              },
            ],
            fixedAllowances: [],
            corridorIds: [],
            corridors: [],
            activeAssignmentsCount: 0,
          },
        ],
        pagination: { page: 1, limit: 20, total: 25, totalPages: 2 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
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
    expect(screen.getByText("Listo para liquidar")).toBeInTheDocument();
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
      screen.getByText(/Este operador aún no tiene esquema de pago/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Juan Pérez no tiene un esquema de pago vigente/i),
    ).toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: /Asignar a este esquema/i })).toHaveLength(
      1,
    );

    await user.click(screen.getByRole("button", { name: /Asignar a este esquema/i }));

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
});
