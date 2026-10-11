import { describe, expect, it } from "vitest";
import type {
  SettlementTemplateChange,
  TemplatePeriodAssignmentRef,
} from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  resolveTemplateChangeAlert,
  resolveTemplateChangeTooltip,
  resolveTemplateChangeVariant,
  visibleTemplateNames,
  type TemplateChangeVariant,
} from "./templateChangeNotice";

function ref(
  templateId: string,
  templateName: string,
  effectiveFrom: string,
  effectiveTo: string | null,
  overrides: Partial<TemplatePeriodAssignmentRef> = {},
): TemplatePeriodAssignmentRef {
  return {
    assignmentId: `asg-${templateId}`,
    templateId,
    templateName,
    templateVersion: 1,
    effectiveFrom,
    effectiveTo,
    isClosing: false,
    ...overrides,
  };
}

function change(
  assignments: TemplatePeriodAssignmentRef[],
  from: TemplatePeriodAssignmentRef,
  templatesCount = new Set(assignments.map((a) => a.templateId)).size,
): SettlementTemplateChange {
  const to = { ...assignments[assignments.length - 1]!, isClosing: true };
  return { templatesCount, from, to, assignments: [...assignments.slice(0, -1), to] };
}

const norte = ref("tpl-norte", "Norte", "2026-07-01", "2026-08-14");
const sur = ref("tpl-sur", "Sur", "2026-08-15", null);
/** Cambio simple: anterior cierra el día previo al inicio del cierre. */
const simpleChange = change([norte, sur], norte);

/** Frontera 1: se tocan el mismo día → «a la vez». */
const norteSameDay = ref("tpl-norte", "Norte", "2026-07-01", "2026-08-15");
const sameDayTouch = change([norteSameDay, sur], norteSameDay);

const norteOpen = ref("tpl-norte", "Norte", "2026-07-01", null);
/** `from` abierto → «a la vez». */
const fromOpen = change([norteOpen, sur], norteOpen);

const norteShort = ref("tpl-norte", "Norte", "2026-07-01", "2026-08-09");
const centro = ref("tpl-centro", "Centro", "2026-08-10", "2026-08-19");
const surLate = ref("tpl-sur", "Sur", "2026-08-20", null);
/** ≥3 esquemas (from cerrado) → «varios». */
const severalClosed = change([norteShort, centro, surLate], centro);

/** Frontera 2: ≥3 con `from` abierto → sigue «varios» (prioridad sobre concurrent). */
const centroOpen = ref("tpl-centro", "Centro", "2026-08-10", null);
const severalFromOpen = change([norteShort, centroOpen, surLate], centroOpen);

const copy = settlementsCopy.workbench.templateChange;
const PERIOD_END = "2026-08-31";

describe("resolveTemplateChangeVariant", () => {
  it.each([
    ["cambio simple (día previo)", simpleChange, "two"],
    ["mismo día (effectiveTo === effectiveFrom)", sameDayTouch, "concurrent"],
    ["≥3 esquemas", severalClosed, "several"],
    ["from abierto", fromOpen, "concurrent"],
    ["≥3 esquemas con from abierto", severalFromOpen, "several"],
  ] as const)("%s → %s", (_label, tc, expected: TemplateChangeVariant) => {
    expect(resolveTemplateChangeVariant(tc)).toBe(expected);
  });

  it("sin template_change: null — los callers no invocan resolve*", () => {
    const templateChange: SettlementTemplateChange | null = null;
    // Misma guarda que SettlementCreatePage / SettlementBacklogTable.
    const alert =
      templateChange != null
        ? resolveTemplateChangeAlert(templateChange, false, PERIOD_END)
        : null;
    const tooltip =
      templateChange != null
        ? resolveTemplateChangeTooltip(templateChange, false)
        : null;
    expect(alert).toBeNull();
    expect(tooltip).toBeNull();
  });
});

describe("resolveTemplateChangeAlert", () => {
  it.each([
    [
      "cambio simple · sin viajes",
      simpleChange,
      false,
      copy.alertTitle.two,
      "Se aplica Sur a todo el período porque es el vigente el 31 ago 2026. Las prestaciones y deducciones de Norte no se consideran. Si corresponde, corrígelo con un ajuste manual (pedirá autorización).",
    ],
    [
      "cambio simple · con viajes",
      simpleChange,
      true,
      copy.alertTitle.two,
      "Se aplica Sur a todo el período porque es el vigente el 31 ago 2026, también a los viajes con salida antes del 15 ago 2026. Las reglas de pago, corredores, prestaciones y deducciones de Norte no se consideran. Si corresponde, corrígelo con un ajuste manual (pedirá autorización).",
    ],
    [
      "mismo día · sin viajes",
      sameDayTouch,
      false,
      copy.alertTitle.concurrent,
      "Norte y Sur están vigentes al mismo tiempo. Se aplica Sur a todo el período porque es el más reciente por vigencia. Las prestaciones y deducciones de Norte no se consideran. Corrige las vigencias en Tarifas de pago o, si corresponde, agrega un ajuste manual (pedirá autorización).",
    ],
    [
      "mismo día · con viajes",
      sameDayTouch,
      true,
      copy.alertTitle.concurrent,
      "Norte y Sur están vigentes al mismo tiempo. Se aplica Sur a todo el período, incluidos sus viajes, porque es el más reciente por vigencia. Las reglas de pago, corredores, prestaciones y deducciones de Norte no se consideran. Corrige las vigencias en Tarifas de pago o, si corresponde, agrega un ajuste manual (pedirá autorización).",
    ],
    [
      "≥3 esquemas · sin viajes",
      severalClosed,
      false,
      copy.alertTitle.several,
      "Se aplica Sur a todo el período porque es el vigente el 31 ago 2026. Las prestaciones y deducciones de los demás esquemas no se consideran. Si corresponde, corrígelo con un ajuste manual (pedirá autorización).",
    ],
    [
      "≥3 con from abierto · con viajes",
      severalFromOpen,
      true,
      copy.alertTitle.several,
      "Se aplica Sur a todo el período porque es el vigente el 31 ago 2026, también a los viajes con salida antes del 20 ago 2026. Las reglas de pago, corredores, prestaciones y deducciones de los demás esquemas no se consideran. Si corresponde, corrígelo con un ajuste manual (pedirá autorización).",
    ],
    [
      "from abierto · sin viajes",
      fromOpen,
      false,
      copy.alertTitle.concurrent,
      "Norte y Sur están vigentes al mismo tiempo. Se aplica Sur a todo el período porque es el más reciente por vigencia. Las prestaciones y deducciones de Norte no se consideran. Corrige las vigencias en Tarifas de pago o, si corresponde, agrega un ajuste manual (pedirá autorización).",
    ],
  ] as const)("%s", (_label, tc, withTrips, title, body) => {
    expect(resolveTemplateChangeAlert(tc, withTrips, PERIOD_END)).toEqual({ title, body });
  });
});

describe("resolveTemplateChangeTooltip", () => {
  it.each([
    [
      "cambio simple · sin viajes",
      simpleChange,
      false,
      "En este período el operador tuvo dos esquemas: Norte hasta el 14 ago 2026 y Sur desde el 15 ago 2026. El pago se calcula completo con Sur, el vigente al cierre. Si debe reflejar la parte de Norte, agrega un ajuste manual.",
    ],
    [
      "mismo día · con viajes",
      sameDayTouch,
      true,
      "En este período el operador tuvo dos esquemas a la vez: Norte y Sur. Todos los viajes y conceptos del período se calculan con Sur, el más reciente por vigencia. Revisa sus vigencias en Tarifas de pago; si debe reflejar la parte de Norte, agrega un ajuste manual.",
    ],
    [
      "≥3 con from abierto · sin viajes",
      severalFromOpen,
      false,
      "En este período el operador tuvo 3 esquemas, de Norte a Sur. El pago se calcula completo con Sur, el vigente al cierre. Si debe reflejar la parte de los demás esquemas, agrega un ajuste manual.",
    ],
    [
      "from abierto · con viajes",
      fromOpen,
      true,
      "En este período el operador tuvo dos esquemas a la vez: Norte y Sur. Todos los viajes y conceptos del período se calculan con Sur, el más reciente por vigencia. Revisa sus vigencias en Tarifas de pago; si debe reflejar la parte de Norte, agrega un ajuste manual.",
    ],
  ] as const)("%s", (_label, tc, withTrips, expected) => {
    expect(resolveTemplateChangeTooltip(tc, withTrips)).toBe(expected);
  });
});

describe("visibleTemplateNames", () => {
  it("agrega versión solo cuando dos esquemas mostrados comparten nombre", () => {
    const v1 = ref("tpl-a1", "Operador estándar", "2026-07-01", "2026-08-14");
    const v2 = ref("tpl-a2", "Operador estándar", "2026-08-15", null, {
      templateVersion: 2,
    });
    expect(visibleTemplateNames([v1, v2])).toEqual([
      "Operador estándar (v1)",
      "Operador estándar (v2)",
    ]);
  });

  it("no agrega versión si los nombres son distintos", () => {
    expect(visibleTemplateNames([norte, sur])).toEqual(["Norte", "Sur"]);
  });
});
