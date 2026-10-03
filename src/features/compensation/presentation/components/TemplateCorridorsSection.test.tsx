import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TemplateCorridorsSection } from "./TemplateCorridorsSection";
import type { CompensationTemplateFormData } from "../validation/compensationSchemas";
import { COMPENSATION_CORRIDORS_PATH } from "../../application/compensationRoutes";

const { mockUseCorridorTariffs, mockUseBranches } = vi.hoisted(() => ({
  mockUseCorridorTariffs: vi.fn(),
  mockUseBranches: vi.fn(),
}));

vi.mock("../../application/hooks/useCorridors", () => ({
  useCorridorTariffs: (...args: unknown[]) => mockUseCorridorTariffs(...args),
}));

vi.mock("../../application/hooks", () => ({
  useCreateCorridorTariff: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateCorridorTariff: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: (...args: unknown[]) => mockUseBranches(...args),
}));

function SectionHarness() {
  const { control } = useForm<CompensationTemplateFormData>({
    defaultValues: {
      name: "Demo",
      description: null,
      isActive: true,
      midTripPayoutPolicy: "split_by_assigned_km",
      rules: [],
      fixedAllowances: [],
      deductions: [],
      corridorIds: [],
    },
  });
  return <TemplateCorridorsSection control={control} stepPrefix="" />;
}

function renderSection() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <SectionHarness />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("TemplateCorridorsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBranches.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });
  });

  it("sin corredores muestra botón Crear ruta con tarifa fija (sin href create=)", () => {
    mockUseCorridorTariffs.mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });

    renderSection();

    const createButton = screen.getByRole("button", {
      name: /Crear ruta con tarifa fija/i,
    });
    expect(createButton).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Crear ruta con tarifa fija/i }),
    ).not.toBeInTheDocument();

    const catalogLink = screen.getByRole("link", {
      name: /Ver catálogo de rutas/i,
    });
    expect(catalogLink).toHaveAttribute("href", COMPENSATION_CORRIDORS_PATH);
  });

  it("con corredores muestra botón crear + link Ver catálogo de rutas", () => {
    mockUseCorridorTariffs.mockReturnValue({
      data: {
        data: [
          {
            id: "cor-1",
            name: "CDMX → MTY",
            originRefType: "city_label",
            originRefValue: "Ciudad de México",
            destinationRefType: "city_label",
            destinationRefValue: "Monterrey",
            fixedAmount: 1500,
            notes: null,
            isActive: true,
          },
        ],
      },
      isLoading: false,
    });

    renderSection();

    expect(
      screen.getByRole("button", { name: /Crear ruta con tarifa fija/i }),
    ).toBeInTheDocument();

    const catalogLink = screen.getByRole("link", {
      name: /Ver catálogo de rutas/i,
    });
    expect(catalogLink).toHaveAttribute("href", "/finance/compensation/corridors");
  });

  it("con corredores muestra jerarquía ruta + monto + nombre", () => {
    mockUseCorridorTariffs.mockReturnValue({
      data: {
        data: [
          {
            id: "cor-1",
            name: "CDMX → MTY",
            originRefType: "city_label",
            originRefValue: "Ciudad de México",
            destinationRefType: "city_label",
            destinationRefValue: "Monterrey",
            fixedAmount: 1500,
            notes: null,
            isActive: true,
          },
        ],
      },
      isLoading: false,
    });

    renderSection();

    expect(screen.getByText(/Ciudad de México → Monterrey/i)).toBeInTheDocument();
    expect(screen.getByText("CDMX → MTY")).toBeInTheDocument();
    expect(screen.getByText(/\$1,500/)).toBeInTheDocument();
  });

  it("filtra checklist por nombre de ruta", async () => {
    const user = userEvent.setup();
    mockUseCorridorTariffs.mockReturnValue({
      data: {
        data: [
          {
            id: "cor-1",
            name: "CDMX → MTY",
            originRefType: "city_label",
            originRefValue: "Ciudad de México",
            destinationRefType: "city_label",
            destinationRefValue: "Monterrey",
            fixedAmount: 1500,
            notes: null,
            isActive: true,
          },
          {
            id: "cor-2",
            name: "GDL → TJ",
            originRefType: "city_label",
            originRefValue: "Guadalajara",
            destinationRefType: "city_label",
            destinationRefValue: "Tijuana",
            fixedAmount: 2000,
            notes: null,
            isActive: true,
          },
        ],
      },
      isLoading: false,
    });

    renderSection();

    await user.type(screen.getByPlaceholderText("Buscar ruta…"), "guadalajara");

    expect(screen.getByText("GDL → TJ")).toBeInTheDocument();
    expect(screen.queryByText("CDMX → MTY")).not.toBeInTheDocument();
  });
});
