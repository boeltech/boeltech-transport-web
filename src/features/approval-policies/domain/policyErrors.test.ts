import { describe, expect, it } from "vitest";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { classifySavePolicyError, getPolicyOrphanGuardError } from "./policyErrors";

describe("classifySavePolicyError", () => {
  it("422 insatisfacible con violaciones por tramo/paso", () => {
    const error = new ApiError("Nadie puede aprobar", 422, "APPROVAL_POLICY_UNSATISFIABLE", {
      violations: [{ tier_index: 1, step_no: 2, reason: "double_sign_needs_two_people" }],
    });
    expect(classifySavePolicyError(error)).toMatchObject({
      kind: "unsatisfiable",
      violations: [{ tierIndex: 1, stepNo: 2, reason: "double_sign_needs_two_people" }],
    });
  });

  it("422 de forma con issues Zod (details array)", () => {
    const error = new ApiError("Datos inválidos", 422, "VALIDATION_ERROR", {
      issues: [{ path: ["rules", "tiers", 0, "steps", 0], message: "STEP_EMPTY" }],
    });
    const classified = classifySavePolicyError(error);
    expect(classified.kind).toBe("validation");
    expect(classified.issues).toEqual([{ path: ["rules", "tiers", 0, "steps", 0], message: "STEP_EMPTY" }]);
  });

  it("409 de versión con la versión vigente", () => {
    const error = new ApiError("Alguien más guardó", 409, "APPROVAL_POLICY_VERSION_CONFLICT", {
      current_version: 4,
    });
    expect(classifySavePolicyError(error)).toMatchObject({ kind: "conflict", currentVersion: 4 });
  });

  it("403 crudo de Axios (no normalizado) con edición desactivada", () => {
    const axiosLike = {
      isAxiosError: true,
      response: { status: 403, data: { error: "Edición desactivada", code: "APPROVAL_POLICIES_EDIT_DISABLED" } },
    };
    expect(classifySavePolicyError(axiosLike)).toMatchObject({
      kind: "edit_disabled",
      message: "Edición desactivada",
    });
  });
});

describe("getPolicyOrphanGuardError", () => {
  it("reconoce el 409 del guard con el detalle por concepto", () => {
    const error = new ApiError("Este cambio deja pasos…", 409, "APPROVAL_POLICY_ORPHAN_GUARD", {
      violations: [{ concept: "settlement", policy_version: 3, tier_index: 0, step_no: 1, reason: "no_eligible" }],
    });
    expect(getPolicyOrphanGuardError(error)).toEqual({
      message: "Este cambio deja pasos…",
      violations: [{ concept: "settlement", policyVersion: 3, tierIndex: 0, stepNo: 1, reason: "no_eligible" }],
    });
  });

  it("ignora otros errores", () => {
    expect(getPolicyOrphanGuardError(new ApiError("x", 409, "OTHER"))).toBeNull();
    expect(getPolicyOrphanGuardError(new Error("x"))).toBeNull();
  });
});
