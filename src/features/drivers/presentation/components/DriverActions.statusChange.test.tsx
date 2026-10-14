import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DriverActions } from "./DriverActions";
import { driversCopy } from "../copy/driversCopy";
import type { DriverListItem } from "../../domain";

type Callbacks = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

const { mockUpdateMutate, mockHasPermission, callbacks } = vi.hoisted(() => ({
  mockUpdateMutate: vi.fn(),
  mockHasPermission: vi.fn(),
  callbacks: { update: {} as Callbacks },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("../../application", () => ({
  useUpdateDriverStatus: (cb: Callbacks) => {
    callbacks.update = cb;
    return { mutate: mockUpdateMutate, isPending: false };
  },
  useDeleteDriver: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function buildDriver(
  overrides: Partial<DriverListItem> = {},
): DriverListItem {
  return {
    id: "d-1",
    tenantId: "t-1",
    employeeId: "e-1",
    employee: {
      id: "e-1",
      firstName: "Juan",
      lastName: "Pérez",
      secondLastName: null,
      fullName: "Juan Pérez",
      employeeNumber: "EMP-001",
      email: "juan@example.com",
      phone: "5551234567",
      mobilePhone: null,
      curp: null,
      rfc: "XAXX010101000",
      branchId: null,
      branchName: null,
      branchCode: null,
    },
    federalLicenseNumber: "SICT-1",
    federalLicenseCategory: "B",
    federalLicenseExpiry: "2027-01-01",
    stateLicenseNumber: null,
    stateLicenseExpiry: null,
    stateIssuingState: null,
    hasFederalLicense: true,
    hasStateLicense: false,
    isFederalLicenseExpired: false,
    isStateLicenseExpired: false,
    status: "available",
    yearsOfExperience: 5,
    totalTrips: 10,
    isLicenseExpired: false,
    isActive: true,
    createdAt: new Date("2026-01-01"),
    branchId: null,
    branchName: null,
    branchCode: null,
    ...overrides,
  };
}

function renderButtons(
  props: {
    driverId?: string;
    driverName?: string;
    status?: DriverListItem["status"];
  } = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DriverActions
          driverId={props.driverId ?? "d-1"}
          driverName={props.driverName ?? "Juan Pérez"}
          status={props.status ?? "available"}
          variant="buttons"
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const statusCopy = driversCopy.detail.statusChange;

describe("DriverActions status change (D1/D2/D11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    callbacks.update = {};
    mockHasPermission.mockImplementation(
      (module: string, action: string) =>
        module === "drivers" && (action === "update" || action === "delete"),
    );
  });

  it("abre el dialog sin campo de motivo y confirma solo status", async () => {
    const user = userEvent.setup();
    renderButtons();

    await user.click(screen.getByRole("button", { name: /cambiar estado/i }));
    await user.click(
      screen.getByRole("menuitem", { name: /descanso/i }),
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent(statusCopy.title);
    expect(screen.queryByLabelText(/motivo/i)).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/motivo del cambio/i),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: statusCopy.confirm }),
    );

    expect(mockUpdateMutate).toHaveBeenCalledWith({
      id: "d-1",
      data: { status: "resting" },
    });
  });

  it("muestra Alert inline en el dialog cuando falla el cambio de estado", async () => {
    const user = userEvent.setup();
    renderButtons();

    await user.click(screen.getByRole("button", { name: /cambiar estado/i }));
    await user.click(
      screen.getByRole("menuitem", { name: /descanso/i }),
    );
    await user.click(
      screen.getByRole("button", { name: statusCopy.confirm }),
    );

    callbacks.update.onError?.(new Error("Conductor en viaje activo"));

    expect(await screen.findByText(statusCopy.errorTitle)).toBeInTheDocument();
    expect(screen.getByText("Conductor en viaje activo")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("dropdown de listado no ofrece cambio de estado aunque haya update", async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: { retry: false },
              mutations: { retry: false },
            },
          })
        }
      >
        <MemoryRouter>
          <DriverActions
            driver={buildDriver()}
            variant="dropdown"
            onView={vi.fn()}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: /abrir menú de acciones/i }),
    );

    expect(
      screen.getByRole("menuitem", { name: /ver detalles/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: /^editar$/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /descanso/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /vacaciones/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /marcar disponible/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("menuitem", { name: /dar de baja/i }),
    ).not.toBeInTheDocument();
  });

  it("Eliminar en header es outline, no sólida primaria junto a Editar (D7)", () => {
    renderButtons();

    const edit = screen.getByRole("button", { name: /^editar$/i });
    const del = screen.getByRole("button", { name: /^eliminar$/i });

    expect(edit.className).toMatch(/bg-primary|default/);
    expect(del.className).not.toMatch(/bg-destructive(?!\/)/);
    expect(del.className).toMatch(/border|outline|text-destructive/);
  });
});
