import {
  TripStatus,
  type TripListItem,
  type TripQueryParams,
} from "@features/trips/domain";
import type { MappedPaginatedResult } from "@shared/api";

/** Page size for busy-assignment trip aggregation (matches list defaults). */
export const ACTIVE_ASSIGNMENT_TRIPS_PAGE_LIMIT = 100;

/**
 * Safety cap: 20 × 100 = 2000 active trips. Beyond this, busy detection may
 * still truncate until a dedicated API exists.
 */
export const ACTIVE_ASSIGNMENT_TRIPS_MAX_PAGES = 20;

export const ACTIVE_ASSIGNMENT_TRIP_STATUSES = [
  TripStatus.IN_PROGRESS,
  TripStatus.SCHEDULED,
] as const;

export type ActiveAssignmentTripsPageFetcher = (
  params: TripQueryParams,
) => Promise<MappedPaginatedResult<TripListItem>>;

export type FetchAllActiveAssignmentTripsResult = {
  items: TripListItem[];
  /** True when the safety page cap stopped pagination early. */
  truncated: boolean;
};

/**
 * Paginates all scheduled/in_progress trips for fleet busy detection.
 */
export async function fetchAllActiveAssignmentTrips(
  fetchPage: ActiveAssignmentTripsPageFetcher,
  options?: {
    pageLimit?: number;
    maxPages?: number;
  },
): Promise<FetchAllActiveAssignmentTripsResult> {
  const pageLimit = options?.pageLimit ?? ACTIVE_ASSIGNMENT_TRIPS_PAGE_LIMIT;
  const maxPages = options?.maxPages ?? ACTIVE_ASSIGNMENT_TRIPS_MAX_PAGES;

  const items: TripListItem[] = [];
  let page = 1;
  let totalPages = 1;
  let truncated = false;

  while (page <= totalPages) {
    if (page > maxPages) {
      truncated = true;
      break;
    }

    const result = await fetchPage({
      page,
      limit: pageLimit,
      filters: {
        status: [...ACTIVE_ASSIGNMENT_TRIP_STATUSES],
      },
    });

    items.push(...result.data);
    totalPages = Math.max(1, result.pagination.totalPages);
    page += 1;
  }

  return { items, truncated };
}
