import {
  TripStatus,
  type TripListItem,
  type TripQueryParams,
} from "@features/trips/domain";
import type { MappedPaginatedResult } from "@shared/api";

import {
  ACTIVE_ASSIGNMENT_TRIPS_MAX_PAGES,
  ACTIVE_ASSIGNMENT_TRIPS_PAGE_LIMIT,
  type ActiveAssignmentTripsPageFetcher,
  type FetchAllActiveAssignmentTripsResult,
} from "./fetchActiveAssignmentTrips";

/** Soft-hold channel only — never merge into ACTIVE_ASSIGNMENT_TRIP_STATUSES (PD5). */
export const DRAFT_HOLD_ASSIGNMENT_TRIP_STATUSES = [TripStatus.DRAFT] as const;

export type DraftHoldAssignmentTripsPageFetcher = ActiveAssignmentTripsPageFetcher;

export type FetchAllDraftHoldAssignmentTripsResult =
  FetchAllActiveAssignmentTripsResult;

/**
 * Paginates draft (Reserva) trips for soft-hold surfacing on fleet reassign.
 * Separate from hard busy (`scheduled` | `in_progress`).
 */
export async function fetchAllDraftHoldAssignmentTrips(
  fetchPage: DraftHoldAssignmentTripsPageFetcher,
  options?: {
    pageLimit?: number;
    maxPages?: number;
  },
): Promise<FetchAllDraftHoldAssignmentTripsResult> {
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

    const result: MappedPaginatedResult<TripListItem> = await fetchPage({
      page,
      limit: pageLimit,
      filters: {
        status: [...DRAFT_HOLD_ASSIGNMENT_TRIP_STATUSES],
      },
    } satisfies TripQueryParams);

    items.push(...result.data);
    totalPages = Math.max(1, result.pagination.totalPages);
    page += 1;
  }

  return { items, truncated };
}
