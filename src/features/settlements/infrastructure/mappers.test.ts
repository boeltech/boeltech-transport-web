import { describe, it, expect } from "vitest";
import {
  mapAgreement,
  mapAdvance,
  mapSettlement,
  mapSettlementPreview,
  mapListSettlementsResponse,
  mapListAdvancesResponse,
  mapSettlementSettings,
  type ApiCompensationAgreementRaw,
  type ApiDriverAdvanceRaw,
  type ApiDriverSettlementRaw,
  type ApiSettlementPreviewRaw,
} from "./mappers";

describe("Settlements Infrastructure Mappers", () => {
  it("mapea acuerdo de compensación compuesto (ADR-0086) correctamente con sueldo y reglas", () => {
    const raw: ApiCompensationAgreementRaw = {
      id: "agr-comp-1",
      tenant_id: "tenant-1",
      employee_id: "emp-1",
      employee_full_name: "Pedro Infante",
      has_fixed_salary: true,
      fixed_salary_amount: 3500,
      fixed_salary_period: "weekly",
      is_salary_guaranteed: true,
      currency: "MXN",
      effective_from: "2026-09-01",
      effective_to: null,
      is_active: true,
      notes: "Esquema piloto compuesto",
      created_at: "2026-09-01T00:00:00Z",
      updated_at: "2026-09-01T00:00:00Z",
      rules: [
        {
          id: "rule-1",
          agreement_id: "agr-comp-1",
          route_type: "long_haul",
          commission_type: "rate_per_km",
          rate_value: 2.75,
          minimum_guaranteed_amount: 400,
          notes: "Carretera federal foránea",
        },
        {
          id: "rule-2",
          agreement_id: "agr-comp-1",
          route_type: "local",
          commission_type: "none",
          rate_value: 0,
          minimum_guaranteed_amount: 0,
          notes: "Cubierto por sueldo base",
        },
      ],
    };

    const mapped = mapAgreement(raw);

    expect(mapped.id).toBe("agr-comp-1");
    expect(mapped.hasFixedSalary).toBe(true);
    expect(mapped.fixedSalaryAmount).toBe(3500);
    expect(mapped.fixedSalaryPeriod).toBe("weekly");
    expect(mapped.rules).toHaveLength(2);
    expect(mapped.rules?.[0]?.routeType).toBe("long_haul");
    expect(mapped.rules?.[0]?.commissionType).toBe("rate_per_km");
    expect(mapped.rules?.[0]?.rateValue).toBe(2.75);
    expect(mapped.rules?.[0]?.minimumGuaranteedAmount).toBe(400);
  });

  it("mapea acuerdo de compensación plano de snake_case a camelCase (ADR-0085 legacy)", () => {
    const raw: ApiCompensationAgreementRaw = {
      id: "agr-1",
      tenant_id: "tenant-1",
      employee_id: "emp-1",
      employee_full_name: "Pedro Infante",
      calculation_type: "rate_per_km",
      base_rate: 0,
      rate_per_km: 4.25,
      percentage_rate: 0,
      helper_daily_rate: 0,
      currency: "MXN",
      effective_from: "2026-01-01",
      effective_to: null,
      is_active: true,
      notes: "Tarifa carretera federal",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };

    const mapped = mapAgreement(raw);

    expect(mapped.id).toBe("agr-1");
    expect(mapped.tenantId).toBe("tenant-1");
    expect(mapped.employeeId).toBe("emp-1");
    expect(mapped.employeeFullName).toBe("Pedro Infante");
    expect(mapped.calculationType).toBe("rate_per_km");
    expect(mapped.ratePerKm).toBe(4.25);
    expect(mapped.isActive).toBe(true);
  });

  it("mapea anticipo a operador correctamente incluyendo trazabilidad de autorización", () => {
    const raw: ApiDriverAdvanceRaw = {
      id: "adv-1",
      tenant_id: "tenant-1",
      folio: "ANT-202608-0001",
      employee_id: "emp-1",
      employee_full_name: "Pedro Infante",
      trip_id: "trip-1",
      trip_code: "TRP-001",
      amount: 2500,
      balance_remaining: 1500,
      currency: "MXN",
      category: "travel_advance",
      status: "pending_approval",
      disbursed_at: null,
      payment_method: "bank_transfer",
      bank_reference: "SPEI-12345",
      submitted_at: "2026-08-01T10:00:00Z",
      submitted_by: "user-creator",
      approved_at: null,
      approved_by: null,
      rejected_at: null,
      rejected_by: null,
      rejection_reason: null,
      notes: "Viáticos CDMX - GDL",
      created_at: "2026-08-01T10:00:00Z",
      updated_at: "2026-08-05T12:00:00Z",
    };

    const mapped = mapAdvance(raw);

    expect(mapped.folio).toBe("ANT-202608-0001");
    expect(mapped.amount).toBe(2500);
    expect(mapped.balanceRemaining).toBe(1500);
    expect(mapped.paymentMethod).toBe("bank_transfer");
    expect(mapped.status).toBe("pending_approval");
    expect(mapped.submittedAt).toBe("2026-08-01T10:00:00Z");
    expect(mapped.submittedBy).toBe("user-creator");
  });

  it("mapea liquidación con partidas desglosadas y trazabilidad de envío", () => {
    const raw: ApiDriverSettlementRaw = {
      id: "st-1",
      tenant_id: "tenant-1",
      settlement_number: "LIQ-202608-0001",
      employee_id: "emp-1",
      employee_full_name: "Pedro Infante",
      agreement_snapshot: { calculation_type: "rate_per_km", rate_per_km: 3.5 },
      period_start: "2026-08-01",
      period_end: "2026-08-15",
      status: "approved",
      total_trips_commission: 3500,
      total_base_salary: 0,
      total_reimbursable_expenses: 800,
      total_bonuses: 200,
      total_advances_deducted: 1000,
      total_other_deductions: 0,
      gross_amount: 4500,
      net_amount: 3500,
      currency: "MXN",
      disbursed_at: null,
      disbursed_by: null,
      disbursement_method: null,
      disbursement_reference: null,
      approved_at: "2026-08-16T10:00:00Z",
      approved_by: "user-approver",
      approved_by_name: "Gerente Operaciones",
      submitted_at: "2026-08-15T18:00:00Z",
      submitted_by: "user-creator",
      rejection_reason: null,
      notes: "Corte quincena 1 agosto",
      created_at: "2026-08-15T18:00:00Z",
      updated_at: "2026-08-16T10:00:00Z",
      has_manual_adjustments: false,
      vobo_required: true,
      advances_reserved: false,
      advances_applied: false,
      created_by: "user-creator",
      items: [
        {
          id: "item-1",
          settlement_id: "st-1",
          item_type: "trip_commission",
          trip_id: "trip-1",
          trip_code: "TRP-001",
          trip_expense_id: null,
          advance_id: null,
          description: "Comisión viaje TRP-001",
          quantity: 1,
          unit_rate: 3500,
          amount: 3500,
          is_deduction: false,
          created_at: "2026-08-15T18:00:00Z",
        },
      ],
    };

    const mapped = mapSettlement(raw);

    expect(mapped.settlementNumber).toBe("LIQ-202608-0001");
    expect(mapped.grossAmount).toBe(4500);
    expect(mapped.netAmount).toBe(3500);
    expect(mapped.submittedBy).toBe("user-creator");
    expect(mapped.voboRequired).toBe(true);
    expect(mapped.hasManualAdjustments).toBe(false);
    expect(mapped.createdBy).toBe("user-creator");
    expect(mapped.items).toHaveLength(1);
    expect(mapped.items?.[0]?.itemType).toBe("trip_commission");
  });

  it("mapea preliquidación (preview) con route_type y applied_rule", () => {
    const raw: ApiSettlementPreviewRaw = {
      employee_id: "emp-1",
      employee_name: "Pedro Infante",
      period_start: "2026-08-01",
      period_end: "2026-08-15",
      agreement: { calculation_type: "rate_per_km" },
      eligible_trips: [
        {
          trip_id: "trip-1",
          trip_code: "TRP-001",
          route_type: "long_haul",
          scheduled_departure: "2026-08-02T08:00:00Z",
          completed_at: "2026-08-03T18:00:00Z",
          origin_city: "CDMX",
          destination_city: "Monterrey",
          distance_km: 900,
          freight_revenue: 35000,
          applied_rule: "Tarifa foránea $3.5/km",
          calculated_commission: 3150,
          approved_reimbursable_expenses: 500,
          freight_base: "commercial_at_complete",
          mid_trip_share_ratio: 0.4,
        },
      ],
      open_advances: [
        {
          advance_id: "adv-1",
          folio: "ANT-001",
          amount: 2000,
          balance_remaining: 1000,
          category: "travel_advance",
          disbursed_at: "2026-08-01T10:00:00Z",
        },
      ],
      summary: {
        total_commissions: 3150,
        total_base_salary: 3000,
        total_reimbursements: 500,
        suggested_advance_deduction: 1000,
        gross_amount: 6650,
        net_amount: 5650,
      },
    };

    const mapped = mapSettlementPreview(raw);

    expect(mapped.employeeName).toBe("Pedro Infante");
    expect(mapped.eligibleTrips).toHaveLength(1);
    expect(mapped.eligibleTrips[0].routeType).toBe("long_haul");
    expect(mapped.eligibleTrips[0].appliedRule).toBe("Tarifa foránea $3.5/km");
    expect(mapped.eligibleTrips[0].freightBase).toBe("commercial_at_complete");
    expect(mapped.eligibleTrips[0].midTripShareRatio).toBe(0.4);
    expect(mapped.openAdvances).toHaveLength(1);
    expect(mapped.summary.totalBaseSalary).toBe(3000);
    expect(mapped.summary.netAmount).toBe(5650);
  });

  it("mapea respuesta paginada de liquidaciones extrayendo limit y totalPages adecuadamente", () => {
    const rawResponse = {
      data: [
        {
          id: "st-1",
          tenant_id: "tenant-1",
          settlement_number: "LIQ-202608-0001",
          employee_id: "emp-1",
          agreement_snapshot: {},
          period_start: "2026-08-01",
          period_end: "2026-08-15",
          status: "pending_approval",
          total_trips_commission: 3500,
          total_base_salary: 1000,
          total_reimbursable_expenses: 0,
          total_bonuses: 0,
          total_advances_deducted: 1000,
          total_other_deductions: 0,
          gross_amount: 4500,
          net_amount: 3500,
          currency: "MXN",
          disbursed_at: null,
          disbursed_by: null,
          disbursement_method: null,
          disbursement_reference: null,
          approved_at: null,
          approved_by: null,
          rejection_reason: null,
          notes: null,
          created_at: "2026-08-15T18:00:00Z",
          updated_at: "2026-08-15T18:00:00Z",
        },
      ],
      pagination: {
        total: 1,
        page: 1,
        page_size: 20,
        total_pages: 1,
      },
    };

    const mapped = mapListSettlementsResponse(rawResponse);
    expect(mapped.data).toHaveLength(1);
    expect(mapped.pagination.total).toBe(1);
    expect(mapped.pagination.page).toBe(1);
    expect(mapped.pagination.limit).toBe(20);
    expect(mapped.pagination.totalPages).toBe(1);
  });

  it("mapea respuesta paginada de anticipos con compatibilidad de camelCase y snake_case", () => {
    const rawResponse = {
      data: [],
      pagination: {
        total: 45,
        page: 2,
        pageSize: 20,
        totalPages: 3,
      } as unknown as { page: number; page_size: number; total: number; total_pages: number },
    };

    const mapped = mapListAdvancesResponse(rawResponse);
    expect(mapped.data).toHaveLength(0);
    expect(mapped.pagination.total).toBe(45);
    expect(mapped.pagination.page).toBe(2);
    expect(mapped.pagination.limit).toBe(20);
    expect(mapped.pagination.totalPages).toBe(3);
  });

  it("mapea settings greenfield y umbral de VoBo", () => {
    const mapped = mapSettlementSettings({
      pagos_operadores_greenfield_v1: true,
      vobo_threshold_mxn: 7500,
    });
    expect(mapped.pagosOperadoresGreenfieldV1).toBe(true);
    expect(mapped.voboThresholdMxn).toBe(7500);
  });
});
