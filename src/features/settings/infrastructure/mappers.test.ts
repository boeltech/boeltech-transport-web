import { describe, expect, it } from "vitest";
import { mapBillingSettings, type ApiBillingSettingsResponse } from "./mappers";

function buildApiBillingSettings(
  overrides: Partial<ApiBillingSettingsResponse>,
): ApiBillingSettingsResponse {
  return {
    id: "billing-1",
    tenant_id: "tenant-1",
    pac_provider: "profact",
    pac_username: "",
    pac_password_configured: false,
    certificate_configured: false,
    certificate_expiry: null,
    default_uso_cfdi: "G03",
    default_forma_pago: "03",
    default_metodo_pago: "PUE",
    serie_factura: "A",
    folio_inicial: 1,
    folio_actual: 1,
    test_mode: false,
    clave_producto_servicio: "78101800",
    clave_unidad: "E48",
    moneda: "MXN",
    tasa_iva: 0.16,
    serie_carta_porte: "CP",
    folio_inicial_carta_porte: 1,
    folio_actual_carta_porte: 1,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("mapBillingSettings", () => {
  it("normalizes lowercase currency and decimal-string VAT rate from API", () => {
    const api = buildApiBillingSettings({
      moneda: "mxn",
      tasa_iva: "0.1600",
    });

    const mapped = mapBillingSettings(api);

    expect(mapped.moneda).toBe("MXN");
    expect(mapped.tasaIva).toBe(0.16);
  });

  it("falls back to default VAT rate when API rate is invalid", () => {
    const api = buildApiBillingSettings({
      moneda: "usd",
      tasa_iva: "not-a-number",
    });

    const mapped = mapBillingSettings(api);

    expect(mapped.moneda).toBe("USD");
    expect(mapped.tasaIva).toBe(0.16);
  });
});
