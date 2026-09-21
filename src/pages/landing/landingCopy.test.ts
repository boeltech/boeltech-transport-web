import { describe, expect, it } from "vitest";
import { OPERATIONAL_PLAN_CATALOG } from "@shared/commercial/operationalPlanCatalog";
import { landingCopy } from "./landingCopy";

const SOT_V5_CODES = [
  "operacion_micro",
  "operacion_pequena",
  "operacion_mediana",
  "operacion_grande",
] as const;

const LEGACY_V3_CODES = [
  "operacion_esencial",
  "operacion_crecimiento",
  "operacion_escala",
  "operacion_corporativo",
] as const;

describe("landingCopy pricing SoT v5", () => {
  it("marks Pequeña as popular (not Crecimiento)", () => {
    expect(landingCopy.pricing.popularCode).toBe("operacion_pequena");
  });

  it("keys audiences to micro|pequena|mediana|grande only", () => {
    expect(Object.keys(landingCopy.pricing.audiences).sort()).toEqual(
      [...SOT_V5_CODES].sort(),
    );
    for (const code of LEGACY_V3_CODES) {
      expect(landingCopy.pricing.audiences[code]).toBeUndefined();
    }
  });

  it("pitches motriz capacity without fee and without annual −15%", () => {
    expect(landingCopy.pricing.subtitle.toLowerCase()).toMatch(/motriz/);
    expect(landingCopy.pricing.subtitle.toLowerCase()).toMatch(/sin fee/);
    expect(landingCopy.pricing.annualNote).not.toMatch(/−\s?15%|-15%/);
    expect(landingCopy.pricing.annualNote.toLowerCase()).toMatch(/ventas/);
  });

  it("does not use Esencial/Crecimiento/Escala/Corporativo labels", () => {
    const blob = JSON.stringify(landingCopy.pricing);
    expect(blob).not.toMatch(/Esencial|Crecimiento|Escala|Corporativo/);
  });

  it("exposes quote CTA for Grande and stamps/motriz label", () => {
    expect(landingCopy.pricing.ctaQuote).toMatch(/cotizaci/i);
    expect(landingCopy.pricing.featureLabels.stamps.toLowerCase()).toMatch(
      /motriz/,
    );
    expect(landingCopy.pricing.featureLabels.history).toBeTruthy();
  });
});

describe("landing pricing catalog consumer (F1 formatter shape)", () => {
  it("catalog cards expose $/motriz (never flat $749 / $0) and quote for Grande", () => {
    const [micro, pequena, mediana, grande] = OPERATIONAL_PLAN_CATALOG;
    expect(micro!.pricePeriod).toBe("/motriz · mes");
    expect(pequena!.pricePeriod).toBe("/motriz · mes");
    expect(mediana!.pricePeriod).toBe("/motriz · mes");
    expect(micro!.priceAmount).toMatch(/\$\s?389/);
    expect(pequena!.priceAmount).toMatch(/\$\s?319/);
    expect(mediana!.priceAmount).toMatch(/\$\s?299/);
    for (const plan of [micro, pequena, mediana]) {
      expect(plan!.priceAmount).not.toMatch(/\$\s?0\b/);
      expect(plan!.priceAmount).not.toMatch(/\$\s?749/);
      expect(plan!.stampsBadge).toBe("30");
      expect(plan!.historyLabel).toBeTruthy();
    }
    expect(grande!.priceAmount).toBe("Cotización");
    expect(grande!.pricePeriod).toBe("");
  });

  it("audiences cover every catalog code (PricingSection lookup)", () => {
    for (const plan of OPERATIONAL_PLAN_CATALOG) {
      expect(landingCopy.pricing.audiences[plan.code]).toBeTruthy();
    }
    expect(landingCopy.pricing.popularCode).toBe(
      OPERATIONAL_PLAN_CATALOG.find((p) => p.code === "operacion_pequena")!
        .code,
    );
  });
});
