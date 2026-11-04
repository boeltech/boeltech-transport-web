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

  it("mapea embed finkok_registration_enabled + finkok_emitter", () => {
    const mapped = mapBillingSettings(
      buildApiBillingSettings({
        finkok_registration_enabled: true,
        finkok_emitter: {
          status: "ready",
          detail: null,
          checked_at: "2026-10-23T15:00:00.000Z",
          taxpayer_id: "AAA010101AAA",
          registration_enabled: true,
        },
      }),
    );

    expect(mapped.finkokRegistrationEnabled).toBe(true);
    expect(mapped.finkokEmitter).toEqual({
      status: "ready",
      detail: null,
      checkedAt: "2026-10-23T15:00:00.000Z",
      taxpayerId: "AAA010101AAA",
      registrationEnabled: true,
    });
  });

  it("flag off y sin embed → no exige RFC en dominio", () => {
    const mapped = mapBillingSettings(buildApiBillingSettings({}));

    expect(mapped.finkokRegistrationEnabled).toBe(false);
    expect(mapped.finkokEmitter).toBeNull();
  });

  it("mapea metadata de certificado CSD (F4/F5)", () => {
    const mapped = mapBillingSettings(
      buildApiBillingSettings({
        certificate_configured: true,
        certificate_kind: "csd",
        certificate_serial: "30001000000500003416",
        certificate_fingerprint_sha256: "a".repeat(64),
        certificate_classified_at: "2026-11-02T20:50:34.000Z",
      }),
    );

    expect(mapped.certificateKind).toBe("csd");
    expect(mapped.certificateSerial).toBe("30001000000500003416");
    expect(mapped.certificateFingerprintSha256).toBe("a".repeat(64));
    expect(mapped.certificateClassifiedAt).toBe("2026-11-02T20:50:34.000Z");
  });

  it("kind ausente o inválido → null (legado no verificado)", () => {
    expect(
      mapBillingSettings(buildApiBillingSettings({})).certificateKind,
    ).toBeNull();
    expect(
      mapBillingSettings(
        buildApiBillingSettings({ certificate_kind: "weird" }),
      ).certificateKind,
    ).toBeNull();
  });
});
