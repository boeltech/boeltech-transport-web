import { describe, expect, it } from "vitest";
import type { BillingSettings, CompanySettings } from "../../domain";
import { buildSettingsHubReadiness } from "./settingsHubReadiness";

const companyReady = {
  legalName: "Transportes Demo SA",
  rfc: "TDE010101AAA",
  regimenFiscal: "601",
  fiscalAddress: { postalCode: "06600" },
} as CompanySettings;

const billingReady = {
  certificateConfigured: true,
  certificateExpiry: "2099-01-01T00:00:00.000Z",
  serieFactura: "A",
  folioInicial: 1,
} as BillingSettings;

const billingPending = {
  certificateConfigured: false,
  certificateExpiry: null,
  serieFactura: "",
  folioInicial: 0,
} as BillingSettings;

describe("buildSettingsHubReadiness", () => {
  it("builds identity + billing chips when data is ready", () => {
    const items = buildSettingsHubReadiness({
      company: companyReady,
      billing: billingReady,
      canReadCompany: true,
      canReadBilling: true,
    });

    expect(items).toEqual([
      expect.objectContaining({
        id: "identity",
        status: "ok",
        href: "/settings/general",
      }),
      expect.objectContaining({
        id: "billing",
        status: "ok",
        href: "/settings/billing",
      }),
    ]);
  });

  it("marks billing empty when certificate is missing", () => {
    const items = buildSettingsHubReadiness({
      company: companyReady,
      billing: billingPending,
      canReadCompany: true,
      canReadBilling: true,
    });

    expect(items.find((i) => i.id === "billing")?.status).toBe("empty");
  });

  it("omits chips the user cannot read", () => {
    const items = buildSettingsHubReadiness({
      company: companyReady,
      billing: billingReady,
      canReadCompany: false,
      canReadBilling: false,
    });
    expect(items).toEqual([]);
  });
});
