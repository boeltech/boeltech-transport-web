import { isApiError, isAxiosError } from "@shared/api/interceptors/error-handler";
import type {
  TripOrderReasonCode,
  TripOrderStatus,
} from "@features/trips/domain";
import { tripOrderCopy } from "../../copy/tripDetail/tripOrderCopy";

const cardCopy = tripOrderCopy.card;

/** Portal o sin permiso read: no montar ni consultar. */
export function shouldQueryTripOrder({
  canRead,
  isClientPortalView,
  isDriverPortalView,
}: {
  canRead: boolean;
  isClientPortalView: boolean;
  isDriverPortalView: boolean;
}): boolean {
  if (!canRead) return false;
  if (isClientPortalView || isDriverPortalView) return false;
  return true;
}

/** Kill-switch off → ocultar card (PRD/TEC). */
export function resolveTripOrderCardVisible(
  view: Pick<TripOrderStatus, "enabled"> | undefined,
): boolean {
  return Boolean(view?.enabled);
}

export function describeTripOrderDisabledReason(
  reasonCode: TripOrderReasonCode | null | undefined,
): string | null {
  switch (reasonCode) {
    case "TRIP_ORDER_STATUS_DRAFT":
      return cardCopy.disabled.draft;
    case "TRIP_ORDER_THRESHOLD_INCOMPLETE":
      return cardCopy.disabled.threshold;
    case "TRIP_ORDER_STATUS_CANCELLED":
      return cardCopy.disabled.cancelled;
    case "TRIP_ORDER_DISABLED":
      return cardCopy.disabled.disabled;
    default:
      return null;
  }
}

export function isForbiddenError(error: unknown): boolean {
  if (isAxiosError(error)) return error.response?.status === 403;
  return isApiError(error) && error.status === 403;
}
