import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/test/createTestQueryClient";
import { grantPermissions } from "@/test/mocks/permissions";
import type { GpsAlertsList } from "../../domain";
import { AlertsListPage } from "./AlertsListPage";
import { monitoringCopy } from "../copy/monitoringCopy";

const mockGetAlerts = vi.fn();
const mockMarkRead = vi.fn();

vi.mock("@features/monitoring/infrastructure", () => ({
  monitoringApi: {
    getAlerts: (...args: unknown[]) => mockGetAlerts(...args),
    markAlertRead: (...args: unknown[]) => mockMarkRead(...args),
    getAlertsSummary: vi
      .fn()
      .mockResolvedValue({ unreadCount: 0, windowDays: 7 }),
  },
}));

vi.mock("@shared/permissions", async () =>
  (await import("@/test/mocks/permissions")).permissionsModuleMock(),
);

const sampleList: GpsAlertsList = {
  items: [
    {
      id: "a-1",
      alertType: "overspeed",
      vehicleId: "v-1",
      vehicleEconomicNumber: "T-001",
      vehiclePlate: "ABC-123",
      title: "Exceso de velocidad",
      description: "Velocidad: 112 km/h",
      occurredAt: "2026-10-19T15:00:00Z",
      latitude: 19.5,
      longitude: -99.2,
      address: null,
      addressStatus: "skipped",
      readAt: null,
      payload: {},
    },
    {
      id: "a-2",
      alertType: "low_battery",
      vehicleId: "v-2",
      vehicleEconomicNumber: "T-045",
      vehiclePlate: "XYZ-9",
      title: "Batería baja",
      description: "Batería: 15%",
      occurredAt: "2026-10-19T14:00:00Z",
      latitude: null,
      longitude: null,
      address: null,
      addressStatus: "skipped",
      readAt: "2026-10-19T14:30:00Z",
      payload: {},
    },
  ],
  pagination: { page: 1, pageSize: 50, total: 2, totalPages: 1 },
};

function renderPage() {
  grantPermissions(() => true, { role: "admin" });
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AlertsListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("AlertsListPage", () => {
  beforeEach(() => {
    mockGetAlerts.mockReset();
    mockMarkRead.mockReset();
    mockGetAlerts.mockResolvedValue(sampleList);
    mockMarkRead.mockResolvedValue({
      data: { id: "a-1", readAt: "2026-10-19T16:00:00Z" },
    });
  });

  it("lists alerts and marks read on activate (CA-43–45)", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByTestId("alert-list-item-a-1")).toBeInTheDocument();
    expect(screen.getByTestId("alert-list-item-a-2")).toBeInTheDocument();
    expect(screen.getByText(monitoringCopy.alerts.filters.last7d)).toBeInTheDocument();

    await user.click(screen.getByTestId("alert-list-item-a-1").querySelector("button")!);
    expect(mockMarkRead).toHaveBeenCalledWith("a-1");
  });

  it("unread-only switch re-queries with unreadOnly (CA-44)", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByTestId("alert-list-item-a-1");

    await user.click(screen.getByLabelText(monitoringCopy.alerts.filters.unreadOnly));

    await expect.poll(() => mockGetAlerts.mock.calls.length).toBeGreaterThan(1);
    const lastQuery = mockGetAlerts.mock.calls.at(-1)?.[0] as {
      unreadOnly?: boolean;
    };
    expect(lastQuery.unreadOnly).toBe(true);
  });
});
