import { isApiError } from "@shared/api/interceptors/error-handler";
import { COMPENSATION_ERROR_CODES } from "../../domain/enums";
import { compensationCopy } from "../copy/compensationCopy";

const errorCopy = compensationCopy.templateActions.errors;

export function getCompensationErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) return error.code;
  return undefined;
}

export function getCompensationLifecycleErrorMessage(
  error: unknown,
): string | undefined {
  const code = getCompensationErrorCode(error);
  if (!code) return undefined;

  if (code === COMPENSATION_ERROR_CODES.TEMPLATE_CONFIG_LOCKED) {
    return errorCopy.TEMPLATE_CONFIG_LOCKED;
  }
  if (code === COMPENSATION_ERROR_CODES.TEMPLATE_NOT_ACTIVATABLE) {
    return errorCopy.TEMPLATE_NOT_ACTIVATABLE;
  }
  if (code === COMPENSATION_ERROR_CODES.TEMPLATE_INVALID_STATUS_TRANSITION) {
    return errorCopy.TEMPLATE_INVALID_STATUS_TRANSITION;
  }
  return undefined;
}
