import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VehicleListPage } from "./VehicleListPage";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import type { VehicleListItem } from "../../domain";

const BRANCH_ID = "11111111-1111-4111-8111-111111111111";

const {
  mockUseVehicles,
  mockUseDeleteVehicle,
  mockUseBranches,
  mockHasPermission,
  mockUseRole,
} = vi.hoisted(() => ({
  mockUseVehicles: vi.fn(),
  mockUseDeleteVehicle: vi.fn(),
  mockUseBranches: vi.fn(),
  mockHasPermission: vi.fn(() => true),
  mockUseRole: vi.fn(() => "admin"),
}));

vi.mock("../../application", () => ({
  useVehicles: (...args: unknown[]) => mockUseVehicles(...args),
  useDeleteVehicle: (...args: unknown[]) => mockUseDeleteVehicle(...args),
  useUpdateVehicle: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: (...args: unknown[]) => mockUseBranches(...args),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
  }),
  useRole: () => mockUseRole(),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...mod,
    useToast: () => ({ toast: vi.fn() }),
  };
});

function renderPage(initialUrl = "/vehicles") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <VehicleListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const copy = vehiclesCopy.list;

describe("VehicleListPage toolbar", () => {
  beforeEach(() => {
    mockUseBranches.mockReturnValue({
      data: {
        data: [
          {
            id: BRANCH_ID,
            code: "SUC-N",
            name: "Norte",
            status: "active",
            isActive: true,
          },
        ],
      },
    });
    mockUseVehicles.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, totalPages: 1, total: 0, limit: 10 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });
    mockUseDeleteVehicle.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockHasPermission.mockImplementation(() => true);
    mockUseRole.mockReturnValue("admin");
  });

  it("pasa branchId a useVehicles desde la URL y muestra el chip", () => {
    renderPage(`/vehicles?branchId=${BRANCH_ID}`);

    expect(mockUseVehicles).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          branchId: BRANCH_ID,
          isActive: true,
        }),
      }),
    );
    expect(
      screen.getByText(copy.filters.chipBranch("SUC-N — Norte")),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.empty.descriptionFiltered)).toBeInTheDocument();
  });

  it("sin recortes no filtra y no pone estado, tipo ni sucursal en el riel", () => {
    renderPage();

    expect(mockUseVehicles).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          branchId: undefined,
          status: undefined,
          type: undefined,
          isActive: true,
        }),
      }),
    );
    expect(screen.getByRole("button", { name: /^Filtros$/ })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(copy.filter.searchPlaceholder),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.actions.importAria })).toBeInTheDocument();
    expect(screen.queryByText(copy.filters.allBranches)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.filter.statusLabel)).not.toBeInTheDocument();
    expect(screen.queryByText(copy.filter.typeLabel)).not.toBeInTheDocument();
    expect(screen.getByText(copy.empty.descriptionClear)).toBeInTheDocument();
  });

  it("manager canCreate usa empty de recepción de patio", () => {
    mockUseRole.mockReturnValue("manager");
    renderPage();
    expect(
      screen.getByText(copy.empty.descriptionClearManager),
    ).toBeInTheDocument();
    expect(screen.getByText(copy.page.descriptionManager)).toBeInTheDocument();
    expect(
      screen.queryByText(copy.empty.descriptionClear),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(copy.empty.descriptionReadonly),
    ).not.toBeInTheDocument();
  });

  it("empty RO pide el alta a administración si !vehicles.create", () => {
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        !(module === "vehicles" && action === "create"),
    );
    renderPage();
    expect(screen.getByText(copy.empty.descriptionReadonly)).toBeInTheDocument();
    expect(
      screen.queryByText(copy.empty.descriptionClear),
    ).not.toBeInTheDocument();
  });
});

function buildListItem(
  overrides: Partial<VehicleListItem> = {},
): VehicleListItem {
  return {
    id: "v-1",
    unitNumber: "U-01",
    licensePlate: "ABC1234",
    brand: "Kenworth",
    model: "T680",
    year: 2024,
    type: "truck",
    color: null,
    status: "available",
    currentMileage: 1000,
    isActive: true,
    insurancePolicy: null,
    insuranceExpiry: null,
    sctPermitNumber: null,
    sctPermitExpiry: null,
    satTipoPermisoCode: null,
    satConfigAutotransporteCode: null,
    pesoBrutoVehicular: null,
    insuranceCompany: null,
    remolques: [],
    branchId: null,
    branchName: null,
    branchCode: null,
    ...overrides,
  };
}

describe("VehicleListPage billing policy (F1)", () => {
  beforeEach(() => {
    mockUseBranches.mockReturnValue({ data: { data: [] } });
    mockUseDeleteVehicle.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockHasPermission.mockImplementation(() => true);
    mockUseRole.mockReturnValue("admin");
  });

  it("el listado no muestra copy de cobro ni suscripción", () => {
    mockUseVehicles.mockReturnValue({
      data: {
        data: [buildListItem()],
        pagination: { page: 1, totalPages: 1, total: 1, limit: 10 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByText("Vehículos")).toBeInTheDocument();
    expect(screen.getByText("Gestión de la flota vehicular")).toBeInTheDocument();
    expect(screen.queryByText(/mes completo/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/crédito/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/suscripción/i)).not.toBeInTheDocument();
  });

  it("eliminar un tracto cobrable muestra la frase de baja", async () => {
    const user = userEvent.setup();
    mockUseVehicles.mockReturnValue({
      data: {
        data: [buildListItem()],
        pagination: { page: 1, totalPages: 1, total: 1, limit: 10 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    await user.click(screen.getByRole("button", { name: /abrir menú/i }));
    await user.click(screen.getByRole("menuitem", { name: /eliminar/i }));

    expect(
      screen.getByText(vehiclesCopy.billingPolicy.remove, { exact: false }),
    ).toBeInTheDocument();
  });

  it("eliminar un pickup cobrable muestra la frase de baja", async () => {
    const user = userEvent.setup();
    mockUseVehicles.mockReturnValue({
      data: {
        data: [buildListItem({ type: "pickup", unitNumber: "U-P1" })],
        pagination: { page: 1, totalPages: 1, total: 1, limit: 10 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    await user.click(screen.getByRole("button", { name: /abrir menú/i }));
    await user.click(screen.getByRole("menuitem", { name: /eliminar/i }));

    expect(
      screen.getByText(vehiclesCopy.billingPolicy.remove, { exact: false }),
    ).toBeInTheDocument();
  });

  it("eliminar un utility no muestra la frase de crédito", async () => {
    const user = userEvent.setup();
    mockUseVehicles.mockReturnValue({
      data: {
        data: [buildListItem({ type: "utility", unitNumber: "U-U1" })],
        pagination: { page: 1, totalPages: 1, total: 1, limit: 10 },
      },
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    });

    renderPage();

    await user.click(screen.getByRole("button", { name: /abrir menú/i }));
    await user.click(screen.getByRole("menuitem", { name: /eliminar/i }));

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("U-U1");
    expect(dialog).not.toHaveTextContent(vehiclesCopy.billingPolicy.remove);
    expect(dialog).not.toHaveTextContent(/crédito/i);
  });
});
