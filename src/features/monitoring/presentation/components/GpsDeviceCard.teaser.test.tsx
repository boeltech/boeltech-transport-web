import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import { grantPermissions } from "@/test/mocks/permissions";
import { monitoringCopy } from "../copy/monitoringCopy";
import { GpsDeviceCard } from "./GpsDeviceCard";
import type { EntitlementState } from "@features/billing";

const mockGetDevice = vi.fn();
const mockUseEntitlement = vi.fn();

vi.mock("@features/monitoring/infrastructure", () => ({
  monitoringApi: {
    getGpsDevice: (...args: unknown[]) => mockGetDevice(...args),
  },
}));

vi.mock("@features/billing", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/billing")>();
  return {
    ...actual,
    useEntitlement: (...args: unknown[]) => mockUseEntitlement(...args),
  };
});

vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

vi.mock("@shared/config", () => ({
  config: {
    geolocation: { mapboxPublicToken: "" },
    api: { baseUrl: "http://localhost:3000/api/v1", timeout: 30000, headers: {} },
  },
}));

function entitlement(state: EntitlementState) {
  return {
    state,
    isSuccess: true,
    isLoading: false,
    isFetching: false,
    isError: false,
  };
}

function renderCard() {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <GpsDeviceCard vehicleId="v-1" unitNumber="T-001" />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("GpsDeviceCard — teaser F3 (X11)", () => {
  beforeEach(() => {
    mockGetDevice.mockReset();
    mockUseEntitlement.mockReset();
  });

  it("not_contracted + gps_tracking.read → teaser with CTA to fleet", () => {
    mockUseEntitlement.mockReturnValue(entitlement("not_contracted"));
    grantPermissions(
      (module, action) => module === "gps_tracking" && action === "read",
    );

    renderCard();

    expect(screen.getByTestId("gps-device-teaser")).toBeInTheDocument();
    expect(
      screen.getByText(monitoringCopy.device.teaserBody),
    ).toBeInTheDocument();
    const cta = screen.getByTestId("gps-device-teaser-cta");
    expect(cta).toHaveAttribute("href", "/monitoring/fleet");
    expect(cta).toHaveTextContent(monitoringCopy.device.teaserCta);
    expect(mockGetDevice).not.toHaveBeenCalled();
  });

  it("not_contracted without gps_tracking.read → teaser without link", () => {
    mockUseEntitlement.mockReturnValue(entitlement("not_contracted"));
    grantPermissions(() => false);

    renderCard();

    expect(screen.getByTestId("gps-device-teaser")).toBeInTheDocument();
    expect(
      screen.queryByTestId("gps-device-teaser-cta"),
    ).not.toBeInTheDocument();
    expect(mockGetDevice).not.toHaveBeenCalled();
  });

  it("unavailable → section hidden", () => {
    mockUseEntitlement.mockReturnValue(entitlement("unavailable"));
    grantPermissions(
      (module, action) => module === "gps_tracking" && action === "read",
    );

    const { container } = renderCard();
    expect(container).toBeEmptyDOMElement();
    expect(mockGetDevice).not.toHaveBeenCalled();
  });
});
