import { describe, it, expect } from "vitest";
import {
  mapAgreement,
  mapAdvance,
  mapSettlement,
  mapSettlementPreview,
  mapBacklogRow,
  mapListSettlementsResponse,
  mapListAdvancesResponse,
  mapSettlementSettings,
  type ApiCompensationAgreementRaw,
  type ApiDriverAdvanceRaw,
  type ApiDriverSettlementRaw,
  type ApiSettlementBacklogRowRaw,
  type ApiSettlementPreviewRaw,
  type ApiTemplateChangeInPeriodRaw,
  type ApiTemplateVersionSupersededRaw,
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
    expect(mapped.createdBy).toBeNull();
    expect(mapped.selfSegregatedApproval).toBe(false);
    expect(mapped.approverCountAtApprove).toBeNull();
  });

  it("ADR-0098: mapea creador, ejecutor y evidencia de autoacción del anticipo", () => {
    const mapped = mapAdvance({
      id: "adv-2",
      tenant_id: "tenant-1",
      folio: "ANT-202610-0002",
      employee_id: "emp-1",
      trip_id: null,
      amount: 1000,
      balance_remaining: 1000,
      currency: "MXN",
      category: "travel_advance",
      status: "disbursed",
      disbursed_at: "2026-10-01T12:00:00Z",
      payment_method: "cash",
      bank_reference: null,
      notes: null,
      created_by: "admin-solo",
      disbursed_by: "admin-solo",
      self_segregated_approval: true,
      approver_count_at_approve: 1,
      self_segregated_disbursement: true,
      executor_count_at_disburse: 1,
      created_at: "2026-10-01T10:00:00Z",
      updated_at: "2026-10-01T12:00:00Z",
    });

    expect(mapped.createdBy).toBe("admin-solo");
    expect(mapped.disbursedBy).toBe("admin-solo");
    expect(mapped.selfSegregatedApproval).toBe(true);
    expect(mapped.approverCountAtApprove).toBe(1);
    expect(mapped.selfSegregatedDisbursement).toBe(true);
    expect(mapped.executorCountAtDisburse).toBe(1);
  });

  it("F4-bis: mapea el método autorizado del anticipo y lo omite si el API no lo envía", () => {
    const base: ApiDriverAdvanceRaw = {
      id: "adv-3",
      tenant_id: "tenant-1",
      folio: "ANT-202610-0003",
      employee_id: "emp-1",
      trip_id: null,
      amount: 800,
      balance_remaining: 800,
      currency: "MXN",
      category: "travel_advance",
      status: "disbursed",
      disbursed_at: "2026-10-02T12:00:00Z",
      payment_method: "cash",
      bank_reference: null,
      notes: null,
      created_at: "2026-10-02T10:00:00Z",
      updated_at: "2026-10-02T12:00:00Z",
    };

    const withAuthorized = mapAdvance({ ...base, authorized_payment_method: "bank_transfer" });
    expect(withAuthorized.paymentMethod).toBe("cash");
    expect(withAuthorized.authorizedPaymentMethod).toBe("bank_transfer");

    expect(mapAdvance(base).authorizedPaymentMethod).toBeUndefined();
    expect(mapAdvance({ ...base, authorized_payment_method: null }).authorizedPaymentMethod).toBeUndefined();
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
      submitted_by_name: "Ana Capataz",
      created_by_name: "Ana Capataz",
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
    // H4: la traza de quién armó el corte y quién pidió el VoBo llega del API.
    expect(mapped.createdByName).toBe("Ana Capataz");
    expect(mapped.submittedByName).toBe("Ana Capataz");
    expect(mapped.items).toHaveLength(1);
    expect(mapped.items?.[0]?.itemType).toBe("trip_commission");
    expect(mapped.selfSegregatedApproval).toBe(false);
    expect(mapped.approverCountAtApprove).toBeNull();
    expect(mapped.selfSegregatedDisbursement).toBe(false);
    expect(mapped.executorCountAtDisburse).toBeNull();
  });

  it("mapea evidencia D3′ self-segregated en liquidación", () => {
    const raw: ApiDriverSettlementRaw = {
      id: "st-d3",
      tenant_id: "tenant-1",
      settlement_number: "LIQ-202609-0009",
      employee_id: "emp-1",
      employee_full_name: "Pedro Infante",
      agreement_snapshot: { currency: "MXN" },
      period_start: "2026-09-01",
      period_end: "2026-09-15",
      status: "disbursed",
      total_trips_commission: 1000,
      total_base_salary: 0,
      total_reimbursable_expenses: 0,
      total_bonuses: 0,
      total_advances_deducted: 0,
      total_other_deductions: 0,
      gross_amount: 1000,
      net_amount: 1000,
      currency: "MXN",
      disbursed_at: "2026-09-16T12:00:00Z",
      disbursed_by: "user-solo",
      disbursement_method: "bank_transfer",
      disbursement_reference: "SPEI-1",
      approved_at: "2026-09-16T11:00:00Z",
      approved_by: "user-solo",
      rejection_reason: null,
      notes: null,
      created_at: "2026-09-16T10:00:00Z",
      updated_at: "2026-09-16T12:00:00Z",
      self_segregated_approval: true,
      approver_count_at_approve: 1,
      self_segregated_disbursement: true,
      executor_count_at_disburse: 1,
      created_by: "user-solo",
    };

    const mapped = mapSettlement(raw);
    expect(mapped.selfSegregatedApproval).toBe(true);
    expect(mapped.approverCountAtApprove).toBe(1);
    expect(mapped.selfSegregatedDisbursement).toBe(true);
    expect(mapped.executorCountAtDisburse).toBe(1);
  });

  it("mapea settings con umbral de VoBo y conteos D3′", () => {
    const mapped = mapSettlementSettings({
      vobo_threshold_mxn: 7500,
      active_approver_count: 1,
      active_executor_count: 2,
    });
    expect(mapped.voboThresholdMxn).toBe(7500);
    expect(mapped.activeApproverCount).toBe(1);
    expect(mapped.activeExecutorCount).toBe(2);
  });

  it("rev. 0.2: umbral null = sin autorización por monto; campo ausente cae al default $0", () => {
    const counts = { active_approver_count: 1, active_executor_count: 1 };
    expect(mapSettlementSettings({ ...counts, vobo_threshold_mxn: null }).voboThresholdMxn).toBeNull();
    expect(mapSettlementSettings({ ...counts, vobo_threshold_mxn: 0 }).voboThresholdMxn).toBe(0);
    expect(
      mapSettlementSettings(counts as Parameters<typeof mapSettlementSettings>[0]).voboThresholdMxn,
    ).toBe(0);
  });

  it("H4: sin nombres en la respuesta, la traza queda en null y no en undefined", () => {
    const raw = {
      id: "st-2",
      tenant_id: "tenant-1",
      settlement_number: "LIQ-202608-0002",
      employee_id: "emp-1",
      agreement_snapshot: {},
      period_start: "2026-08-01",
      period_end: "2026-08-15",
      status: "draft",
      total_trips_commission: 0,
      total_base_salary: 0,
      total_reimbursable_expenses: 0,
      total_bonuses: 0,
      total_advances_deducted: 0,
      total_other_deductions: 0,
      gross_amount: 0,
      net_amount: 0,
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
    } satisfies ApiDriverSettlementRaw;

    const mapped = mapSettlement(raw);

    expect(mapped.createdByName).toBeNull();
    expect(mapped.submittedByName).toBeNull();
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
          participant_count: 2,
          operational_outcome: "false_trip",
          has_revenue_split: true,
          distance_basis: "unavailable",
          requires_zero_km_ack: true,
          zero_commission_reason: "zero_km",
        },
      ],
      periodic_block: {
        status: "excluded_contained",
        settlement: {
          settlement_id: "stl-1",
          settlement_number: "LIQ-202608-0001",
          status: "approved",
          period_start: "2026-08-01",
          period_end: "2026-08-15",
        },
        suggested_period_start: null,
      },
      open_advances: [
        {
          advance_id: "adv-1",
          folio: "ANT-001",
          amount: 2000,
          balance_remaining: 1000,
          category: "travel_advance",
          disbursed_at: "2026-08-01T10:00:00Z",
        },
        {
          advance_id: "adv-2",
          folio: "ANT-002",
          amount: 800,
          balance_remaining: 800,
          reserved_amount: 800,
          available_balance: 0,
          reserved_by_settlement_number: "LIQ-202608-0002",
          category: "toll_expense",
          disbursed_at: "2026-08-02T10:00:00Z",
        },
      ],
      deductions: [
        {
          id: "ded-1",
          deduction_type: "savings_fund",
          label: "Fondo de ahorro",
          amount: 200,
          is_mandatory: true,
        },
      ],
      summary: {
        total_commissions: 3150,
        total_base_salary: 3000,
        total_reimbursements: 500,
        total_deductions: 200,
        suggested_advance_deduction: 1000,
        gross_amount: 6650,
        net_amount: 5450,
      },
    };

    const mapped = mapSettlementPreview(raw);

    expect(mapped.employeeName).toBe("Pedro Infante");
    expect(mapped.eligibleTrips).toHaveLength(1);
    expect(mapped.eligibleTrips[0].routeType).toBe("long_haul");
    expect(mapped.eligibleTrips[0].appliedRule).toBe("Tarifa foránea $3.5/km");
    expect(mapped.eligibleTrips[0].freightBase).toBe("commercial_at_complete");
    expect(mapped.eligibleTrips[0].midTripShareRatio).toBe(0.4);
    expect(mapped.eligibleTrips[0].participantCount).toBe(2);
    expect(mapped.eligibleTrips[0].operationalOutcome).toBe("false_trip");
    expect(mapped.eligibleTrips[0].hasRevenueSplit).toBe(true);
    expect(mapped.eligibleTrips[0].distanceBasis).toBe("unavailable");
    expect(mapped.eligibleTrips[0].requiresZeroKmAck).toBe(true);
    expect(mapped.eligibleTrips[0].zeroCommissionReason).toBe("zero_km");
    expect(mapped.periodicBlock).toEqual({
      status: "excluded_contained",
      settlement: {
        settlementId: "stl-1",
        settlementNumber: "LIQ-202608-0001",
        status: "approved",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-15",
      },
      suggestedPeriodStart: null,
    });
    expect(mapped.openAdvances).toHaveLength(2);
    expect(mapped.openAdvances[0]?.reservedBySettlementNumber).toBeNull();
    expect(mapped.openAdvances[1]).toMatchObject({
      availableBalance: 0,
      reservedBySettlementNumber: "LIQ-202608-0002",
    });
    expect(mapped.deductions).toHaveLength(1);
    expect(mapped.deductions?.[0]?.deductionType).toBe("savings_fund");
    expect(mapped.summary.totalBaseSalary).toBe(3000);
    expect(mapped.summary.totalDeductions).toBe(200);
    expect(mapped.summary.netAmount).toBe(5450);
  });

  describe("tope de descuentos contra el bruto", () => {
    const settlementBase = {
      id: "st-cap",
      tenant_id: "tenant-1",
      settlement_number: "LIQ-202610-0100",
      employee_id: "emp-1",
      agreement_snapshot: {},
      period_start: "2026-10-01",
      period_end: "2026-10-07",
      status: "disbursed",
      total_trips_commission: 2000,
      total_base_salary: 0,
      total_reimbursable_expenses: 0,
      total_bonuses: 0,
      total_advances_deducted: 2500,
      total_other_deductions: 0,
      gross_amount: 2000,
      net_amount: 0,
      currency: "MXN",
      disbursed_at: null,
      disbursed_by: null,
      disbursement_method: null,
      disbursement_reference: null,
      approved_at: null,
      approved_by: null,
      rejection_reason: null,
      notes: null,
      created_at: "2026-10-07T18:00:00Z",
      updated_at: "2026-10-07T18:00:00Z",
    } satisfies ApiDriverSettlementRaw;

    it("liquidación: uncovered_deductions_amount → uncoveredDeductionsAmount; ausente = undefined", () => {
      expect(mapSettlement({ ...settlementBase, uncovered_deductions_amount: 500 }).uncoveredDeductionsAmount).toBe(
        500,
      );
      expect(mapSettlement(settlementBase).uncoveredDeductionsAmount).toBeUndefined();
    });

    it("partida de plantilla que no cupo: requestedAmount / omittedAmount en calculationDetails", () => {
      const mapped = mapSettlement({
        ...settlementBase,
        items: [
          {
            id: "item-fund",
            settlement_id: "st-cap",
            item_type: "adjustment",
            trip_id: null,
            trip_expense_id: null,
            advance_id: null,
            description: "Deducción de plantilla: Fondo de ahorro",
            quantity: 1,
            unit_rate: 0,
            amount: 0,
            is_deduction: true,
            calculation_details: {
              source: "template_deduction",
              deduction_type: "savings_fund",
              requested_amount: 300,
              omitted_amount: 300,
            },
            created_at: "2026-10-07T18:00:00Z",
          },
        ],
      });
      expect(mapped.items?.[0]?.amount).toBe(0);
      expect(mapped.items?.[0]?.calculationDetails).toMatchObject({
        source: "template_deduction",
        requestedAmount: 300,
        omittedAmount: 300,
      });
    });

    it("preview: requested/applied/omitted por línea y totalDeductionsOmitted en summary", () => {
      const mapped = mapSettlementPreview({
        employee_id: "emp-1",
        employee_name: "Pedro Infante",
        period_start: "2026-10-01",
        period_end: "2026-10-07",
        agreement: {},
        eligible_trips: [],
        open_advances: [],
        deductions: [
          {
            id: "ded-1",
            deduction_type: "savings_fund",
            label: "Fondo de ahorro",
            amount: 300,
            is_mandatory: true,
            requested_amount: 300,
            applied_amount: 0,
            omitted_amount: 300,
          },
        ],
        summary: {
          total_commissions: 0,
          total_base_salary: 0,
          total_reimbursements: 0,
          total_deductions: 0,
          total_deductions_omitted: 300,
          suggested_advance_deduction: 0,
          gross_amount: 0,
          net_amount: 0,
        },
      });
      expect(mapped.deductions?.[0]).toMatchObject({
        amount: 300,
        requestedAmount: 300,
        appliedAmount: 0,
        omittedAmount: 300,
      });
      expect(mapped.summary.totalDeductions).toBe(0);
      expect(mapped.summary.totalDeductionsOmitted).toBe(300);
    });

    it("preview previo al tope: campos nuevos quedan undefined", () => {
      const mapped = mapSettlementPreview({
        employee_id: "emp-1",
        employee_name: "Pedro Infante",
        period_start: "2026-10-01",
        period_end: "2026-10-07",
        agreement: {},
        eligible_trips: [],
        open_advances: [],
        deductions: [
          { id: "ded-1", deduction_type: "savings_fund", label: "Fondo", amount: 300, is_mandatory: true },
        ],
        summary: {
          total_commissions: 0,
          total_base_salary: 0,
          total_reimbursements: 0,
          suggested_advance_deduction: 0,
          gross_amount: 0,
          net_amount: 0,
        },
      });
      expect(mapped.deductions?.[0]?.appliedAmount).toBeUndefined();
      expect(mapped.summary.totalDeductionsOmitted).toBeUndefined();
    });
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

  describe("D-1 C1 — template_change", () => {
    const rawChange: ApiTemplateChangeInPeriodRaw = {
      templates_count: 2,
      from: {
        assignment_id: "asg-1",
        template_id: "tpl-a",
        template_name: "Operador estándar",
        template_version: 1,
        effective_from: "2026-07-01",
        effective_to: "2026-08-14",
        is_closing: false,
      },
      to: {
        assignment_id: "asg-2",
        template_id: "tpl-b",
        template_name: "Operador estándar",
        template_version: 2,
        effective_from: "2026-08-15",
        effective_to: null,
        is_closing: true,
      },
      assignments: [],
    };
    rawChange.assignments = [rawChange.from, rawChange.to];

    const expectedChange = {
      templatesCount: 2,
      from: {
        assignmentId: "asg-1",
        templateId: "tpl-a",
        templateName: "Operador estándar",
        templateVersion: 1,
        effectiveFrom: "2026-07-01",
        effectiveTo: "2026-08-14",
        isClosing: false,
      },
      to: {
        assignmentId: "asg-2",
        templateId: "tpl-b",
        templateName: "Operador estándar",
        templateVersion: 2,
        effectiveFrom: "2026-08-15",
        effectiveTo: null,
        isClosing: true,
      },
    };

    const rawRow: ApiSettlementBacklogRowRaw = {
      employee_id: "emp-1",
      employee_full_name: "Juan Pérez",
      period_start: "2026-08-01",
      period_end: "2026-08-31",
      pending_trips_count: 2,
      oldest_trip_age_days: 3,
      row_type: "trips_pending",
      warnings: ["template_change_in_period"],
    };

    const rawPreview: ApiSettlementPreviewRaw = {
      employee_id: "emp-1",
      employee_name: "Juan Pérez",
      period_start: "2026-08-01",
      period_end: "2026-08-31",
      agreement: {},
      eligible_trips: [],
      open_advances: [],
      summary: {
        total_commissions: 0,
        total_base_salary: 0,
        total_reimbursements: 0,
        suggested_advance_deduction: 0,
        gross_amount: 0,
        net_amount: 0,
      },
    };

    it("fila de «Por pagar»: snake→camel con effectiveTo null en la asignación abierta", () => {
      const row = mapBacklogRow({ ...rawRow, template_change: rawChange });
      expect(row.warnings).toEqual(["template_change_in_period"]);
      expect(row.templateChange).toEqual({
        ...expectedChange,
        assignments: [expectedChange.from, expectedChange.to],
      });
    });

    it("fila de «Por pagar»: campo ausente (API anterior) o null → null", () => {
      expect(mapBacklogRow(rawRow).templateChange).toBeNull();
      expect(mapBacklogRow({ ...rawRow, template_change: null }).templateChange).toBeNull();
    });

    it("preliquidación: snake→camel", () => {
      const preview = mapSettlementPreview({ ...rawPreview, template_change: rawChange });
      expect(preview.templateChange).toEqual({
        ...expectedChange,
        assignments: [expectedChange.from, expectedChange.to],
      });
    });

    it("preliquidación: campo ausente (API anterior) o null → null", () => {
      expect(mapSettlementPreview(rawPreview).templateChange).toBeNull();
      expect(
        mapSettlementPreview({ ...rawPreview, template_change: null }).templateChange,
      ).toBeNull();
    });
  });

  describe("api#59 — template_superseded", () => {
    const rawSuperseded: ApiTemplateVersionSupersededRaw = {
      template_id: "tpl-v1",
      template_name: "Operador estándar",
      template_version: 1,
      assignment_id: "asg-1",
      superseded_at: "2026-10-03T16:00:00Z",
      replaced_by: { template_id: "tpl-v2", template_name: "Operador estándar", template_version: 2 },
    };

    const expectedSuperseded = {
      templateId: "tpl-v1",
      templateName: "Operador estándar",
      templateVersion: 1,
      assignmentId: "asg-1",
      supersededAt: "2026-10-03T16:00:00Z",
      replacedBy: { templateId: "tpl-v2", templateName: "Operador estándar", templateVersion: 2 },
    };

    const rawRow: ApiSettlementBacklogRowRaw = {
      employee_id: "emp-1",
      employee_full_name: "Juan Pérez",
      period_start: "2026-09-16",
      period_end: "2026-09-30",
      pending_trips_count: 0,
      oldest_trip_age_days: 0,
      row_type: "salary_close",
      warnings: ["template_version_superseded"],
    };

    const rawPreview: ApiSettlementPreviewRaw = {
      employee_id: "emp-1",
      employee_name: "Juan Pérez",
      period_start: "2026-09-16",
      period_end: "2026-09-30",
      agreement: {},
      template: { id: "tpl-v1", name: "Operador estándar", assignment_id: "asg-1" },
      eligible_trips: [],
      open_advances: [],
      summary: {
        total_commissions: 0,
        total_base_salary: 0,
        total_reimbursements: 0,
        suggested_advance_deduction: 0,
        gross_amount: 0,
        net_amount: 0,
      },
    };

    it("fila de «Por pagar»: snake→camel y conserva el código", () => {
      const row = mapBacklogRow({ ...rawRow, template_superseded: rawSuperseded });
      expect(row.warnings).toEqual(["template_version_superseded"]);
      expect(row.templateSuperseded).toEqual(expectedSuperseded);
    });

    it("fila de «Por pagar»: campo ausente (API anterior) o null → null", () => {
      expect(mapBacklogRow(rawRow).templateSuperseded).toBeNull();
      expect(mapBacklogRow({ ...rawRow, template_superseded: null }).templateSuperseded).toBeNull();
    });

    it("replaced_by null (sin versión activa) se conserva como null", () => {
      const row = mapBacklogRow({
        ...rawRow,
        template_superseded: { ...rawSuperseded, replaced_by: null, superseded_at: null },
      });
      expect(row.templateSuperseded).toEqual({
        ...expectedSuperseded,
        supersededAt: null,
        replacedBy: null,
      });
    });

    it("replaced_by con versión menor (v1 reactivada reemplaza a v2) se mapea igual", () => {
      const row = mapBacklogRow({
        ...rawRow,
        template_superseded: {
          ...rawSuperseded,
          template_id: "tpl-v2",
          template_version: 2,
          replaced_by: { template_id: "tpl-v1", template_name: "Operador estándar", template_version: 1 },
        },
      });
      expect(row.templateSuperseded?.templateVersion).toBe(2);
      expect(row.templateSuperseded?.replacedBy?.templateVersion).toBe(1);
    });

    it("sin versión válida no hay texto posible: se trata como ausente", () => {
      const row = mapBacklogRow({
        ...rawRow,
        template_superseded: {
          ...rawSuperseded,
          template_version: undefined as unknown as number,
        },
      });
      expect(row.templateSuperseded).toBeNull();
    });

    it("replaced_by incompleto → null sin descartar el aviso", () => {
      const row = mapBacklogRow({
        ...rawRow,
        template_superseded: {
          ...rawSuperseded,
          replaced_by: { template_id: "tpl-v2", template_name: "", template_version: 2 },
        },
      });
      expect(row.templateSuperseded?.replacedBy).toBeNull();
      expect(row.templateSuperseded?.templateVersion).toBe(1);
    });

    it("preliquidación: template.version, payability y template_superseded", () => {
      const preview = mapSettlementPreview({
        ...rawPreview,
        template: { ...rawPreview.template!, version: 1, payability: "superseded" },
        template_superseded: rawSuperseded,
      });
      expect(preview.template).toEqual({
        id: "tpl-v1",
        name: "Operador estándar",
        assignmentId: "asg-1",
        version: 1,
        payability: "superseded",
      });
      expect(preview.templateSuperseded).toEqual(expectedSuperseded);
    });

    it("preliquidación del API anterior: sin version, payability ni template_superseded", () => {
      const preview = mapSettlementPreview(rawPreview);
      expect(preview.template).toStrictEqual({
        id: "tpl-v1",
        name: "Operador estándar",
        assignmentId: "asg-1",
      });
      expect(preview.templateSuperseded).toBeNull();
    });

    it("preliquidación: payability desconocida se omite", () => {
      const preview = mapSettlementPreview({
        ...rawPreview,
        template: { ...rawPreview.template!, version: 3, payability: "deactivated" },
      });
      expect(preview.template).toStrictEqual({
        id: "tpl-v1",
        name: "Operador estándar",
        assignmentId: "asg-1",
        version: 3,
      });
    });
  });
});
