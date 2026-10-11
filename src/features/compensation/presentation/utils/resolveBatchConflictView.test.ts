import { describe, expect, it } from "vitest";
import type { BatchAssignmentConflict } from "../../domain/entities";
import { resolveBatchConflictView } from "./resolveBatchConflictView";

const TEMPLATE_ID = "tpl-new";
const CONTEXT = { templateId: TEMPLATE_ID, newEffectiveFrom: "2026-09-01" };

function conflict(overrides: Partial<BatchAssignmentConflict> = {}): BatchAssignmentConflict {
  return {
    employeeId: "emp-1",
    code: "OVERLAPPING_ACTIVE_ASSIGNMENT",
    message: "Mensaje de la API",
    reason: "previous_starts_on_or_after",
    employeeFullName: "Fernando Ruiz",
    existingAssignmentId: "asg-old",
    existingTemplateId: "tpl-old",
    existingTemplateName: "Foráneo",
    existingTemplateVersion: 1,
    existingEffectiveFrom: "2026-09-01",
    existingEffectiveTo: "2026-09-30",
    closePreviousOn: null,
    suggestedEffectiveFrom: "2026-10-01",
    ...overrides,
  };
}

const EXISTING_CLOSED = {
  templateName: "Foráneo",
  templateVersion: 1,
  effectiveFrom: "2026-09-01",
  effectiveTo: "2026-09-30",
};

const OTHER_TEMPLATE_LINK = {
  type: "other-template",
  employeeId: "emp-1",
  assignmentId: "asg-old",
  templateId: "tpl-old",
  templateName: "Foráneo",
  templateVersion: 1,
};

describe("resolveBatchConflictView", () => {
  it("D3: anterior cerrada que empieza el mismo día o después → asignar desde hasta + 1 y enlace", () => {
    expect(resolveBatchConflictView(conflict(), CONTEXT)).toEqual({
      kind: "D3",
      existing: EXISTING_CLOSED,
      newEffectiveFrom: "2026-09-01",
      nextEffectiveFrom: "2026-10-01",
      primaryAction: { type: "assign-from", employeeId: "emp-1", effectiveFrom: "2026-10-01" },
      link: OTHER_TEMPLATE_LINK,
    });
  });

  it("D4: anterior abierta → sin botón, enlace como única acción", () => {
    const view = resolveBatchConflictView(
      conflict({ existingEffectiveTo: null, suggestedEffectiveFrom: null }),
      CONTEXT,
    );
    expect(view).toEqual({
      kind: "D4",
      existing: { ...EXISTING_CLOSED, effectiveTo: null },
      newEffectiveFrom: "2026-09-01",
      link: OTHER_TEMPLATE_LINK,
    });
    expect("primaryAction" in view).toBe(false);
  });

  it("D5: ya asignado a esta misma versión, con cualquier motivo → «Ver su asignación»", () => {
    for (const reason of [
      "previous_starts_on_or_after",
      "overlap_close_disabled",
      "period_settled",
    ] as const) {
      expect(
        resolveBatchConflictView(
          conflict({ reason, existingTemplateId: TEMPLATE_ID, closePreviousOn: "2026-08-31" }),
          CONTEXT,
        ),
      ).toEqual({
        kind: "D5",
        existing: EXISTING_CLOSED,
        link: {
          type: "same-template",
          employeeId: "emp-1",
          assignmentId: "asg-old",
          templateId: TEMPLATE_ID,
        },
      });
    }
  });

  it("D6-close: casilla desmarcada y la anterior empieza antes → marcar cierre, sin enlace", () => {
    expect(
      resolveBatchConflictView(
        conflict({
          reason: "overlap_close_disabled",
          existingEffectiveFrom: "2026-08-01",
          existingEffectiveTo: null,
          closePreviousOn: "2026-08-31",
          suggestedEffectiveFrom: null,
        }),
        CONTEXT,
      ),
    ).toEqual({
      kind: "D6-close",
      existing: { ...EXISTING_CLOSED, effectiveFrom: "2026-08-01", effectiveTo: null },
      closePreviousOn: "2026-08-31",
      primaryAction: { type: "mark-close-previous" },
    });
  });

  it("D6-dates: casilla desmarcada y la anterior empieza el mismo día o después → como D3/D4", () => {
    expect(
      resolveBatchConflictView(conflict({ reason: "overlap_close_disabled" }), CONTEXT),
    ).toMatchObject({
      kind: "D6-dates",
      nextEffectiveFrom: "2026-10-01",
      primaryAction: { type: "assign-from", effectiveFrom: "2026-10-01" },
      link: OTHER_TEMPLATE_LINK,
    });

    const open = resolveBatchConflictView(
      conflict({
        reason: "overlap_close_disabled",
        existingEffectiveTo: null,
        suggestedEffectiveFrom: null,
      }),
      CONTEXT,
    );
    expect(open).toMatchObject({ kind: "D6-dates", link: OTHER_TEMPLATE_LINK });
    expect(open).not.toHaveProperty("primaryAction.type");
  });

  it("D7: días liquidados por reason o por code → botón solo con fecha sugerida", () => {
    expect(
      resolveBatchConflictView(conflict({ reason: "period_settled" }), CONTEXT),
    ).toEqual({
      kind: "D7",
      primaryAction: { type: "assign-from", employeeId: "emp-1", effectiveFrom: "2026-10-01" },
    });
    expect(
      resolveBatchConflictView(
        conflict({
          reason: undefined,
          code: "ASSIGNMENT_PERIOD_SETTLED",
          suggestedEffectiveFrom: null,
        }),
        CONTEXT,
      ),
    ).toEqual({ kind: "D7", primaryAction: undefined });
  });

  it("D8: sin reason, reason desconocido o sin datos de la asignación", () => {
    expect(resolveBatchConflictView(conflict({ reason: undefined }), CONTEXT)).toEqual({
      kind: "D8",
    });
    expect(
      resolveBatchConflictView(
        { employeeId: "emp-1", code: "OVERLAPPING_ACTIVE_ASSIGNMENT" },
        CONTEXT,
      ),
    ).toEqual({ kind: "D8" });
    expect(
      resolveBatchConflictView(conflict({ existingTemplateName: null }), CONTEXT),
    ).toEqual({ kind: "D8" });
  });

  it("D9-period: ritmo desalineado por reason o por code → sin existing_*", () => {
    const mismatches = [
      {
        kind: "fixed_allowance" as const,
        id: "all-1",
        label: "Comida",
        period: "monthly" as const,
      },
    ];
    expect(
      resolveBatchConflictView(
        conflict({
          reason: "period_mismatch",
          code: "COMPENSATION_PERIOD_MISMATCH",
          existingTemplateName: null,
          existingTemplateId: null,
          existingAssignmentId: null,
          existingEffectiveFrom: null,
          employeeSalaryType: "weekly",
          mismatches,
        }),
        CONTEXT,
      ),
    ).toEqual({
      kind: "D9-period",
      employeeId: "emp-1",
      employeeSalaryType: "weekly",
      mismatches,
    });
    expect(
      resolveBatchConflictView(
        {
          employeeId: "emp-2",
          code: "COMPENSATION_PERIOD_MISMATCH",
          message: "No se puede usar esta tarifa…",
        },
        CONTEXT,
      ),
    ).toEqual({
      kind: "D9-period",
      employeeId: "emp-2",
      employeeSalaryType: null,
      mismatches: [],
    });
  });

  describe("tabla D18: dónde va el enlace a la asignación que bloquea", () => {
    const cases: Array<[string, BatchAssignmentConflict, "other-template" | "same-template" | null]> = [
      ["D3", conflict(), "other-template"],
      ["D4", conflict({ existingEffectiveTo: null }), "other-template"],
      ["D5", conflict({ existingTemplateId: TEMPLATE_ID }), "same-template"],
      [
        "D6-close",
        conflict({ reason: "overlap_close_disabled", closePreviousOn: "2026-08-31" }),
        null,
      ],
      ["D6-dates", conflict({ reason: "overlap_close_disabled" }), "other-template"],
      ["D7", conflict({ reason: "period_settled" }), null],
      ["D8", conflict({ reason: undefined }), null],
      [
        "D9-period",
        conflict({
          reason: "period_mismatch",
          code: "COMPENSATION_PERIOD_MISMATCH",
          existingTemplateName: null,
        }),
        null,
      ],
    ];

    it.each(cases)("%s", (kind, input, expectedLink) => {
      const view = resolveBatchConflictView(input, CONTEXT);
      expect(view.kind).toBe(kind);
      const link = "link" in view ? view.link : undefined;
      expect(link?.type ?? null).toBe(expectedLink);
    });

    it("criterio 21: nunca hay enlace en D7 ni en D6 con botón de cierre, aunque vengan los ids", () => {
      const settled = resolveBatchConflictView(
        conflict({ reason: "period_settled", code: "ASSIGNMENT_PERIOD_SETTLED" }),
        CONTEXT,
      );
      const closeable = resolveBatchConflictView(
        conflict({ reason: "overlap_close_disabled", closePreviousOn: "2026-08-31" }),
        CONTEXT,
      );
      expect(settled.kind).toBe("D7");
      expect(settled).not.toHaveProperty("link");
      expect(closeable.kind).toBe("D6-close");
      expect(closeable).not.toHaveProperty("link");
    });

    it("sin id de la asignación o de su plantilla no hay enlace", () => {
      expect(
        resolveBatchConflictView(conflict({ existingAssignmentId: null }), CONTEXT),
      ).toMatchObject({ kind: "D3", link: undefined });
      expect(
        resolveBatchConflictView(conflict({ existingTemplateId: null }), CONTEXT),
      ).toMatchObject({ kind: "D3", link: undefined });
      expect(
        resolveBatchConflictView(
          conflict({ existingTemplateId: TEMPLATE_ID, existingAssignmentId: null }),
          CONTEXT,
        ),
      ).toMatchObject({ kind: "D5", link: undefined });
    });
  });
});
