import { describe, expect, it } from "vitest";
import {
  findEligibleAssignmentsForEmployeeOnDate,
  pickAssignmentBySettlementTiebreak,
} from "./templateAssignmentOverlap";
import type { TemplateAssignment } from "../../domain/entities";

const baseAssignment = (
  overrides: Partial<TemplateAssignment>,
): TemplateAssignment => ({
  id: "assign-1",
  employeeId: "emp-1",
  templateId: "tpl-old",
  effectiveFrom: "2026-09-01",
  effectiveTo: null,
  isActive: true,
  ...overrides,
});

describe("findEligibleAssignmentsForEmployeeOnDate", () => {
  it("devuelve asignaciones activas vigentes en la fecha", () => {
    const eligible = findEligibleAssignmentsForEmployeeOnDate(
      [
        baseAssignment({ id: "a1", effectiveFrom: "2026-09-01" }),
        baseAssignment({ id: "a2", effectiveFrom: "2026-10-01", isActive: false }),
      ],
      "emp-1",
      "2026-09-15",
    );

    expect(eligible).toHaveLength(1);
    expect(eligible[0]?.id).toBe("a1");
  });

  it("aplica desempate por effective_from DESC", () => {
    const picked = pickAssignmentBySettlementTiebreak([
      baseAssignment({ id: "older", effectiveFrom: "2026-08-01", createdAt: "2026-08-01T00:00:00Z" }),
      baseAssignment({ id: "newer", effectiveFrom: "2026-09-01", createdAt: "2026-09-01T00:00:00Z" }),
    ]);

    expect(picked?.id).toBe("newer");
  });
});
