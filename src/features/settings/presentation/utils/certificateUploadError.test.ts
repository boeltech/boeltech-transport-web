import { describe, expect, it } from "vitest";

import { ApiError } from "@shared/api/interceptors/error-handler";

import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import {
  CERTIFICATE_NOT_CSD_CODE,
  describeCertificateUploadError,
} from "./certificateUploadError";

const FALLBACK = billingSettingsCopy.toast.certificateNotCsd;

describe("describeCertificateUploadError", () => {
  it("usa el message del API cuando code es CERTIFICATE_NOT_CSD", () => {
    const apiMessage =
      "Este archivo no es el CSD para facturar. La e.firma / FIEL no sirve para timbrar. Descarga el Certificado de Sello Digital (CSD) y su llave desde Certifica (SAT) e inténtalo de nuevo.";
    const error = new ApiError(apiMessage, 422, CERTIFICATE_NOT_CSD_CODE);

    expect(describeCertificateUploadError(error)).toBe(apiMessage);
  });

  it("usa fallback PRD §E-(a) si CERTIFICATE_NOT_CSD llega sin message útil", () => {
    const error = new ApiError("   ", 422, CERTIFICATE_NOT_CSD_CODE);

    expect(describeCertificateUploadError(error)).toBe(FALLBACK);
  });

  it("deja otros errores de upload con su message", () => {
    const error = new ApiError("Par .cer/.key inválida", 422, "INVALID_CSD_PAIR");

    expect(describeCertificateUploadError(error)).toBe("Par .cer/.key inválida");
  });
});
