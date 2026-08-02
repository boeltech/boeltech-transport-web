/**
 * Gate for one-shot wizard hydration from `useTrip`.
 * Same trip id must not reset the form when React Query returns a new object
 * identity after refetch (window focus / staleTime).
 */
export function shouldHydrateTripWizard(
  hydratedTripId: string | null,
  tripId: string,
): boolean {
  return hydratedTripId !== tripId;
}
