import { describe, expect, it } from "vitest";
import type { ClientAddressApiResponse } from "../domain";
import {
  mapClientAddress,
  mapClientAddressFromApi,
  mapClientAddressList,
} from "./mappers";

const snakeAddress: ClientAddressApiResponse = {
  id: "addr-1",
  tenant_id: "tenant-1",
  client_id: "client-1",
  address_type: "shipping",
  is_primary: true,
  is_active: true,
  location_name: "CEDIS Norte",
  sat_country_code: "MEX",
  sat_state_code: "JAL",
  sat_municipality_code: "039",
  postal_code: "44100",
  street: "Av. Test",
  exterior_number: "100",
  interior_number: null,
  reference: null,
  rfc_remitente_destinatario: "XAXX010101000",
  nombre_remitente_destinatario: "ACME SA",
  carta_porte: {
    remitente_rfc: null,
    remitente_name: null,
    contact_name: "Juan",
    contact_phone: "3312345678",
    contact_email: null,
    business_hours: null,
    special_instructions: null,
  },
  address: "Av. Test 100",
  city: "Guadalajara",
  state: "Jalisco",
  country: "MEX",
  latitude: 20.67,
  longitude: -103.34,
  contact_name: null,
  contact_phone: null,
  contact_email: null,
  business_hours: null,
  notes: null,
  special_instructions: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
  created_by: null,
  updated_by: null,
};

describe("client address mappers (mapSingleResponse + camelCase)", () => {
  it("mapClientAddress mapea envelope único a dominio", () => {
    const { data } = mapClientAddress({ data: snakeAddress });
    expect(data.id).toBe("addr-1");
    expect(data.tenantId).toBe("tenant-1");
    expect(data.clientId).toBe("client-1");
    expect(data.satStateCode).toBe("JAL");
    expect(data.contactName).toBe("Juan");
    expect(data.latitude).toBe(20.67);
  });

  it("mapClientAddressList mapea envelope de lista", () => {
    const items = mapClientAddressList({ data: [snakeAddress] });
    expect(items).toHaveLength(1);
    expect(items[0]?.locationName).toBe("CEDIS Norte");
    expect(items[0]?.satMunicipalityCode).toBe("039");
  });

  it("mapClientAddressFromApi acepta objeto snake sin envelope", () => {
    const domain = mapClientAddressFromApi(snakeAddress);
    expect(domain.nombreRemitenteDestinatario).toBe("ACME SA");
  });

  it("usa fallback legacy sat_estado_code cuando falta sat_state_code", () => {
    const legacy = {
      ...snakeAddress,
      sat_state_code: null,
      sat_estado_code: "NLE",
    };
    const { data } = mapClientAddress({ data: legacy });
    expect(data.satStateCode).toBe("NLE");
  });
});
