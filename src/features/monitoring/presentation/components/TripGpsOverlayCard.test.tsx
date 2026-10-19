import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import type { GpsDeviceInfo } from "../../domain";
import { TripGpsOverlayCard } from "./TripGpsOverlayCard";
import { monitoringCopy } from "../copy/monitoringCopy";

const mockUseGpsDevice = vi.fn();

vi.mock("../../application", () => ({
  useGpsDevice: (...args: unknown[]) => mockUseGpsDevice(...args),
}));

vi.mock("@shared/config", () => ({
  config: {
    geolocation: { mapboxPublicToken: "" },
  },
}));

function renderOverlay(vehicleId: string | null | undefined) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TripGpsOverlayCard vehicleId={vehicleId} vehicleLabel="T-001" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const linked: GpsDeviceInfo = {
  linked: true,
  imei: "860012345678901",
  traccarDeviceId: "1",
  linkedAt: "2026-10-19T10:00:00Z",
  linkedByName: "Admin",
  lastPosition: {
    latitude: 19.43,
    longitude: -99.13,
    altitudeM: null,
    speedKmh: 72,
    courseDeg: 45,
    recordedAt: "2026-10-19T12:00:00Z",
    stale: false,
    status: "online",
    movementStatus: "moving",
    satellites: 9,
    batteryPct: 80,
    phone: null,
    odometerKm: 1000,
    address: "Av. Insurgentes 123",
    addressStatus: "ok",
  },
};

describe("TripGpsOverlayCard", () => {
  beforeEach(() => {
    mockUseGpsDevice.mockReset();
  });

  it("does not render without vehicleId (CA-33)", () => {
    mockUseGpsDevice.mockReturnValue({
      isPending: false,
      isLoading: false,
      isError: false,
      data: undefined,
    });
    const { container } = renderOverlay(null);
    expect(container).toBeEmptyDOMElement();
  });

  it("does not render when device is unlinked (CA-33)", () => {
    mockUseGpsDevice.mockReturnValue({
      isPending: false,
      isLoading: false,
      isError: false,
      data: { linked: false },
    });
    const { container } = renderOverlay("v-1");
    expect(container).toBeEmptyDOMElement();
  });

  it("renders card when linked with position (CA-32)", () => {
    mockUseGpsDevice.mockReturnValue({
      isPending: false,
      isLoading: false,
      isError: false,
      data: linked,
    });
    renderOverlay("v-1");
    expect(screen.getByTestId("trip-gps-overlay-card")).toBeInTheDocument();
    expect(screen.getByText(monitoringCopy.overlay.title)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: monitoringCopy.overlay.viewOnMap }),
    ).toHaveAttribute("href", "/monitoring/fleet?vehicleId=v-1");
    expect(
      screen.getByRole("link", { name: monitoringCopy.overlay.viewHistory }),
    ).toHaveAttribute("href", "/monitoring/fleet/history/v-1");
  });
});
