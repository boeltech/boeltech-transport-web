/**
 * Smoke — sucursales: listado, export, detalle, baja, matriz, restaurar, alta wizard.
 * Mock de API; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BranchesListPage } from "@features/branches/presentation/pages/BranchesListPage";
import { BranchDetailPage } from "@features/branches/presentation/pages/BranchDetailPage";
import { BranchCreatePage } from "@features/branches/presentation/pages/BranchCreatePage";
import { branchesCopy } from "@features/branches/presentation/copy/branchesCopy";
import { getBranchExportHeaders } from "@features/branches/application/utils/branchExportHelpers";
import {
  BRANCH_TEST_IDS,
  buildBranch,
  buildBranchEmployee,
  buildBranchVehicle,
  buildBranchListMeta,
  buildDeletedBranchListItem,
  buildMainBranchListItem,
  buildBranchListItem,
  buildGeolocatedBranch,
  buildBranchManagementEvent,
} from "@features/branches/test/branchTestFixtures";
import type { BranchListItem } from "@features/branches/domain";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@shared/ui/tooltip";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

const {
  mockGetAll,
  mockGetById,
  mockCreate,
  mockDelete,
  mockRestore,
  mockListEmployees,
  mockListVehicles,
  mockDownloadCsv,
  mockHasPermission,
  mockGetActivity,
} = vi.hoisted(() => ({
  mockGetAll: vi.fn(),
  mockGetById: vi.fn(),
  mockCreate: vi.fn(),
  mockDelete: vi.fn(),
  mockRestore: vi.fn(),
  mockListEmployees: vi.fn(),
  mockListVehicles: vi.fn(),
  mockDownloadCsv: vi.fn(),
  mockHasPermission: vi.fn(),
  mockGetActivity: vi.fn(),
}));

vi.mock("@features/branches/infrastructure/branchesApi", () => ({
  branchesApi: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    getById: (...args: unknown[]) => mockGetById(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
    restore: (...args: unknown[]) => mockRestore(...args),
    update: vi.fn(),
    getActivity: (...args: unknown[]) => mockGetActivity(...args),
  },
}));

vi.mock("@features/branches/infrastructure/branchEmployeesApi", () => ({
  branchEmployeesApi: {
    listByBranch: (...args: unknown[]) => mockListEmployees(...args),
  },
}));

vi.mock("@features/vehicles/infrastructure", () => ({
  vehiclesApi: {
    getAll: (...args: unknown[]) => mockListVehicles(...args),
  },
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: { role: "admin" },
  }),
}));

vi.mock("@features/dashboard/application/hooks/useBranchKpis", () => ({
  useBranchKpis: () => ({
    isLoading: false,
    isError: false,
    data: {
      period: { label: "Mes actual" },
      rows: [],
    },
  }),
}));

vi.mock("@shared/utils/exportCsv", () => ({
  downloadCsv: (...args: unknown[]) => mockDownloadCsv(...args),
}));

vi.mock("@shared/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/permissions")>();
  return {
    ...actual,
    usePermissions: () => ({
      hasPermission: (module: string, action: string) =>
        mockHasPermission(module, action),
      isLoading: false,
      isAuthenticated: true,
      role: "admin",
    }),
  };
});

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

vi.mock("@shared/ui/address-input/AddressInput", () => ({
  default: function AddressInputStub() {
    const { setValue, getValues } = useFormContext();

    useEffect(() => {
      const address = getValues("address");
      if (address?.street?.trim()) return;

      setValue("address.street", "Av. Principal", { shouldValidate: true });
      setValue("address.exteriorNumber", "100", { shouldValidate: true });
      setValue("address.postalCode", "64000", { shouldValidate: true });
      setValue("address.satStateCode", "19", { shouldValidate: true });
      setValue("address.satCountryCode", "MEX", { shouldValidate: true });
    }, [getValues, setValue]);

    return <div data-testid="address-input-stub">Dirección (stub)</div>;
  },
}));

vi.mock("@shared/ui/address-input/AddressGeolocationPanel", () => ({
  AddressGeolocationPanel: () => (
    <div data-testid="address-geolocation-panel-stub" />
  ),
}));

vi.mock("@shared/ui/address-input/AddressGeolocationMap", () => ({
  AddressGeolocationMap: () => <div data-testid="branch-location-map" />,
}));

vi.mock("@shared/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/config")>();
  return {
    ...actual,
    config: {
      ...actual.config,
      geolocation: {
        ...actual.config.geolocation,
        mapboxPublicToken: "pk.smoke-test-token",
      },
    },
  };
});

vi.mock("mapbox-gl", () => ({
  default: {
    accessToken: "",
    Map: vi.fn(),
    Marker: vi.fn(),
  },
}));

vi.mock(
  "@features/branches/presentation/validation/branchOperationalAddressSchema",
  async (importOriginal) => {
    const actual = await importOriginal<
      typeof import("@features/branches/presentation/validation/branchOperationalAddressSchema")
    >();
    return {
      ...actual,
      validateBranchOperationalAddressFormComplete: vi
        .fn()
        .mockResolvedValue({ ok: true }),
    };
  },
);

let activeBranches: BranchListItem[];
let deletedBranches: BranchListItem[];

function resetBranchStore() {
  activeBranches = [
    buildMainBranchListItem(),
    buildBranchListItem({
      id: BRANCH_TEST_IDS.secondary,
      code: "QRO-02",
      name: "Sucursal Secundaria",
      isMain: false,
    }),
  ];
  deletedBranches = [buildDeletedBranchListItem()];
}

function findBranchInStore(id: string) {
  return (
    activeBranches.find((b) => b.id === id) ??
    deletedBranches.find((b) => b.id === id)
  );
}

function seedBranchApiMocks() {
  mockHasPermission.mockImplementation(
    (_module: string, action: string) =>
      ["read", "create", "update", "delete", "export"].includes(action),
  );

  mockGetAll.mockImplementation(
    async (params?: {
      filters?: { isActive?: boolean };
      page?: number;
      limit?: number;
    }) => {
    const showDeleted = params?.filters?.isActive === false;
    const data = showDeleted ? deletedBranches : activeBranches;
    return {
      data,
      pagination: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 10,
        total: data.length,
        totalPages: 1,
      },
      meta: buildBranchListMeta({ activeCount: activeBranches.length }),
    };
  },
  );

  mockGetById.mockImplementation(async (id: string) => {
    const listItem = findBranchInStore(id);
    if (!listItem) return { data: null };
    if (id === BRANCH_TEST_IDS.secondary) {
      return {
        data: buildGeolocatedBranch({
          id: listItem.id,
          code: listItem.code,
          name: listItem.name,
          isMain: listItem.isMain,
        }),
        message: undefined,
      };
    }
    return { data: buildBranch(listItem), message: undefined };
  });

  mockListEmployees.mockResolvedValue([buildBranchEmployee()]);
  mockListVehicles.mockResolvedValue({
    data: [buildBranchVehicle()],
    pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
  });

  mockGetActivity.mockResolvedValue({
    data: [buildBranchManagementEvent()],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  });

  mockDelete.mockImplementation(async (id: string) => {
    const index = activeBranches.findIndex((b) => b.id === id);
    if (index >= 0) {
      const [removed] = activeBranches.splice(index, 1);
      deletedBranches.push({
        ...removed,
        isActive: false,
        status: "inactive",
      });
    }
    return { message: "Sucursal eliminada" };
  });

  mockRestore.mockImplementation(async (id: string) => {
    const index = deletedBranches.findIndex((b) => b.id === id);
    if (index >= 0) {
      const [restored] = deletedBranches.splice(index, 1);
      const item = { ...restored, isActive: true, status: "active" as const };
      activeBranches.push(item);
      return { data: buildBranch(item), message: "Sucursal restaurada" };
    }
    return { data: buildBranch(), message: "Sucursal restaurada" };
  });

  mockCreate.mockImplementation(async () => {
    const created = buildBranch({
      id: "55555555-5555-4555-8555-555555555555",
      code: "QRO-99",
      name: "Sucursal Nueva Smoke",
    });
    activeBranches.push(buildBranchListItem(created));
    return { data: created, message: "Sucursal creada" };
  });
}

function renderBranchesApp(initialEntry = "/branches") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <Routes>
            <Route path="/branches" element={<BranchesListPage />} />
            <Route path="/branches/new" element={<BranchCreatePage />} />
            <Route path="/branches/:id" element={<BranchDetailPage />} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

async function openRowActions(branchName: string) {
  const row = screen.getByText(branchName).closest("tr");
  expect(row).toBeTruthy();
  const menuButton = within(row!).getByRole("button", { name: "Acciones" });
  const user = userEvent.setup();
  await user.click(menuButton);
  return user;
}

describe("branches workflow smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetBranchStore();
    seedBranchApiMocks();
  });

  it("lists branches with capacity banner and city column", async () => {
    renderBranchesApp();

    await waitFor(() => {
      expect(
        screen.getByText(branchesCopy.list.capacity.limited(2, 3)),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("QRO-01")).toBeInTheDocument();
    expect(screen.getByText("Sucursal El Marqués")).toBeInTheDocument();
    expect(screen.getAllByText("El Marqués, Querétaro").length).toBeGreaterThanOrEqual(1);
  });

  it("exports CSV when export button is clicked", async () => {
    renderBranchesApp();

    await waitFor(() => {
      expect(screen.getByText("QRO-01")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: branchesCopy.list.export.label }),
    );

    await waitFor(() => {
      expect(mockDownloadCsv).toHaveBeenCalled();
    });

    const [, headers] = mockDownloadCsv.mock.calls[0] ?? [];
    expect(headers).toEqual(getBranchExportHeaders());
  });

  it("navigates to detail and shows address and assigned employees", async () => {
    renderBranchesApp();

    await waitFor(() => {
      expect(screen.getByText("QRO-02")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Sucursal Secundaria"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sucursal Secundaria" })).toBeInTheDocument();
    });

    expect(screen.getByText(branchesCopy.detail.cards.address)).toBeInTheDocument();
    expect(screen.getByText(branchesCopy.detail.cards.employees)).toBeInTheDocument();
    expect(screen.getByText(branchesCopy.detail.cards.vehicles)).toBeInTheDocument();
    expect(screen.getByText(branchesCopy.detail.map.confirmedLabel)).toBeInTheDocument();
    expect(await screen.findByTestId("branch-location-map")).toBeInTheDocument();
    expect(screen.getByText(branchesCopy.detail.activity.title)).toBeInTheDocument();
    expect(screen.getByText("Sucursal actualizada")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: branchesCopy.detail.employees.viewEmployee }),
    ).toHaveAttribute("href", `/employees/${BRANCH_TEST_IDS.employee}`);
    expect(
      screen.getByRole("link", { name: branchesCopy.detail.vehicles.viewVehicle }),
    ).toHaveAttribute("href", `/vehicles/${BRANCH_TEST_IDS.vehicle}`);
  });

  it("shows geolocation placeholder on detail when coordinates are pending", async () => {
    renderBranchesApp();

    await waitFor(() => {
      expect(screen.getByText("Sucursal El Marqués")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Sucursal El Marqués"));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Sucursal El Marqués" })).toBeInTheDocument();
    });

    expect(
      screen.getByText(branchesCopy.detail.map.noCoordinates),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: branchesCopy.detail.map.completeLocationCta,
      }),
    ).toHaveAttribute("href", `/branches/${BRANCH_TEST_IDS.main}/edit`);
    expect(screen.queryByTestId("branch-location-map")).not.toBeInTheDocument();
  });

  it("deletes a secondary branch from the list actions menu", async () => {
    renderBranchesApp();

    await waitFor(() => {
      expect(screen.getByText("Sucursal Secundaria")).toBeInTheDocument();
    });

    const user = await openRowActions("Sucursal Secundaria");
    await user.click(screen.getByRole("menuitem", { name: branchesCopy.actions.delete }));

    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: branchesCopy.actions.delete }),
    );

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(BRANCH_TEST_IDS.secondary);
      expect(mockGetAll.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("blocks delete action for main branch in the dropdown menu", async () => {
    renderBranchesApp();

    await waitFor(() => {
      expect(screen.getByText("Sucursal El Marqués")).toBeInTheDocument();
    });

    const user = await openRowActions("Sucursal El Marqués");
    expect(
      screen.getByRole("menuitem", {
        name: branchesCopy.actions.mainDeleteDisabled,
      }),
    ).toHaveAttribute("aria-disabled", "true");

    expect(mockDelete).not.toHaveBeenCalled();
    void user;
  });

  it("restores a deleted branch from the deleted view", async () => {
    renderBranchesApp();

    await waitFor(() => {
      expect(screen.getByText("QRO-01")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByLabelText(branchesCopy.list.showDeleted.label));

    await waitFor(() => {
      expect(screen.getByText("Sucursal Eliminada")).toBeInTheDocument();
    });

    const actionsUser = await openRowActions("Sucursal Eliminada");
    await actionsUser.click(
      screen.getByRole("menuitem", { name: branchesCopy.actions.restore }),
    );

    const dialog = await screen.findByRole("alertdialog");
    await actionsUser.click(
      within(dialog).getByRole("button", { name: branchesCopy.actions.restore }),
    );

    await waitFor(() => {
      expect(mockRestore).toHaveBeenCalledWith(BRANCH_TEST_IDS.deleted);
    });
  });

  it("completes create wizard and navigates to branch detail", async () => {
    renderBranchesApp("/branches/new");

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: branchesCopy.create.title }),
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Código/i), "QRO-99");
    await user.type(screen.getByLabelText(/Nombre/i), "Sucursal Nueva Smoke");
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => {
      expect(screen.getByTestId("address-input-stub")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.queryByRole("alert", { name: /Revisa la información de la sucursal/i }),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.click(
      screen.getByRole("button", { name: branchesCopy.create.submitLabel }),
    );

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { name: "Sucursal Nueva Smoke" }),
      ).toBeInTheDocument();
    });
  });
});
