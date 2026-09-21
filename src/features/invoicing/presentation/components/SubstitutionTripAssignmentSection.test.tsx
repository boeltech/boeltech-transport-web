import { describe, expect, it, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Invoice, InvoiceTripRef } from "@features/invoicing/domain";
import type { DriverListItem } from "@features/drivers/domain";
import type { AssignableVehicleItem } from "@features/vehicles/domain";
import type { Trip } from "@features/trips/domain";
import { TooltipProvider } from "@shared/ui/tooltip";
import { invoicingCopy } from "../copy/invoicingCopy";
import { SubstitutionTripAssignmentSection } from "./SubstitutionTripAssignmentSection";

const TRIP_ID = "trip-assign-1";
const copy = invoicingCopy.detail.substitute.assignment;

beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
});

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@features/trips/application/hooks/trip/useTrip", () => ({
  useTrip: () => ({
    data: {
      id: TRIP_ID,
      driverId: "drv-current",
      vehicleId: "veh-current",
    } as Trip,
    isLoading: false,
  }),
}));

vi.mock("@features/drivers/application", () => ({
  useDrivers: () => ({
    data: {
      data: [
        {
          id: "drv-ok",
          tenantId: "t",
          employeeId: "emp-ok",
          employee: {
            id: "emp-ok",
            employeeNumber: "E-1",
            firstName: "Ana",
            lastName: "Libre",
            secondLastName: null,
            fullName: "Ana Libre",
            email: null,
            phone: null,
            mobilePhone: null,
            curp: null,
            rfc: null,
          },
          licenseNumber: "LIC-1",
          licenseType: "E",
          licenseExpiry: "2030-01-01",
          isFederalLicenseExpired: false,
          isStateLicenseExpired: false,
          status: "available",
          yearsOfExperience: 1,
          totalTrips: 0,
          isLicenseExpired: false,
          isActive: true,
          createdAt: new Date(),
          branchId: null,
          branchName: null,
          branchCode: null,
        },
        {
          id: "drv-expired",
          tenantId: "t",
          employeeId: "emp-exp",
          employee: {
            id: "emp-exp",
            employeeNumber: "E-2",
            firstName: "Luis",
            lastName: "Vencido",
            secondLastName: null,
            fullName: "Luis Vencido",
            email: null,
            phone: null,
            mobilePhone: null,
            curp: null,
            rfc: null,
          },
          licenseNumber: "LIC-2",
          licenseType: "E",
          licenseExpiry: "2020-01-01",
          isFederalLicenseExpired: true,
          isStateLicenseExpired: false,
          status: "available",
          yearsOfExperience: 1,
          totalTrips: 0,
          isLicenseExpired: true,
          isActive: true,
          createdAt: new Date(),
          branchId: null,
          branchName: null,
          branchCode: null,
        },
      ] as DriverListItem[],
    },
    isLoading: false,
  }),
}));

vi.mock("@features/vehicles/application", () => ({
  useAssignableVehicles: () => ({
    data: [
      {
        id: "veh-ok",
        unitNumber: "U-100",
        licensePlate: "OK100",
        brand: "Freightliner",
        model: "Cascadia",
        year: 2022,
        type: "truck",
        color: null,
        status: "available",
        currentMileage: 0,
        isActive: true,
        insurancePolicy: "POL-OK",
        insuranceExpiry: "2030-01-01",
        sctPermitNumber: "SCT-OK",
        sctPermitExpiry: "2030-01-01",
        satTipoPermisoCode: "TPAF01",
        satConfigAutotransporteCode: "C2",
        pesoBrutoVehicular: 25,
        insuranceCompany: "GNP",
        remolques: [],
        branchId: null,
        branchName: null,
        branchCode: null,
        canBeAssigned: true,
      },
      {
        id: "veh-expired",
        unitNumber: "U-200",
        licensePlate: "VN200",
        brand: "Kenworth",
        model: "T680",
        year: 2020,
        type: "truck",
        color: null,
        status: "available",
        currentMileage: 0,
        isActive: true,
        insurancePolicy: "POL-OLD",
        insuranceExpiry: "2020-01-01",
        sctPermitNumber: "SCT-OLD",
        sctPermitExpiry: "2030-01-01",
        satTipoPermisoCode: "TPAF01",
        satConfigAutotransporteCode: "C2",
        pesoBrutoVehicular: 25,
        insuranceCompany: "GNP",
        remolques: [],
        branchId: null,
        branchName: null,
        branchCode: null,
        canBeAssigned: false,
        blockReason: "Seguro vencido",
        expiredDocsOverridable: true,
      },
    ] as AssignableVehicleItem[],
    isLoading: false,
  }),
}));

function buildInvoice(): Invoice {
  const tripRef: InvoiceTripRef = {
    tripId: TRIP_ID,
    tripCode: "TRP-100",
    clientName: "Cliente",
    scheduledDeparture: "2026-06-01T08:00:00.000Z",
    originCity: "Monterrey",
    originState: "NL",
    destinationCity: "Saltillo",
    destinationState: "CO",
    baseRate: 1000,
    billingScope: "primary_transport",
  };

  return {
    id: "inv-1",
    trips: [tripRef],
  } as Invoice;
}

function renderSection() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <SubstitutionTripAssignmentSection
          invoice={buildInvoice()}
          tripCorrections={[]}
          onSaveCorrection={vi.fn()}
          sheetOpen
        />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

async function openAssignmentSection(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(screen.getByRole("button", { name: /Operador y unidad/i }));
  expect(await screen.findByText(copy.sectionHint)).toBeInTheDocument();
}

describe("SubstitutionTripAssignmentSection — selectabilidad docs vencidos (T4-041)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra hint mid-trip a Operación → Reasignar flota y no expone toggle allow_expired_docs", async () => {
    const user = userEvent.setup();
    renderSection();
    await openAssignmentSection(user);

    expect(
      screen.getByTestId("substitute-expired-docs-path-hint"),
    ).toHaveTextContent(/Operación → Reasignar flota/i);
    expect(
      screen.queryByRole("checkbox", {
        name: /documentación vencida|allow_expired|Permitir/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/documentación vencida/i)).not.toBeInTheDocument();
  });

  it("deja unidades con docs vencidos visibles pero no seleccionables", async () => {
    const user = userEvent.setup();
    renderSection();
    await openAssignmentSection(user);

    await user.click(screen.getByRole("combobox", { name: /Unidad/i }));
    const listbox = await screen.findByRole("listbox");

    expect(within(listbox).getByText("No asignables")).toBeInTheDocument();
    expect(within(listbox).getByText("Seguro vencido")).toBeInTheDocument();

    const expiredOption = within(listbox).getByRole("option", {
      name: /U-200/,
    });
    expect(expiredOption).toHaveAttribute("data-disabled");

    const okOption = within(listbox).getByRole("option", {
      name: /U-100/,
    });
    expect(okOption).not.toHaveAttribute("data-disabled");

    await user.keyboard("{Escape}");
  });

  it("deja conductores con licencia vencida visibles pero no seleccionables", async () => {
    const user = userEvent.setup();
    renderSection();
    await openAssignmentSection(user);

    await user.click(screen.getByRole("combobox", { name: /Operador/i }));
    const listbox = await screen.findByRole("listbox");

    expect(within(listbox).getByText("No asignables")).toBeInTheDocument();
    expect(within(listbox).getByText("Licencia vencida")).toBeInTheDocument();

    const expiredOption = within(listbox).getByRole("option", {
      name: /Luis Vencido/i,
    });
    expect(expiredOption).toHaveAttribute("data-disabled");

    const okOption = within(listbox).getByRole("option", {
      name: /Ana Libre/i,
    });
    expect(okOption).not.toHaveAttribute("data-disabled");

    await user.keyboard("{Escape}");
  });
});
