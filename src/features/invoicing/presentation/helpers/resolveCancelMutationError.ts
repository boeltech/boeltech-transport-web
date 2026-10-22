import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import { invoicingCopy } from "../copy/invoicingCopy";

const copy = invoicingCopy.detail.cancelDialog;

const IN_PROGRESS_CODES = new Set([
  "CANCELLATION_IN_PROGRESS",
  "CANCELLATION_ALREADY_PENDING",
]);

const TRANSPORT_CODES = new Set([
  "NETWORK_ERROR",
  "TIMEOUT",
  "PAC_CANCEL_TRANSPORT_ERROR",
  "PAC_CANCEL_TRANSPORT",
]);

export type CancelMutationErrorFeedback = {
  title: string;
  body: string;
};

/**
 * Maps cancel / resume-cancel API failures to product next-step copy.
 * Avoids PAC/SOAP/lease jargon in the dialog Alert.
 */
export function resolveCancelMutationError(
  error: unknown,
): CancelMutationErrorFeedback {
  if (isApiError(error)) {
    if (error.code != null && IN_PROGRESS_CODES.has(error.code)) {
      return {
        title: copy.errorInProgressTitle,
        body: copy.errorInProgressBody,
      };
    }
    if (
      error.isNetworkError ||
      error.isTimeout ||
      error.status === 0 ||
      (error.code != null && TRANSPORT_CODES.has(error.code))
    ) {
      return {
        title: copy.errorTransportTitle,
        body: copy.errorTransportBody,
      };
    }
  }

  const raw = getErrorMessage(error);
  if (/PAC_|Finkok|SOAP|\b708\b|lease/i.test(raw)) {
    return {
      title: copy.errorTransportTitle,
      body: copy.errorTransportBody,
    };
  }

  return {
    title: invoicingCopy.detail.cancelErrorTitle,
    body: raw,
  };
}
