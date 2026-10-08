import { describe, expect, it } from "vitest";
import type { SettlementTemplateSuperseded } from "../../domain/entities";
import {
  resolveTemplateSupersededAlert,
  resolveTemplateSupersededText,
} from "./templateSupersededNotice";

const base: SettlementTemplateSuperseded = {
  templateId: "tpl-v1",
  templateName: "Operador estándar",
  templateVersion: 1,
  assignmentId: "asg-1",
  supersededAt: "2026-10-03T16:00:00Z",
  replacedBy: { templateId: "tpl-v2", templateName: "Operador estándar", templateVersion: 2 },
};

describe("resolveTemplateSupersededText", () => {
  it("mismo nombre: «por la versión M»", () => {
    expect(resolveTemplateSupersededText(base)).toBe(
      "Se calcula con Operador estándar versión 1, que ya fue reemplazada por la versión 2. Si el operador debe cobrar con la versión 2, reasígnalo indicando desde qué fecha.",
    );
  });

  it("versión activa menor que la reemplazada: no supone que M sea nueva", () => {
    const text = resolveTemplateSupersededText({
      ...base,
      templateId: "tpl-v2",
      templateVersion: 2,
      replacedBy: { templateId: "tpl-v1", templateName: "Operador estándar", templateVersion: 1 },
    });
    expect(text).toBe(
      "Se calcula con Operador estándar versión 2, que ya fue reemplazada por la versión 1. Si el operador debe cobrar con la versión 1, reasígnalo indicando desde qué fecha.",
    );
    expect(text).not.toMatch(/nueva/i);
  });

  it("otro nombre: nombra la versión que la reemplazó", () => {
    expect(
      resolveTemplateSupersededText({
        ...base,
        replacedBy: { templateId: "tpl-v2", templateName: "Operador norte", templateVersion: 2 },
      }),
    ).toBe(
      "Se calcula con Operador estándar versión 1, que ya fue reemplazada por Operador norte versión 2. Si el operador debe cobrar con Operador norte versión 2, reasígnalo indicando desde qué fecha.",
    );
  });

  it("sin versión activa (replacedBy null): variante sin M", () => {
    expect(resolveTemplateSupersededText({ ...base, replacedBy: null })).toBe(
      "Se calcula con Operador estándar versión 1, que ya fue reemplazada. Si el operador debe cobrar con otra versión, reasígnalo indicando desde qué fecha.",
    );
  });
});

describe("resolveTemplateSupersededAlert", () => {
  it("título fijo y el mismo cuerpo que el tooltip", () => {
    expect(resolveTemplateSupersededAlert(base)).toEqual({
      title: "Versión de tarifa reemplazada",
      body: resolveTemplateSupersededText(base),
    });
  });
});
