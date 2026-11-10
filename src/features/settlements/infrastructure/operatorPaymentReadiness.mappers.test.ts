import { describe, expect, it } from "vitest";
import {
  mapListOperatorsResponse,
  mapOperatorPaymentReadiness,
  type ApiOperatorPaymentReadinessRaw,
} from "./mappers";

const readyRaw: ApiOperatorPaymentReadinessRaw = {
  employee_id: "emp-1",
  full_name: "Juan Pérez",
  employment_type: "permanent",
  status: "ready",
  template: {
    id: "tpl-1",
    name: "Foráneo estándar",
    version: 1,
    effective_from: "2026-09-01",
    payability: "active",
  },
  salary: { amount: 2500, period: "weekly" },
  has_clabe: true,
  open_advances_count: 1,
  open_advances_balance: 3000,
  attention_reasons: [],
};

describe("mapOperatorPaymentReadiness", () => {
  it("mapea snake_case → camelCase sin filtrar CLABE completa", () => {
    const row = mapOperatorPaymentReadiness(readyRaw);
    expect(row).toEqual({
      employeeId: "emp-1",
      fullName: "Juan Pérez",
      employmentType: "permanent",
      status: "ready",
      template: {
        id: "tpl-1",
        name: "Foráneo estándar",
        version: 1,
        effectiveFrom: "2026-09-01",
        payability: "active",
      },
      salary: { amount: 2500, period: "weekly" },
      hasClabe: true,
      openAdvancesCount: 1,
      openAdvancesBalance: 3000,
      attentionReasons: [],
    });
    expect(row).not.toHaveProperty("bankClabe");
    expect(row).not.toHaveProperty("clabe");
  });

  it("mapea estados de atención y salary null", () => {
    const row = mapOperatorPaymentReadiness({
      ...readyRaw,
      status: "no_template",
      template: null,
      salary: { amount: null, period: null },
      has_clabe: false,
      open_advances_count: 0,
      open_advances_balance: 0,
      attention_reasons: ["no_template", "no_clabe"],
    });
    expect(row.status).toBe("no_template");
    expect(row.template).toBeNull();
    expect(row.salary).toEqual({ amount: null, period: null });
    expect(row.hasClabe).toBe(false);
    expect(row.attentionReasons).toEqual(["no_template", "no_clabe"]);
  });

  it("mapListOperatorsResponse pagina con page_size", () => {
    const result = mapListOperatorsResponse({
      data: [readyRaw],
      pagination: {
        page: 2,
        page_size: 25,
        total: 41,
        total_pages: 2,
      },
    });
    expect(result.data).toHaveLength(1);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 25,
      total: 41,
      totalPages: 2,
    });
  });
});
