import { describe, expect, it } from "vitest";
import type { CompensationAgreement } from "../../domain/entities";
import {
  doActiveAgreementsOverlap,
  findActiveOverlappingAgreements,
  findEligibleAgreementsForEmployeeOnDate,
  getAgreementIdsWithOverlapConflict,
  isAgreementEligibleOnDate,
  pickAgreementBySettlementTiebreak,
  subtractOneCalendarDay,
} from "./compensationAgreementOverlap";

function makeAgreement(
  overrides: Partial<CompensationAgreement> & Pick<CompensationAgreement, "id">,
): CompensationAgreement {
  return {
    tenantId: "tenant-1",
    employeeId: "emp-1",
    currency: "MXN",
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    isActive: true,
    notes: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("compensationAgreementOverlap", () => {
  it("detecta elegibilidad por fecha y estado activo", () => {
    const agreement = makeAgreement({
      id: "a1",
      effectiveFrom: "2026-08-01",
      effectiveTo: "2026-08-31",
      isActive: true,
    });

    expect(isAgreementEligibleOnDate(agreement, "2026-08-15")).toBe(true);
    expect(isAgreementEligibleOnDate(agreement, "2026-09-01")).toBe(false);
    expect(isAgreementEligibleOnDate({ ...agreement, isActive: false }, "2026-08-15")).toBe(
      false,
    );
  });

  it("marca conflictos cuando hay dos activas traslapadas del mismo operador", () => {
    const agreements = [
      makeAgreement({
        id: "a1",
        effectiveFrom: "2026-08-01",
        effectiveTo: null,
        createdAt: "2026-08-01T00:00:00Z",
      }),
      makeAgreement({
        id: "a2",
        effectiveFrom: "2026-08-15",
        effectiveTo: null,
        createdAt: "2026-08-15T00:00:00Z",
      }),
    ];

    expect(doActiveAgreementsOverlap(agreements[0]!, agreements[1]!)).toBe(true);
    expect(getAgreementIdsWithOverlapConflict(agreements)).toEqual(new Set(["a1", "a2"]));
  });

  it("desempata como preview API (effective_from DESC, created_at DESC)", () => {
    const candidates = [
      makeAgreement({
        id: "older",
        effectiveFrom: "2026-07-01",
        createdAt: "2026-07-01T00:00:00Z",
      }),
      makeAgreement({
        id: "newer",
        effectiveFrom: "2026-08-01",
        createdAt: "2026-08-01T00:00:00Z",
      }),
    ];

    expect(pickAgreementBySettlementTiebreak(candidates)?.id).toBe("newer");
  });

  it("encuentra elegibles en period_end y solapes al crear", () => {
    const agreements = [
      makeAgreement({ id: "a1", effectiveFrom: "2026-08-01" }),
      makeAgreement({
        id: "a2",
        effectiveFrom: "2026-08-10",
        createdAt: "2026-08-10T00:00:00Z",
      }),
    ];

    const eligible = findEligibleAgreementsForEmployeeOnDate(
      agreements,
      "emp-1",
      "2026-08-20",
    );
    expect(eligible).toHaveLength(2);

    const overlapping = findActiveOverlappingAgreements(agreements, {
      employeeId: "emp-1",
      effectiveFrom: "2026-09-01",
    });
    expect(overlapping.map((item) => item.id)).toEqual(["a1", "a2"]);
  });

  it("resta un día calendario para cerrar vigencia previa", () => {
    expect(subtractOneCalendarDay("2026-09-01")).toBe("2026-08-31");
  });
});
