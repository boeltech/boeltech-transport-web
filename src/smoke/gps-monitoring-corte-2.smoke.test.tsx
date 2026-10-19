/**
 * Smoke — GPS monitoreo corte 2 (F6): historial route + alerts/settings.
 * Mock de API; no requiere Traccar ni Mapbox token.
 */
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import type { UserRole } from "@shared/constants/roles";
import { checkPermission, getPermissionsForRole } from "@shared/permissions/domain";
import { FleetHistoryPage } from "@features/monitoring/presentation/pages/FleetHistoryPage";
import { AlertsListPage } from "@features/monitoring/presentation/pages/AlertsListPage";
import { AlertSettingsPage } from "@features/monitoring/presentation/pages/AlertSettingsPage";
import { monitoringCopy } from "@features/monitoring/presentation/copy/monitoringCopy";
import type {
  FleetHistory,
  GpsAlertSettings,
  GpsAlertsList,
} from "@features/monitoring/domain";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import { grantPermissions } from "@/test/mocks/permissions";

const historyCopy = monitoringCopy.history;
const alertsCopy = monitoringCopy.alerts;
const settingsCopy = monitoringCopy.alertSettings;

const {
  mockGetHistory,
  mockGetAlerts,
  mockGetSettings,
  mockGetSummary,
} = vi.hoisted(() => ({
  mockGetHistory: vi.fn(),
  mockGetAlerts: vi.fn(),
  mockGetSettings: vi.fn(),
  mockGetSummary: vi.fn(),
}));

vi.mock("@features/monitoring/infrastructure", () => ({
  monitoringApi: {
    getFleetHistory: mockGetHistory,
    getAlerts: mockGetAlerts,
    getAlertSettings: mockGetSettings,
    putAlertSettings: vi.fn(),
    getAlertsSummary: mockGetSummary,
    reverseGeocode: vi.fn().mockResolvedValue({
      latitude: 0,
      longitude: 0,
      address: null,
      addressStatus: "skipped",
      cacheHit: false,
    }),
  },
}));

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

const emptyHistory: FleetHistory = {
  vehicleId: "v-1",
  imei: "860012345678901",
  from: "2026-10-19T08:00:00Z",
  to: "2026-10-19T12:00:00Z",
  rawPointCount: 0,
  pointCount: 0,
  sampled: false,
  points: [],
  fetchedAt: "2026-10-19T12:00:00Z",
};

const emptyAlerts: GpsAlertsList = {
  items: [],
  pagination: { page: 1, pageSize: 50, total: 0, totalPages: 0 },
};

const sampleSettings: GpsAlertSettings = {
  geofenceCount: 0,
  settings: [
    {
      alertType: "overspeed",
      enabled: true,
      thresholdValue: 100,
      thresholdUnit: "kmh",
      configurable: true,
      status: "active",
    },
    {
      alertType: "geofence_exit",
      enabled: false,
      thresholdValue: null,
      thresholdUnit: null,
      configurable: true,
      status: "unconfigured",
      unconfiguredReason: "no_geofences",
    },
  ],
};

function renderAt(path: string, element: ReactNode, routePath: string) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={routePath} element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("gps-monitoring corte 2 smoke", () => {
  beforeEach(() => {
    mockGetHistory.mockReset();
    mockGetAlerts.mockReset();
    mockGetSettings.mockReset();
    mockGetSummary.mockReset();
    mockGetSummary.mockResolvedValue({ unreadCount: 0, windowDays: 7 });
    grantRole("admin");
  });

  it("history route shows empty state for period without points", async () => {
    mockGetHistory.mockResolvedValue(emptyHistory);
    renderAt(
      "/monitoring/fleet/history/v-1",
      <FleetHistoryPage />,
      "/monitoring/fleet/history/:vehicleId",
    );

    expect(await screen.findByText(historyCopy.emptyTitle)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: historyCopy.backToFleet }),
    ).toHaveAttribute("href", "/monitoring/fleet");
  });

  it("alerts list renders empty state for 7d window", async () => {
    mockGetAlerts.mockResolvedValue(emptyAlerts);
    renderAt("/monitoring/alerts", <AlertsListPage />, "/monitoring/alerts");

    expect(await screen.findByText(alertsCopy.title)).toBeInTheDocument();
    expect(await screen.findByText(alertsCopy.emptyTitle)).toBeInTheDocument();
  });

  it("settings page shows geofence unconfigured for admin", async () => {
    mockGetSettings.mockResolvedValue(sampleSettings);
    renderAt(
      "/monitoring/settings",
      <AlertSettingsPage />,
      "/monitoring/settings",
    );

    expect(await screen.findByText(settingsCopy.title)).toBeInTheDocument();
    expect(
      await screen.findByTestId("alert-settings-card-geofence_exit"),
    ).toBeInTheDocument();
    expect(screen.getByText(settingsCopy.unconfigured)).toBeInTheDocument();
  });
});
