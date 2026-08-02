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
    test_mode: false,
    clave_producto_servicio: "78101800",
    clave_unidad: "E48",
    moneda: "MXN",
    tasa_iva: 0.16,
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

  it("expone el consecutivo real que envía el servidor", () => {
    const mapped = mapBillingSettings(
      buildApiBillingSettings({ serie_factura: "A", next_folio: 51 }),
    );

    expect(mapped.nextFolio).toBe(51);
  });

  it("deja el consecutivo en null si el servidor no lo envía", () => {
    const mapped = mapBillingSettings(buildApiBillingSettings({}));

    expect(mapped.nextFolio).toBeNull();
  });

  it("expone hasIssuedInvoices cuando el servidor lo envía", () => {
    const mapped = mapBillingSettings(
      buildApiBillingSettings({ has_issued_invoices: true }),
    );

    expect(mapped.hasIssuedInvoices).toBe(true);
  });

  it("asume hasIssuedInvoices=false si el servidor no lo envía", () => {
    const mapped = mapBillingSettings(buildApiBillingSettings({}));

    expect(mapped.hasIssuedInvoices).toBe(false);
  });
});
