import { tripsListCopy } from "../copy/listCopy";

export function resolveTripsListPageDescription(input: {
  isClientPortal: boolean;
  isDriverPortal: boolean;
  isDispatcher: boolean;
  isAccountant: boolean;
  isManager: boolean;
  isOperator: boolean;
}): string {
  const copy = tripsListCopy.page;
  if (input.isClientPortal) return copy.descriptionClient;
  if (input.isDriverPortal) return copy.descriptionDriver;
  if (input.isDispatcher) return copy.descriptionDispatcher;
  if (input.isAccountant) return copy.descriptionAccountant;
  if (input.isManager) return copy.descriptionManager;
  if (input.isOperator) return copy.descriptionOperator;
  return copy.description;
}

/** Patio job empty (4 pasos). Oculto a manager y operator. */
export function shouldShowTripsJobEmpty(input: {
  isLeanTripPortal: boolean;
  hasFilters: boolean;
  hasActiveBucket: boolean;
  fiscalAttentionOnly: boolean;
  hasOverdueFilter: boolean;
  isManager: boolean;
  isOperator: boolean;
}): boolean {
  return (
    !input.isLeanTripPortal &&
    !input.hasFilters &&
    !input.hasActiveBucket &&
    !input.fiscalAttentionOnly &&
    !input.hasOverdueFilter &&
    !input.isManager &&
    !input.isOperator
  );
}

export function resolveTripsListEmptyDescription(input: {
  hasOverdueFilter: boolean;
  hasFilters: boolean;
  isClientPortal: boolean;
  isDriverPortal: boolean;
  isManager: boolean;
  isOperator: boolean;
  fiscalAttentionOnly: boolean;
  showJobEmpty: boolean;
}): string | null | undefined {
  const copy = tripsListCopy.empty;
  if (input.hasOverdueFilter) return copy.overdueDescription;
  if (input.hasFilters) return copy.filteredDescription;
  if (input.isClientPortal) return copy.noDataDescriptionClient;
  if (input.isDriverPortal) return copy.noDataDescriptionDriver;
  if (input.isManager && input.fiscalAttentionOnly) {
    return copy.fiscalAttentionManagerDescription;
  }
  if (input.isOperator) return copy.noDataDescriptionOperator;
  if (input.showJobEmpty) return null;
  return undefined;
}
