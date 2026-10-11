import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { TripListItem } from "@features/trips/domain";
import { TripStatus } from "@features/trips";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import type { IGetTripsUseCase } from "@features/trips/application/useCases/trip/GetTripsUseCase";
import { fetchAllTripsForExport, useExportTrips } from "./useExportTrips";
import { reportsCopy } from "../copy/reportsCopy";

/** 2026-10-11 23:30 CDMX — en UTC ya es 12 de octubre. */
const LATE_EVENING_CDMX = "2026-10-12T05:30:00.000Z";

const mockExecute = vi.fn();
const mockDownloadCsv = vi.fn();
const mockToast = vi.fn();

vi.mock("@features/trips/application", () => ({
  createGetTripsUseCase: () => ({
    execute: (...args: unknown[]) => mockExecute(...args),
  }),
}));

vi.mock("@features/trips/infrastructure", () => ({
  tripRepository: {},
}));

vi.mock("@shared/utils/exportCsv", () => ({
  downloadCsv: (...args: unknown[]) => mockDownloadCsv(...args),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

const trip = (id: string): TripListItem =>
  ({
    id,
    tripCode: id,
    vehicle: { id: "v1", unitNumber: "U-10", licensePlate: "ABC" },
    driver: { id: "d1", fullName: "Conductor" },
    client: null,
    originCity: "A",
    originState: "NL",
    destinationCity: "B",
    destinationState: "CO",
    scheduledDeparture: new Date("2026-06-01T15:00:00.000Z"),
    scheduledArrival: null,
    status: TripStatus.SCHEDULED,
    cargoDescription: null,
    totalCost: 0,
    totalRevenue: 0,
    estimatedProfit: 0,
    cargoCount: 0,
    clientCount: 0,
    invoicing: tripInvoicingFixture(),
    requiresFiscalAttention: false,
    createdAt: new Date("2026-05-31T12:00:00.000Z"),
  }) as TripListItem;

describe("fetchAllTripsForExport", () => {
  it("paginates with limit 100 until all pages are fetched", async () => {
    const execute = vi
      .fn<IGetTripsUseCase["execute"]>()
      .mockResolvedValueOnce({
        success: true,
        data: {
          data: [trip("t1"), trip("t2")],
          pagination: { page: 1, limit: 100, total: 150, totalPages: 2 },
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          data: [trip("t3")],
          pagination: { page: 2, limit: 100, total: 150, totalPages: 2 },
        },
      });

    const getTripsUseCase = { execute } as IGetTripsUseCase;
    const result = await fetchAllTripsForExport(getTripsUseCase, {});

    expect(result).toHaveLength(3);
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls[0]?.[0]?.limit).toBe(100);
    expect(execute.mock.calls[1]?.[0]?.page).toBe(2);
  });
});

describe("useExportTrips", () => {
  beforeEach(() => {
    mockExecute.mockReset();
    mockDownloadCsv.mockReset();
    mockToast.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("names the CSV with the Mexico civil day at 23:30 CDMX", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(LATE_EVENING_CDMX));

    mockExecute.mockResolvedValue({
      success: true,
      data: {
        data: [trip("t1")],
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      },
    });

    const { result } = renderHook(() => useExportTrips());

    await act(async () => {
      await result.current.exportTrips({});
    });

    expect(mockDownloadCsv).toHaveBeenCalledTimes(1);
    expect(mockDownloadCsv.mock.calls[0]?.[0]).toBe(
      `${reportsCopy.trips.filePrefix}-2026-10-11.csv`,
    );
  });
});
