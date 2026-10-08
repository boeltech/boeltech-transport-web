import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { compensationCopy } from "../copy/compensationCopy";
import {
  getCompensationLifecycleErrorMessage,
  isTemplateConfigLockedError,
} from "./compensationLifecycleErrors";

const errors = compensationCopy.templateActions.errors;

function lockedError(details?: Record<string, unknown>) {
  return new ApiError("Configuración bloqueada", 409, "TEMPLATE_CONFIG_LOCKED", details);
}

describe("getCompensationLifecycleErrorMessage — 409 TEMPLATE_CONFIG_LOCKED", () => {
  it("details.reason superseded: dice que los cambios no se guardaron", () => {
    expect(getCompensationLifecycleErrorMessage(lockedError({ reason: "superseded" }))).toBe(
      "Esta versión ya fue reemplazada y tus cambios no se guardaron. Crea una nueva versión y vuelve a capturarlos.",
    );
  });

  it.each([
    ["used_in_settlements", { reason: "used_in_settlements" }],
    ["sin details", undefined],
    ["motivo desconocido", { reason: "otro" }],
  ])("%s: mensaje actual", (_label, details) => {
    expect(getCompensationLifecycleErrorMessage(lockedError(details))).toBe(
      errors.TEMPLATE_CONFIG_LOCKED,
    );
  });

  it("isTemplateConfigLockedError solo con ese código", () => {
    expect(isTemplateConfigLockedError(lockedError())).toBe(true);
    expect(
      isTemplateConfigLockedError(new ApiError("x", 409, "TEMPLATE_NOT_ACTIVATABLE")),
    ).toBe(false);
    expect(isTemplateConfigLockedError(new Error("x"))).toBe(false);
  });
});
