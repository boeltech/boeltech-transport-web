/**
 * Smoke — wizard alta de conductor (/drivers/new).
 * Mock de API; no requiere backend ni Playwright.
 */
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@shared/ui/tooltip";
import { DriverCreatePage } from "@features/drivers/presentation/pages/DriverCreatePage";
import { driversCopy } from "@features/drivers/presentation/copy/driversCopy";

const EMPLOYEE_ID = "11111111-1111-4111-8111-111111111111";
const DRIVER_ID = "44444444-4444-4444-8444-444444444444";

const {
  mockCreateDriver,
  mockNavigate,
  mockHasPermission,
  mockGetAvailableForDriver,
  mockGetEmployeeBasic,
  mockEmployee,
} = vi.hoisted(() => {
  const mockEmployee = {
    id: "11111111-1111-4111-8111-111111111111",
    employeeNumber: "EMP-001",
    fullName: "Juan Pérez",
    department: "Operaciones",
    position: "Conductor",
  };
  return {
    mockCreateDriver: vi.fn(),
    mockNavigate: vi.fn(),
    mockHasPermission: vi.fn(),
    mockGetAvailableForDriver: vi.fn(),
    mockGetEmployeeBasic: vi.fn(),
    mockEmployee,
  };
});

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@features/drivers/infrastructure", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/drivers/infrastructure")>();
  return {
    ...actual,
    createDriverRepository: () => ({
      create: mockCreateDriver,
      findAll: vi.fn(),
      findById: vi.fn(),
      findAvailable: vi.fn(),
      findTrips: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
      existsByLicenseNumber: vi.fn(),
    }),
  };
});

vi.mock("@features/employees/infrastructure/employeeRepository", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@features/employees/infrastructure/employeeRepository")
    >();
  return {
    ...actual,
    getAvailableForDriver: (...args: unknown[]) => mockGetAvailableForDriver(...args),
    getEmployeeBasic: (...args: unknown[]) => mockGetEmployeeBasic(...args),
  };
});

vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: { role: "admin" },
  }),
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

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function renderDriverCreatePage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MemoryRouter initialEntries={["/drivers/new"]}>
          <Routes>
            <Route path="/drivers/new" element={<DriverCreatePage />} />
          </Routes>
        </MemoryRouter>
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn();
});

async function pickFederalLicenseExpiry(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Vencimiento federal" }));
  const calendar = await screen.findByRole("dialog");
  await user.click(
    within(calendar).getByRole("button", { name: "Mes siguiente" }),
  );
  const dayButtons = within(calendar).getAllByRole("button", { name: "15" });
  const enabledDay = dayButtons.find((btn) => !btn.hasAttribute("disabled"));
  await user.click(enabledDay ?? dayButtons[0]!);
}

describe("drivers create wizard smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
    mockGetAvailableForDriver.mockResolvedValue([
      {
        id: EMPLOYEE_ID,
        employee_number: mockEmployee.employeeNumber,
        first_name: "Juan",
        last_name: "Pérez",
        second_last_name: null,
        full_name: mockEmployee.fullName,
        department: mockEmployee.department,
        position: mockEmployee.position,
      },
    ]);
    mockGetEmployeeBasic.mockResolvedValue({
      id: EMPLOYEE_ID,
      employee_number: mockEmployee.employeeNumber,
      full_name: mockEmployee.fullName,
      department: mockEmployee.department,
      position: mockEmployee.position,
    });
    mockCreateDriver.mockResolvedValue({
      data: {
        id: DRIVER_ID,
        employeeId: EMPLOYEE_ID,
        federalLicenseNumber: "SICT-123",
        federalLicenseCategory: "B",
        federalLicenseExpiry: "2030-06-15",
        stateLicenseNumber: null,
        stateLicenseExpiry: null,
        stateIssuingState: null,
        status: "available",
        isActive: true,
      },
    });
  });

  it("completes wizard and registers driver", async () => {
    renderDriverCreatePage();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: driversCopy.form.create.title }),
      ).toBeInTheDocument();
    });

    const user = userEvent.setup();

    await waitFor(() => {
      expect(mockGetAvailableForDriver).toHaveBeenCalled();
    });

    await user.click(
      screen.getByRole("combobox", { name: driversCopy.form.employeeSelector.ariaLabel }),
    );
    const employeeOption = await screen.findByText(
      `${mockEmployee.employeeNumber} — ${mockEmployee.fullName}`,
      {},
      { timeout: 10_000 },
    );
    await user.click(employeeOption);

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => {
      expect(
        screen.getByLabelText(driversCopy.form.label.federalLicenseNumber),
      ).toBeInTheDocument();
    });

    await user.type(
      screen.getByLabelText(driversCopy.form.label.federalLicenseNumber),
      "SICT-123",
    );

    await user.click(screen.getByRole("combobox", { name: /Categoría SICT/i }));
    const listbox = await screen.findByRole("listbox");
    await user.click(
      within(listbox).getByText("B — Carga general (SICT)"),
    );

    await pickFederalLicenseExpiry(user);

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => {
      expect(
        screen.getByText(driversCopy.form.section.psychometric.title),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    await waitFor(() => {
      expect(
        screen.getByText(driversCopy.form.section.review.description),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: driversCopy.form.action.register }),
    );

    await waitFor(() => {
      expect(mockCreateDriver).toHaveBeenCalledTimes(1);
    });

    const payload = mockCreateDriver.mock.calls[0]?.[0] as {
      employeeId: string;
      federalLicenseNumber?: string | null;
    };
    expect(payload.employeeId).toBe(EMPLOYEE_ID);
    expect(payload.federalLicenseNumber).toBe("SICT-123");

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/drivers/${DRIVER_ID}`);
    });
  }, 30_000);
});
