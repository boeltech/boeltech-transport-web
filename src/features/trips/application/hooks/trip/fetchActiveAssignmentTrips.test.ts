import { describe, expect, it, vi } from "vitest";

import type { TripListItem } from "@features/trips/domain";
import type { MappedPaginatedResult } from "@shared/api";

import {
  ACTIVE_ASSIGNMENT_TRIPS_MAX_PAGES,
  ACTIVE_ASSIGNMENT_TRIPS_PAGE_LIMIT,
  fetchAllActiveAssignmentTrips,
} from "./fetchActiveAssignmentTrips";

function pageResult(
  data: TripListItem[],
  page: number,
  totalPages: number,
): MappedPaginatedResult<TripListItem> {
  return {
    data,
    pagination: {
      page,
      limit: ACTIVE_ASSIGNMENT_TRIPS_PAGE_LIMIT,
      total: totalPages * ACTIVE_ASSIGNMENT_TRIPS_PAGE_LIMIT,
      totalPages,
    },
  };
}

function tripStub(id: string): TripListItem {
  return { id, tripCode: id } as TripListItem;
}

describe("fetchAllActiveAssignmentTrips", () => {
  it("aggregates all pages of active trips", async () => {
    const fetchPage = vi.fn(async (params: { page?: number }) => {
      const page = params.page ?? 1;
      if (page === 1) {
        return pageResult([tripStub("t1"), tripStub("t2")], 1, 2);
      }
      return pageResult([tripStub("t3")], 2, 2);
    });

    const result = await fetchAllActiveAssignmentTrips(fetchPage);

    expect(result.truncated).toBe(false);
    expect(result.items.map((t) => t.id)).toEqual(["t1", "t2", "t3"]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        page: 1,
        limit: ACTIVE_ASSIGNMENT_TRIPS_PAGE_LIMIT,
        filters: {
          status: ["in_progress", "scheduled"],
        },
      }),
    );
  });

  it("stops at maxPages and marks truncated", async () => {
    const fetchPage = vi.fn(async (params: { page?: number }) => {
      const page = params.page ?? 1;
      return pageResult([tripStub(`t-${page}`)], page, ACTIVE_ASSIGNMENT_TRIPS_MAX_PAGES + 5);
    });

    const result = await fetchAllActiveAssignmentTrips(fetchPage, {
      maxPages: 2,
    });

    expect(result.truncated).toBe(true);
    expect(result.items).toHaveLength(2);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });

  it("handles a single page", async () => {
    const fetchPage = vi.fn(async () =>
      pageResult([tripStub("only")], 1, 1),
    );

    const result = await fetchAllActiveAssignmentTrips(fetchPage);

    expect(result.truncated).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });
});
