import { isApiError } from "@shared/api/interceptors/error-handler";
import { COMPENSATION_ERROR_CODES } from "../../domain/enums";
import { compensationCopy } from "../copy/compensationCopy";

const errorCopy = compensationCopy.templateActions.errors;

export function getCompensationErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) return error.code;
  return undefined;
}

/** `details.reason` del 409 `TEMPLATE_CONFIG_LOCKED` (llega sin convertir a camelCase). */
function getConfigLockedReason(error: unknown): string | undefined {
  if (!isApiError(error)) return undefined;
  const reason = error.details?.reason;
  return typeof reason === "string" ? reason : undefined;
}

export function isTemplateConfigLockedError(error: unknown): boolean {
  return getCompensationErrorCode(error) === COMPENSATION_ERROR_CODES.TEMPLATE_CONFIG_LOCKED;
}

export function getCompensationLifecycleErrorMessage(
  error: unknown,
): string | undefined {
  const code = getCompensationErrorCode(error);
  if (!code) return undefined;

  if (code === COMPENSATION_ERROR_CODES.TEMPLATE_CONFIG_LOCKED) {
    return getConfigLockedReason(error) === "superseded"
      ? errorCopy.TEMPLATE_CONFIG_LOCKED_SUPERSEDED
      : errorCopy.TEMPLATE_CONFIG_LOCKED;
  }
  if (code === COMPENSATION_ERROR_CODES.TEMPLATE_NOT_ACTIVATABLE) {
    return errorCopy.TEMPLATE_NOT_ACTIVATABLE;
  }
  if (code === COMPENSATION_ERROR_CODES.TEMPLATE_INVALID_STATUS_TRANSITION) {
    return errorCopy.TEMPLATE_INVALID_STATUS_TRANSITION;
  }
  return undefined;
}
