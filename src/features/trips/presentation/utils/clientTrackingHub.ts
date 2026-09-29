import { TripStatus, type TripStatusType } from "@features/trips/domain";

import { trackingCopy } from "../copy";

export function resolveClientTrackingHubNarrative(status: TripStatusType): {
  title: string;
  body: string;
} {
  if (status === TripStatus.IN_PROGRESS) {
    return {
      title: trackingCopy.hint.clientInProgressTitle,
      body: trackingCopy.hint.clientInProgressBody,
    };
  }
  if (status === TripStatus.COMPLETED) {
    return {
      title: trackingCopy.hint.clientCompletedTitle,
      body: trackingCopy.hint.clientCompletedBody,
    };
  }
  if (status === TripStatus.CANCELLED) {
    return {
      title: trackingCopy.hint.clientCancelledTitle,
      body: trackingCopy.hint.clientCancelledBody,
    };
  }
  if (status === TripStatus.DRAFT) {
    return {
      title: trackingCopy.hint.clientDraftTitle,
      body: trackingCopy.hint.clientDraftBody,
    };
  }
  return {
    title: trackingCopy.hint.clientScheduledTitle,
    body: trackingCopy.hint.clientScheduledBody,
  };
}
