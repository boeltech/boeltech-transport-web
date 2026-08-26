import { describe, expect, it } from "vitest";
import type { ClientApiResponse, ClientListItemApiResponse } from "../domain";
import {
  mapClient,
  mapClientFromApi,
  mapPaginatedClients,
  toApiCreateClient,
  toApiUpdateClient,
} from "./mappers";

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
  billing_scheme_id: "scheme-1",
  invoice_auto_dispatch_enabled: false,
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
    expect(data.billingSchemeId).toBe("scheme-1");
    expect(data.invoiceAutoDispatchEnabled).toBe(false);
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

  it("mapPaginatedClients prefiere primary_contact sobre phone/email flat", () => {
    const withPrimary: ClientListItemApiResponse = {
      ...snakeListItem,
      phone: "1111111111",
      email: "legacy@acme.test",
      primary_contact: {
        id: "pc-1",
        full_name: "Ana Pérez",
        phone: "5512345678",
        email: "ana@acme.test",
        is_primary: true,
      },
    };
    const result = mapPaginatedClients({
      data: [withPrimary],
      pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    });
    const item = result.data[0];
    expect(item?.primaryContact).toEqual({
      id: "pc-1",
      fullName: "Ana Pérez",
      phone: "5512345678",
      email: "ana@acme.test",
    });
    expect(item?.phone).toBe("5512345678");
    expect(item?.email).toBe("ana@acme.test");
  });

  it("mapPaginatedClients cae a phone/email legacy si no hay primary_contact", () => {
    const result = mapPaginatedClients({
      data: [snakeListItem],
      pagination: { page: 1, limit: 10, total: 1, total_pages: 1 },
    });
    expect(result.data[0]?.phone).toBe("3312345678");
    expect(result.data[0]?.email).toBe("ops@acme.test");
    expect(result.data[0]?.primaryContact).toBeUndefined();
  });

  it("mapClientFromApi acepta objeto snake sin envelope", () => {
    const client = mapClientFromApi(snakeClient);
    expect(client.paymentTerms).toBe("credit");
    expect(client.creditDays).toBe(30);
  });
});

describe("toApiCreateClient", () => {
  it("no envía campos de contacto legacy; conserva billing_email", () => {
    const payload = toApiCreateClient({
      type: "company",
      legalName: "Acme SA",
      taxId: "AAA010101AAA",
      taxRegime: "601",
      paymentTerms: "cash",
      contactName: "Ana",
      contactPosition: "Compras",
      phone: "5512345678",
      secondaryPhone: "5599999999",
      email: "ana@acme.test",
      billingEmail: "billing@acme.test",
    });
    expect(payload).not.toHaveProperty("contact_name");
    expect(payload).not.toHaveProperty("contact_position");
    expect(payload).not.toHaveProperty("phone");
    expect(payload).not.toHaveProperty("secondary_phone");
    expect(payload).not.toHaveProperty("email");
    expect(payload.billing_email).toBe("billing@acme.test");
  });
});

describe("toApiUpdateClient", () => {
  it("incluye credit_limit: null para limpiar límite", () => {
    expect(toApiUpdateClient({ creditLimit: null })).toEqual({
      credit_limit: null,
    });
  });

  it("incluye trade_name/notes/billing_email null", () => {
    expect(
      toApiUpdateClient({
        tradeName: null,
        notes: null,
        billingEmail: null,
      }),
    ).toEqual({
      trade_name: null,
      notes: null,
      billing_email: null,
    });
  });

  it("incluye billing_scheme_id null para limpiar esquema", () => {
    expect(toApiUpdateClient({ billingSchemeId: null })).toEqual({
      billing_scheme_id: null,
    });
  });

  it("envía billing_scheme_id uuid", () => {
    expect(
      toApiUpdateClient({ billingSchemeId: "11111111-1111-4111-8111-111111111111" }),
    ).toEqual({
      billing_scheme_id: "11111111-1111-4111-8111-111111111111",
    });
  });

  it("envía invoice_auto_dispatch_enabled", () => {
    expect(toApiUpdateClient({ invoiceAutoDispatchEnabled: true })).toEqual({
      invoice_auto_dispatch_enabled: true,
    });
  });

  it("omite credit_limit en patch parcial solo isActive", () => {
    expect(toApiUpdateClient({ isActive: true })).toEqual({
      is_active: true,
    });
  });

  it("envía credit_limit numérico", () => {
    expect(toApiUpdateClient({ creditLimit: 10000 })).toEqual({
      credit_limit: 10000,
    });
  });

  it("no envía contactos legacy aunque vengan en el DTO", () => {
    expect(
      toApiUpdateClient({
        contactName: "Ana",
        contactPosition: "Compras",
        phone: "5512345678",
        secondaryPhone: null,
        email: "ana@acme.test",
        billingEmail: "billing@acme.test",
      }),
    ).toEqual({
      billing_email: "billing@acme.test",
    });
  });
});
