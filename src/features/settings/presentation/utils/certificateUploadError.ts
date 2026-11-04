/**
 * Copy de error al subir sello (gate CSD vs FIEL — F5).
 */

import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";

import { billingSettingsCopy } from "../copy/billingSettingsCopy";

export const CERTIFICATE_NOT_CSD_CODE = "CERTIFICATE_NOT_CSD";

const toastCopy = billingSettingsCopy.toast;

/**
 * Mensaje para toast/inline tras fallo de upload.
 * `CERTIFICATE_NOT_CSD` → message del API o fallback PRD §E-(a).
 */
export function describeCertificateUploadError(error: unknown): string {
  if (isApiError(error) && error.code === CERTIFICATE_NOT_CSD_CODE) {
    const fromApi = error.message?.trim();
    if (fromApi) return fromApi;
    return toastCopy.certificateNotCsd;
  }

  const message = getErrorMessage(error).trim();
  if (message) return message;
  return toastCopy.certificateErrorDescription;
}
