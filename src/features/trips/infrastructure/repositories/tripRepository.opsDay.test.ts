import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();

vi.mock("@shared/api", () => ({
  apiClient: {
    get: (...args: unknown[]) => getMock(...args),
  },
}));

vi.mock("@features/trips/presentation/pages/create/validateTripApiPayload", () => ({
  validateTripQueryApiPayload: () => ({ ok: true }),
  formatTripApiValidationForUser: () => "invalid",
}));

vi.mock("../api/mappers", () => ({
  mapApiTripListItem: (row: unknown) => row,
}));

describe("TripRepository opsDay", () => {
  beforeEach(() => {
    getMock.mockReset();
    getMock.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, total_pages: 0 },
    });
  });

  it("envía ops_day y omite status/date_from/date_to", async () => {
    const { tripRepository } = await import("./tripRepository");

    await tripRepository.findAll({
      page: 1,
      limit: 10,
      filters: {
        opsDay: "2026-10-17",
        status: "in_progress",
        dateFrom: "2026-10-01",
        dateTo: "2026-10-31",
      },
      sort: { field: "scheduled_departure", direction: "desc" },
    });

    expect(getMock).toHaveBeenCalledWith(
      "/trips",
      expect.objectContaining({
        params: expect.objectContaining({
          ops_day: "2026-10-17",
          page: 1,
          limit: 10,
        }),
      }),
    );
    const params = getMock.mock.calls[0]?.[1]?.params as Record<
      string,
      unknown
    >;
    expect(params).not.toHaveProperty("status");
    expect(params).not.toHaveProperty("date_from");
    expect(params).not.toHaveProperty("date_to");
  });
});
