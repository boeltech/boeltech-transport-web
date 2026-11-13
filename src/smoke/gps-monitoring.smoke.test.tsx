/**
 * Smoke — GPS monitoreo (pedido 2026-10-18-gps-tracking-monitoreo-prd, F4).
 * Mock de API; no requiere Traccar ni Mapbox token.
 *
 * Cubre:
 * - Sidebar / ruta: página mapa con empty state + CTA a vehículos
 * - Panel filas + búsqueda (con datos)
 * - Card GPS en detalle: unlinked + CTA solo con execute
 * - Sheet IMEI: validación 15 dígitos
 * - Dispatcher sin CTA vincular
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import type { UserRole } from "@shared/constants/roles";
import { checkPermission, getPermissionsForRole } from "@shared/permissions/domain";
import type { FleetPositions, GpsDeviceInfo } from "@features/monitoring/domain";
import { FleetMapPage } from "@features/monitoring/presentation/pages/FleetMapPage";
import { GpsDeviceCard } from "@features/monitoring/presentation";
import { monitoringCopy } from "@features/monitoring/presentation/copy/monitoringCopy";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import { grantPermissions } from "@/test/mocks/permissions";

const fleetCopy = monitoringCopy.fleet;
const deviceCopy = monitoringCopy.device;
const linkCopy = monitoringCopy.linkSheet;

const { mockGetFleet, mockGetDevice, mockLink, mockUnlink } = vi.hoisted(() => ({
  mockGetFleet: vi.fn(),
  mockGetDevice: vi.fn(),
  mockLink: vi.fn(),
  mockUnlink: vi.fn(),
}));

vi.mock("@features/monitoring/infrastructure", () => ({
  monitoringApi: {
    getFleetPositions: mockGetFleet,
    getGpsDevice: mockGetDevice,
    linkGpsDevice: mockLink,
    unlinkGpsDevice: mockUnlink,
  },
}));

vi.mock("@features/billing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/billing")>();
  return {
    ...actual,
    useHasBillingModule: () => ({
      hasModule: true,
      isSuccess: true,
      isLoading: false,
      isFetching: false,
      isError: false,
      isPending: false,
      data: { effectiveModuleCodes: ["gps_tracking"] },
    }),
  };
});

vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

vi.mock("@shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/hooks")>()),
  ...(await import("@/test/mocks/toast")).toastHooksMock(),
}));

vi.mock("@shared/config", () => ({
  config: {
    geolocation: { mapboxPublicToken: "" },
    api: { baseUrl: "http://localhost:3000/api/v1", timeout: 30000, headers: {} },
  },
}));

function grantRole(role: UserRole) {
  const permissions = getPermissionsForRole(role);
  grantPermissions(
    (module, action) =>
      checkPermission(role, permissions, module, action).allowed,
    { role },
  );
}

const emptyFleet: FleetPositions = {
  positions: [],
  summary: { totalLinked: 0, online: 0, stale: 0, offline: 0 },
  fetchedAt: "2026-10-18T23:45:00Z",
};

const sampleFleet: FleetPositions = {
  positions: [
    {
      vehicleId: "v-1",
      vehicleEconomicNumber: "T-001",
      vehiclePlate: "ABC-123",
      vehicleBrand: "Kenworth",
      vehicleModel: "T680",
      imei: "860012345678901",
      latitude: 19.43,
      longitude: -99.13,
      altitudeM: null,
      speedKmh: 65,
      courseDeg: 45,
      recordedAt: "2026-10-18T23:40:00Z",
      source: "traccar",
      stale: false,
      status: "online",
    },
    {
      vehicleId: "v-2",
      vehicleEconomicNumber: "T-045",
      vehiclePlate: "XYZ-9",
      vehicleBrand: "Freightliner",
      vehicleModel: "Cascadia",
      imei: "860012345678902",
      latitude: 20.1,
      longitude: -98.5,
      altitudeM: null,
      speedKmh: 0,
      courseDeg: null,
      recordedAt: "2026-10-18T23:30:00Z",
      source: "traccar",
      stale: true,
      status: "stale",
    },
  ],
  summary: { totalLinked: 2, online: 1, stale: 1, offline: 0 },
  fetchedAt: "2026-10-18T23:45:00Z",
};

const unlinkedDevice: GpsDeviceInfo = { linked: false };

function renderFleetMap(entry = "/monitoring/fleet") {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/monitoring/fleet" element={<FleetMapPage />} />
          <Route path="/vehicles" element={<div data-testid="vehicles-list">Vehículos</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderGpsCard(role: UserRole = "manager") {
  grantRole(role);
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <GpsDeviceCard
          vehicleId="v-1"
          unitNumber="T-001"
          brand="Kenworth"
          model="T680"
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("gps-monitoring smoke", () => {
  beforeEach(() => {
    mockGetFleet.mockReset();
    mockGetDevice.mockReset();
    mockLink.mockReset();
    mockUnlink.mockReset();
    grantRole("manager");
  });

  it("empty fleet shows CTA to vehicles", async () => {
    mockGetFleet.mockResolvedValue(emptyFleet);
    renderFleetMap();

    expect(await screen.findByTestId("fleet-map-empty")).toBeInTheDocument();
    expect(screen.getByText(fleetCopy.emptyTitle)).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: fleetCopy.emptyCta });
    expect(cta).toHaveAttribute("href", "/vehicles");
  });

  it("panel lists units and filters by eco", async () => {
    mockGetFleet.mockResolvedValue(sampleFleet);
    const user = userEvent.setup();
    renderFleetMap();

    expect(await screen.findByTestId("fleet-panel-row-v-1")).toBeInTheDocument();
    expect(screen.getByTestId("fleet-panel-row-v-2")).toBeInTheDocument();

    await user.type(screen.getByTestId("fleet-panel-search"), "T-001");
    expect(screen.getByTestId("fleet-panel-row-v-1")).toBeInTheDocument();
    expect(screen.queryByTestId("fleet-panel-row-v-2")).not.toBeInTheDocument();
  });

  it("unlinked card shows link CTA for manager", async () => {
    mockGetDevice.mockResolvedValue(unlinkedDevice);
    renderGpsCard("manager");

    expect(
      await screen.findByText(deviceCopy.unlinkedTitle),
    ).toBeInTheDocument();
    expect(screen.getByTestId("gps-link-cta")).toBeInTheDocument();
  });

  it("dispatcher sees card without link CTA", async () => {
    mockGetDevice.mockResolvedValue(unlinkedDevice);
    renderGpsCard("dispatcher");

    expect(
      await screen.findByText(deviceCopy.unlinkedTitle),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("gps-link-cta")).not.toBeInTheDocument();
  });

  it("link sheet validates IMEI as 15 digits", async () => {
    mockGetDevice.mockResolvedValue(unlinkedDevice);
    const user = userEvent.setup();
    renderGpsCard("manager");

    await user.click(await screen.findByTestId("gps-link-cta"));
    expect(await screen.findByText(linkCopy.title)).toBeInTheDocument();

    const sheet = screen.getByRole("dialog");
    await user.type(within(sheet).getByLabelText(/IMEI/i), "abc");
    await user.click(
      within(sheet).getByRole("button", { name: linkCopy.submit }),
    );

    await waitFor(() => {
      expect(
        within(sheet).getByRole("alert"),
      ).toHaveTextContent(linkCopy.imeiInvalid);
    });
    expect(mockLink).not.toHaveBeenCalled();
  });
});
