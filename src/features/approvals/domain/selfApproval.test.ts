import { describe, expect, it } from "vitest";
import {
  getSelfActionForbiddenError,
  hasSelfActionForbiddenFailure,
  isOwnRecord,
  isSelfActionForbiddenCode,
  resolveSelfActionUi,
  showsSelfApprovedBadge,
  type SelfApprovedRecordKind,
} from "./selfApproval";

describe("isOwnRecord", () => {
  it("es propio si el usuario coincide con algún maker", () => {
    expect(isOwnRecord("u-1", ["u-2", "u-1"])).toBe(true);
  });

  it("no es propio sin usuario o con makers vacíos", () => {
    expect(isOwnRecord(null, ["u-1"])).toBe(false);
    expect(isOwnRecord(undefined, [null, undefined])).toBe(false);
    expect(isOwnRecord("u-1", [null, undefined, ""])).toBe(false);
    expect(isOwnRecord("u-1", [])).toBe(false);
  });
});

describe("resolveSelfActionUi (ADR-0098)", () => {
  it("normal cuando el registro no es propio, sin importar la política", () => {
    expect(resolveSelfActionUi({ isOwn: false, policy: undefined })).toBe("normal");
    expect(resolveSelfActionUi({ isOwn: false, policy: { allowed: false } })).toBe(
      "normal",
    );
    expect(resolveSelfActionUi({ isOwn: false, policy: { allowed: true } })).toBe(
      "normal",
    );
  });

  it("self_confirm cuando es propio y el API lo permite", () => {
    expect(resolveSelfActionUi({ isOwn: true, policy: { allowed: true } })).toBe(
      "self_confirm",
    );
  });

  it("blocked_own cuando es propio y el API no lo permite", () => {
    expect(resolveSelfActionUi({ isOwn: true, policy: { allowed: false } })).toBe(
      "blocked_own",
    );
  });

  it("falla cerrado: propio sin política cargada queda bloqueado", () => {
    expect(resolveSelfActionUi({ isOwn: true, policy: undefined })).toBe("blocked_own");
    expect(resolveSelfActionUi({ isOwn: true, policy: null })).toBe("blocked_own");
  });
});

describe("showsSelfApprovedBadge (P2-2)", () => {
  const cases: Array<[SelfApprovedRecordKind, string[], string[]]> = [
    ["approvable", ["approved"], ["pending", "documented", "rejected"]],
    [
      "advance",
      ["pending_disbursement", "disbursed", "partially_applied", "fully_applied"],
      ["draft", "pending_approval", "rejected", "cancelled"],
    ],
    [
      "settlement",
      ["approved", "disbursed"],
      ["draft", "pending_approval", "rejected", "cancelled"],
    ],
    ["tripExpense", ["approved"], ["pending", "documented", "rejected"]],
  ];

  it.each(cases)(
    "%s: badge en estados aprobados o posteriores",
    (kind, visible) => {
      for (const status of visible) {
        expect(
          showsSelfApprovedBadge({ kind, status, selfSegregatedApproval: true }),
        ).toBe(true);
      }
    },
  );

  it.each(cases)(
    "%s: sin badge en rechazos, cancelaciones o pendientes aunque haya marca",
    (kind, _visible, hidden) => {
      for (const status of hidden) {
        expect(
          showsSelfApprovedBadge({ kind, status, selfSegregatedApproval: true }),
        ).toBe(false);
      }
    },
  );

  it("sin marca del API no hay badge", () => {
    expect(
      showsSelfApprovedBadge({
        kind: "settlement",
        status: "approved",
        selfSegregatedApproval: false,
      }),
    ).toBe(false);
    expect(
      showsSelfApprovedBadge({
        kind: "tripExpense",
        status: "approved",
        selfSegregatedApproval: undefined,
      }),
    ).toBe(false);
    expect(
      showsSelfApprovedBadge({
        kind: "advance",
        status: undefined,
        selfSegregatedApproval: true,
      }),
    ).toBe(false);
  });
});

describe("getSelfActionForbiddenError", () => {
  it("reconoce los cuatro códigos de autoacción", () => {
    for (const code of [
      "SELF_APPROVAL_FORBIDDEN",
      "MAKER_EXECUTE_FORBIDDEN",
      "SUBMITTER_EXECUTE_FORBIDDEN",
      "SETTLEMENT_MAKER_UNKNOWN",
    ]) {
      expect(isSelfActionForbiddenCode(code)).toBe(true);
    }
    expect(isSelfActionForbiddenCode("FORBIDDEN")).toBe(false);
    expect(isSelfActionForbiddenCode(undefined)).toBe(false);
  });

  it("extrae mensaje del API y details.reason", () => {
    const error = Object.assign(new Error("Hay otro autorizador activo."), {
      code: "SELF_APPROVAL_FORBIDDEN",
      details: { reason: "counterpart_available" },
    });
    expect(getSelfActionForbiddenError(error)).toEqual({
      code: "SELF_APPROVAL_FORBIDDEN",
      message: "Hay otro autorizador activo.",
      reason: "counterpart_available",
    });
  });

  it("prefiere originalMessage (ExpenseError de viajes) sobre message", () => {
    const error = {
      code: "SELF_APPROVAL_FORBIDDEN",
      message: "Error al aprobar gasto",
      originalMessage: "Solo el admin único puede autorizar lo propio.",
    };
    expect(getSelfActionForbiddenError(error)?.message).toBe(
      "Solo el admin único puede autorizar lo propio.",
    );
  });

  it("mensaje vacío queda en null para usar el copy de respaldo", () => {
    expect(
      getSelfActionForbiddenError({ code: "MAKER_EXECUTE_FORBIDDEN", message: "  " })
        ?.message,
    ).toBeNull();
  });

  it("ignora otros errores", () => {
    expect(getSelfActionForbiddenError(new Error("boom"))).toBeNull();
    expect(getSelfActionForbiddenError({ code: "VALIDATION_ERROR" })).toBeNull();
    expect(getSelfActionForbiddenError(null)).toBeNull();
    expect(getSelfActionForbiddenError("SELF_APPROVAL_FORBIDDEN")).toBeNull();
  });
});

describe("hasSelfActionForbiddenFailure", () => {
  it("detecta fallos de bulk por autoacción", () => {
    expect(
      hasSelfActionForbiddenFailure([
        { error: { code: "NOT_FOUND" } },
        { error: { code: "SELF_APPROVAL_FORBIDDEN" } },
      ]),
    ).toBe(true);
  });

  it("false sin fallos de autoacción", () => {
    expect(hasSelfActionForbiddenFailure([{ error: { code: "NOT_FOUND" } }])).toBe(false);
    expect(hasSelfActionForbiddenFailure([])).toBe(false);
    expect(hasSelfActionForbiddenFailure(undefined)).toBe(false);
  });
});
