import { describe, expect, it } from "vitest";
import type { ClientApiResponse, ClientListItemApiResponse } from "../domain";
import { mapClient, mapClientFromApi, mapPaginatedClients } from "./mappers";

const snakeListItem: ClientListItemApiResponse = {
  id: "c-1",
  client_code: "CLI-001",
  type: "company",
  legal_name: "Transportes ACME",
  trade_name: "ACME",
  tax_id: "XAXX010101000",
  phone: "3312345678",
  email: "ops@acme.test",
  payment_terms: "credit",
  credit_days: 30,
  credit_limit: 50000,
  is_active: true,
};

const snakeClient: ClientApiResponse = {
  ...snakeListItem,
  tenant_id: "tenant-1",
  tax_regime: "601",
  contact_name: "Ana",
  contact_position: "Compras",
  secondary_phone: null,
  billing_email: "billing@acme.test",
  notes: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
  created_by: null,
  updated_by: null,
  created_by_name: null,
  updated_by_name: null,
};

describe("client mappers (mapSingleResponse / mapPaginatedResponse)", () => {
  it("mapClient mapea envelope único a dominio", () => {
    const { data } = mapClient({ data: snakeClient });
    expect(data.tenantId).toBe("tenant-1");
    expect(data.clientCode).toBe("CLI-001");
    expect(data.contactName).toBe("Ana");
    expect(data.billingEmail).toBe("billing@acme.test");
  });

  it("mapPaginatedClients mapea lista paginada", () => {
    const result = mapPaginatedClients({
      data: [snakeListItem],
      pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.legalName).toBe("Transportes ACME");
    expect(result.pagination.totalPages).toBe(1);
  });

  it("mapClientFromApi acepta objeto snake sin envelope", () => {
    const client = mapClientFromApi(snakeClient);
    expect(client.paymentTerms).toBe("credit");
    expect(client.creditDays).toBe(30);
  });
});
