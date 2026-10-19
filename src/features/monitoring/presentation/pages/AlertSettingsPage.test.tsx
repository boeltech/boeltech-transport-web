import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import type { GpsAlertSettings } from "../../domain";
import { AlertSettingsPage } from "./AlertSettingsPage";
import { monitoringCopy } from "../copy/monitoringCopy";

const mockGetSettings = vi.fn();

vi.mock("@features/monitoring/infrastructure", () => ({
  monitoringApi: {
    getAlertSettings: (...args: unknown[]) => mockGetSettings(...args),
    putAlertSettings: vi.fn(),
  },
}));

vi.mock("@shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@shared/hooks")>()),
  ...(await import("@/test/mocks/toast")).toastHooksMock(),
}));

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

function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AlertSettingsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AlertSettingsPage", () => {
  beforeEach(() => {
    mockGetSettings.mockReset();
    mockGetSettings.mockResolvedValue(sampleSettings);
  });

  it("shows cards and geofence unconfigured copy (CA-39, CA-48)", async () => {
    renderPage();

    expect(
      await screen.findByTestId("alert-settings-card-overspeed"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("alert-settings-card-geofence_exit"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(monitoringCopy.alertSettings.unconfigured),
    ).toBeInTheDocument();
    expect(
      screen.getByText(monitoringCopy.alertSettings.unconfiguredHint),
    ).toBeInTheDocument();
  });
});
