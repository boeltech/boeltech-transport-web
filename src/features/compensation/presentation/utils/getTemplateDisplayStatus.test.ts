import { describe, expect, it } from "vitest";
import {
  getTemplateDisplayStatus,
  getTemplateDisplayStatusLabel,
  isTemplateLockedBySupersede,
  pickActiveTemplateVersion,
} from "./getTemplateDisplayStatus";
import { makeCompensationTemplate } from "./makeCompensationTemplate";

describe("getTemplateDisplayStatus", () => {
  it.each([
    ["draft", { status: "draft" as const }, "draft"],
    ["active", { status: "active" as const }, "active"],
    ["inactive + superseded", { status: "inactive" as const, inactiveReason: "superseded" as const }, "superseded"],
    ["inactive + manual", { status: "inactive" as const, inactiveReason: "manual" as const }, "deactivated"],
    ["inactive + null", { status: "inactive" as const, inactiveReason: null }, "deactivated"],
    ["inactive sin campo (API anterior)", { status: "inactive" as const }, "inactive_unknown"],
    ["active con motivo residual", { status: "active" as const, inactiveReason: "manual" as const }, "active"],
  ])("%s → %s", (_label, overrides, expected) => {
    const template = makeCompensationTemplate({ id: "tpl-1", name: "Tarifa", ...overrides });
    expect(getTemplateDisplayStatus(template)).toBe(expected);
  });

  it("sin status usa isActive como hoy", () => {
    expect(getTemplateDisplayStatus({ isActive: false })).toBe("inactive_unknown");
    expect(getTemplateDisplayStatus({ isActive: true })).toBe("active");
  });

  it.each([
    [{ status: "inactive" as const, inactiveReason: "superseded" as const }, "Reemplazada"],
    [{ status: "inactive" as const, inactiveReason: "manual" as const }, "Desactivada"],
    [{ status: "inactive" as const }, "Inactiva"],
    [{ status: "active" as const }, "Activa"],
  ])("etiqueta de %o → %s", (overrides, expected) => {
    expect(
      getTemplateDisplayStatusLabel(
        makeCompensationTemplate({ id: "tpl-1", name: "Tarifa", ...overrides }),
      ),
    ).toBe(expected);
  });
});

describe("isTemplateLockedBySupersede", () => {
  it.each([
    ["locked_reason superseded", { lockedForEdit: true, lockedReason: "superseded" as const }, true],
    ["inactive_reason superseded", { lockedForEdit: true, inactiveReason: "superseded" as const }, true],
    ["used_in_settlements", { lockedForEdit: true, lockedReason: "used_in_settlements" as const }, false],
    ["bloqueada sin motivo (API anterior)", { lockedForEdit: true }, false],
    ["superseded sin bloqueo", { lockedForEdit: false, lockedReason: "superseded" as const }, false],
  ])("%s → %s", (_label, overrides, expected) => {
    expect(
      isTemplateLockedBySupersede(
        makeCompensationTemplate({ id: "tpl-1", name: "Tarifa", status: "inactive", ...overrides }),
      ),
    ).toBe(expected);
  });
});

describe("pickActiveTemplateVersion", () => {
  const version = (id: string, n: number, status: "draft" | "active" | "inactive") =>
    makeCompensationTemplate({ id, name: "Tarifa", version: n, status });

  it("devuelve la activa aunque sea menor que otras versiones", () => {
    const picked = pickActiveTemplateVersion([
      version("v1", 1, "active"),
      version("v2", 2, "inactive"),
      version("v3", 3, "draft"),
    ]);
    expect(picked?.id).toBe("v1");
  });

  it("con varias activas elige la de número mayor", () => {
    const picked = pickActiveTemplateVersion([
      version("v1", 1, "active"),
      version("v4", 4, "active"),
      version("v2", 2, "inactive"),
    ]);
    expect(picked?.id).toBe("v4");
  });

  it("sin activa o sin datos devuelve null", () => {
    expect(pickActiveTemplateVersion([version("v1", 1, "inactive")])).toBeNull();
    expect(pickActiveTemplateVersion(undefined)).toBeNull();
  });
});
