import { describe, expect, it } from "vitest";
import {
  mapSettlementCutCreateResult,
  mapSettlementCutPreview,
  type ApiSettlementCutCreateRaw,
  type ApiSettlementCutPreviewRaw,
} from "./mappers";

const previewRaw: ApiSettlementCutPreviewRaw = {
  period_start: "2026-11-03",
  period_end: "2026-11-09",
  salary_period: "weekly",
  include_contractors: false,
  eligible: [
    {
      employee_id: "emp-1",
      employee_full_name: "Juan Pérez",
      employment_type: "employee",
      salary_period: "weekly",
      estimated_net: 13270,
      estimated_gross: 15000,
      max_advance_deductible: 2000,
      suggested_advance_deduction: 500,
      trip_ids: ["trip-1"],
      warnings: [],
      effect: "includable",
      primary_reason: null,
      period_overlap: null,
      suggested_period_start: null,
      open_advances_balance: 0,
    },
    {
      employee_id: "emp-2",
      employee_full_name: "Sofía Ramos",
      employment_type: "employee",
      salary_period: "weekly",
      estimated_net: 0,
      estimated_gross: 8000,
      max_advance_deductible: null,
      suggested_advance_deduction: null,
      trip_ids: ["trip-2"],
      warnings: [
        {
          code: "deductions_exceed_capacity",
          message: "Descuentos superan el total",
        },
      ],
      effect: "blocking",
      primary_reason: "deductions_exceed_capacity",
      period_overlap: null,
      suggested_period_start: null,
      open_advances_balance: 9000,
    },
  ],
  excluded: [
    {
      employee_id: "emp-3",
      employee_full_name: "Martín Salas",
      employment_type: "employee",
      salary_period: "weekly",
      estimated_net: null,
      estimated_gross: null,
      max_advance_deductible: null,
      suggested_advance_deduction: null,
      trip_ids: [],
      warnings: [
        { code: "no_payable_template", message: "Sin tarifa asignada" },
      ],
      effect: "excluded",
      primary_reason: "no_payable_template",
      period_overlap: null,
      suggested_period_start: null,
      open_advances_balance: 0,
    },
  ],
  summary: {
    eligible_count: 2,
    includable_count: 1,
    blocking_count: 1,
    excluded_count: 1,
    estimated_net_total: 13270,
    max_rows: 100,
  },
};

describe("mapSettlementCutPreview", () => {
  it("mapea snake_case → camelCase y efectos DOM", () => {
    const mapped = mapSettlementCutPreview(previewRaw);

    expect(mapped.periodStart).toBe("2026-11-03");
    expect(mapped.salaryPeriod).toBe("weekly");
    expect(mapped.summary.includableCount).toBe(1);
    expect(mapped.summary.blockingCount).toBe(1);
    expect(mapped.eligible[1]?.effect).toBe("blocking");
    expect(mapped.eligible[1]?.primaryReason).toBe("deductions_exceed_capacity");
    expect(mapped.excluded[0]?.effect).toBe("excluded");
    expect(mapped.eligible[0]?.tripIds).toEqual(["trip-1"]);
  });
});

describe("mapSettlementCutCreateResult", () => {
  it("mapea created / omitted / idempotent_replay", () => {
    const raw: ApiSettlementCutCreateRaw = {
      created: [
        {
          employee_id: "emp-1",
          settlement_id: "set-1",
          settlement_number: "P-001",
          status: "pending_approval",
          net_amount: 13270,
        },
      ],
      omitted: [
        {
          employee_id: "emp-2",
          reason_code: "CUT_ROW_BLOCKED",
          message: "Fila bloqueada",
          http_status: 422,
        },
      ],
      idempotent_replay: true,
    };

    const mapped = mapSettlementCutCreateResult(raw, "Corte reenviado");
    expect(mapped.idempotentReplay).toBe(true);
    expect(mapped.message).toBe("Corte reenviado");
    expect(mapped.created[0]?.settlementNumber).toBe("P-001");
    expect(mapped.omitted[0]?.reasonCode).toBe("CUT_ROW_BLOCKED");
  });
});
