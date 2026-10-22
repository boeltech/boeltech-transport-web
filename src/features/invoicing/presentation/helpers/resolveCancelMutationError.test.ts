import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { invoicingCopy } from "../copy/invoicingCopy";
import { resolveCancelMutationError } from "./resolveCancelMutationError";

const copy = invoicingCopy.detail.cancelDialog;

describe("resolveCancelMutationError", () => {
  it("maps CANCELLATION_IN_PROGRESS to in-progress next-step", () => {
    const mapped = resolveCancelMutationError(
      new ApiError("en curso", 409, "CANCELLATION_IN_PROGRESS"),
    );
    expect(mapped.title).toBe(copy.errorInProgressTitle);
    expect(mapped.body).toBe(copy.errorInProgressBody);
    expect(mapped.body).not.toMatch(/PAC_|Finkok|SOAP|lease/i);
  });

  it("maps CANCELLATION_ALREADY_PENDING to in-progress next-step", () => {
    const mapped = resolveCancelMutationError(
      new ApiError("ya pendiente", 409, "CANCELLATION_ALREADY_PENDING"),
    );
    expect(mapped.title).toBe(copy.errorInProgressTitle);
    expect(mapped.body).toBe(copy.errorInProgressBody);
  });

  it("does not treat unrelated 409 as in-progress claim", () => {
    const mapped = resolveCancelMutationError(
      new ApiError("Solo se pueden cancelar facturas timbradas", 409),
    );
    expect(mapped.title).toBe(invoicingCopy.detail.cancelErrorTitle);
    expect(mapped.body).toBe("Solo se pueden cancelar facturas timbradas");
  });

  it("maps network / timeout to solicitud no confirmada", () => {
    const mapped = resolveCancelMutationError(
      new ApiError("Error de conexión.", 0, "NETWORK_ERROR"),
    );
    expect(mapped.title).toBe(copy.errorTransportTitle);
    expect(mapped.body).toBe(copy.errorTransportBody);
  });

  it("maps PAC_CANCEL_TRANSPORT_ERROR to solicitud no confirmada", () => {
    const mapped = resolveCancelMutationError(
      new ApiError("No se pudo conectar con el PAC para cancelar.", 502, "PAC_CANCEL_TRANSPORT_ERROR"),
    );
    expect(mapped.title).toBe(copy.errorTransportTitle);
    expect(mapped.body).toBe(copy.errorTransportBody);
  });

  it("rewrites PAC jargon to transport next-step", () => {
    const mapped = resolveCancelMutationError(
      new ApiError("PAC_708 Finkok SOAP fault", 502, "PAC_CANCEL_FAILED"),
    );
    expect(mapped.title).toBe(copy.errorTransportTitle);
    expect(mapped.body).toBe(copy.errorTransportBody);
  });
});
