import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

import { TripStatus, type TripListItem } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { tripsListCopy } from "../copy/listCopy";
import { TripTable } from "./TripTable";

const { mockHasPermission } = vi.hoisted(() => ({
  mockHasPermission: vi.fn((module: string, action: string) => {
    if (module === "finance" && action === "read") return true;
    return true;
  }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({ hasPermission: mockHasPermission }),
}));

vi.mock("@features/catalogs", () => ({
  useCatalogOptions: () => ({ data: [] }),
}));

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

function listTrip(overrides: Partial<TripListItem> = {}): TripListItem {
  return {
    id: "t1",
    tripCode: "T-100",
    client: { id: "c1", legalName: "Transportes del Norte SA" },
    vehicle: {
      id: "v1",
      unitNumber: "U-12",
      licensePlate: "ABC-123",
    },
    driver: { id: "d1", fullName: "Ana Pérez" },
    originCity: "Guadalajara",
    originState: "JAL",
    destinationCity: "Monterrey",
    destinationState: "NLE",
    scheduledDeparture: new Date("2026-05-17T10:00:00.000Z"),
    scheduledArrival: null,
    status: TripStatus.SCHEDULED,
    operationalOutcome: "standard",
    cfdiEmissionIntent: "emitir_cfdi",
    falseTripDeclaredAt: null,
    falseTripDeclaredBy: null,
    cargoDescription: null,
    baseRate: 18500,
    totalCost: 0,
    totalRevenue: 0,
    estimatedProfit: 0,
    cargoCount: 2,
    clientCount: 1,
    routeType: "long_haul",
    invoicing: tripInvoicingFixture({ canGenerateInvoice: true }),
    requiresFiscalAttention: false,
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    ...overrides,
  };
}

const primaryTo = (trip: TripListItem) => `/trips/${trip.id}`;

describe("TripTable", () => {
  beforeEach(() => {
    mockHasPermission.mockReset();
    mockHasPermission.mockImplementation((module: string, action: string) => {
      if (module === "finance" && action === "read") return true;
      return true;
    });
  });

  it("retorna null cuando no hay filas (empty del shell)", () => {
    const { container } = renderWithProviders(
      <TripTable
        trips={[]}
        isLoading={false}
        primaryTo={primaryTo}
        onView={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("Admin con finance.read: 7 columnas de datos + acciones e Ingreso con baseRate", () => {
    renderWithProviders(
      <TripTable
        trips={[listTrip({ baseRate: 18500 })]}
        isLoading={false}
        primaryTo={primaryTo}
        onView={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("columnheader", { name: tripsListCopy.columns.code }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: tripsListCopy.columns.route }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: tripsListCopy.columns.fleet }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", {
        name: tripsListCopy.columns.departure,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: tripsListCopy.columns.status }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: tripsListCopy.columns.invoice }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: tripsListCopy.columns.income }),
    ).toBeInTheDocument();

    // Sin columna Cliente propia
    expect(
      screen.queryByRole("columnheader", { name: tripsListCopy.columns.client }),
    ).not.toBeInTheDocument();

    expect(screen.getByText("Transportes del Norte SA")).toBeInTheDocument();
    expect(screen.getByText(/\$18,?500\.00/)).toBeInTheDocument();
  });

  it("Despachador sin finance.read: 6 columnas y monto ausente del DOM", () => {
    mockHasPermission.mockImplementation((module: string, action: string) => {
      if (module === "finance" && action === "read") return false;
      return true;
    });

    const { container } = renderWithProviders(
      <TripTable
        trips={[listTrip({ baseRate: 18500 })]}
        isLoading={false}
        primaryTo={primaryTo}
        onView={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("columnheader", { name: tripsListCopy.columns.income }),
    ).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/\$/);
    expect(container.textContent).not.toContain("18,500");
    expect(container.textContent).not.toContain("18500");
  });

  it("link primario en Viaje y cliente bajo el código; flota apilada", () => {
    renderWithProviders(
      <TripTable
        trips={[listTrip()]}
        isLoading={false}
        primaryTo={primaryTo}
        onView={vi.fn()}
      />,
    );

    const link = screen.getByRole("link", { name: "T-100" });
    expect(link).toHaveAttribute("href", "/trips/t1");
    expect(screen.getByText("U-12")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
  });

  it("muestra Sin cliente y · +N cuando hay multi-cliente", () => {
    renderWithProviders(
      <TripTable
        trips={[
          listTrip({ client: null, clientCount: 0 }),
          listTrip({
            id: "t2",
            tripCode: "T-200",
            clientCount: 3,
            client: { id: "c1", legalName: "Abarrotes del Centro" },
          }),
        ]}
        isLoading={false}
        primaryTo={primaryTo}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText(tripsListCopy.columns.noClient)).toBeInTheDocument();
    expect(screen.getByText(/Abarrotes del Centro/)).toBeInTheDocument();
    expect(screen.getByText(/· \+2/)).toBeInTheDocument();
  });

  it("oculta cliente bajo el código cuando hideClientColumn (portal cliente)", () => {
    renderWithProviders(
      <TripTable
        trips={[listTrip()]}
        isLoading={false}
        primaryTo={primaryTo}
        onView={vi.fn()}
        hideClientColumn
      />,
    );

    expect(
      screen.queryByText("Transportes del Norte SA"),
    ).not.toBeInTheDocument();
  });

  it("Atención fiscal manda en Facturación", () => {
    renderWithProviders(
      <TripTable
        trips={[
          listTrip({
            requiresFiscalAttention: true,
            invoicing: tripInvoicingFixture({
              hasActiveInvoice: true,
              invoiceStatus: "stamped",
              invoiceFolio: "F-1198",
              invoiceId: "inv-1",
            }),
          }),
        ]}
        isLoading={false}
        primaryTo={primaryTo}
        onView={vi.fn()}
      />,
    );

    expect(
      screen.getByText(tripsListCopy.badge.fiscalAttention),
    ).toBeInTheDocument();
    expect(screen.queryByText("Fiscal")).not.toBeInTheDocument();
  });

  it("estado sin ícono; Reserva muestra Falta unidad", () => {
    renderWithProviders(
      <TripTable
        trips={[
          listTrip({
            status: TripStatus.DRAFT,
            vehicle: { id: "", unitNumber: "", licensePlate: "" },
            driver: { id: "", fullName: "" },
            cargoCount: 0,
          }),
        ]}
        isLoading={false}
        primaryTo={primaryTo}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("Reserva")).toBeInTheDocument();
    expect(
      screen.getByText(tripsListCopy.statusSecondary.missingVehicle),
    ).toBeInTheDocument();
  });

  it("Listo para facturar cuando canGenerateInvoice", () => {
    renderWithProviders(
      <TripTable
        trips={[
          listTrip({
            invoicing: tripInvoicingFixture({ canGenerateInvoice: true }),
          }),
        ]}
        isLoading={false}
        primaryTo={primaryTo}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("Listo para facturar")).toBeInTheDocument();
  });

  it("Pendiente como texto cuando aún no es facturable", () => {
    renderWithProviders(
      <TripTable
        trips={[
          listTrip({
            invoicing: tripInvoicingFixture({ canGenerateInvoice: false }),
          }),
        ]}
        isLoading={false}
        primaryTo={primaryTo}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText("Pendiente")).toBeInTheDocument();
  });

  it("muestra día civil México en Salida (sin año) para salida vespertina", () => {
    // 09/09/2026 20:00 America/Mexico_City = 2026-09-10T02:00:00.000Z
    renderWithProviders(
      <TripTable
        trips={[
          listTrip({
            scheduledDeparture: new Date("2026-09-10T02:00:00.000Z"),
          }),
        ]}
        isLoading={false}
        primaryTo={primaryTo}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText(/9 sep, 20:00/i)).toBeInTheDocument();
    expect(screen.queryByText(/10 sep/i)).not.toBeInTheDocument();
  });

  it("ruta opción B: ciudades visibles y meta Foráneo · N cargas", () => {
    renderWithProviders(
      <TripTable
        trips={[listTrip({ cargoCount: 2, routeType: "long_haul" })]}
        isLoading={false}
        primaryTo={primaryTo}
        onView={vi.fn()}
      />,
    );

    expect(screen.getByText(/Guadalajara → Monterrey/)).toBeInTheDocument();
    expect(screen.getByText(/Foráneo · 2 cargas/)).toBeInTheDocument();
  });
});
