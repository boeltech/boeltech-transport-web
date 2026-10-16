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

function flattenCopy(value: unknown): string {
  if (typeof value === "function") return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(flattenCopy).join("\n");
  if (value && typeof value === "object") {
    return Object.values(value).map(flattenCopy).join("\n");
  }
  return "";
}

const visitorFacingBlob = flattenCopy({
  nav: landingCopy.nav,
  hero: {
    ...landingCopy.hero,
    badgeOpen: undefined,
  },
  trust: landingCopy.trust,
  product: landingCopy.product,
  evidence: landingCopy.evidence,
  pricing: landingCopy.pricing,
  faq: landingCopy.faq,
  cta: landingCopy.cta,
  footer: landingCopy.footer,
});

const allCopyBlob = flattenCopy(landingCopy);

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
    expect(landingCopy.pricing.subtitle.toLowerCase()).toMatch(
      /sin cargo fijo de cuenta/,
    );
    expect(landingCopy.pricing.priceHint.toLowerCase()).toMatch(
      /sin cargo fijo de cuenta/,
    );
    expect(landingCopy.pricing.priceHintClosed.toLowerCase()).toMatch(
      /sin cargo fijo de cuenta/,
    );
    expect(flattenCopy(landingCopy.pricing)).not.toMatch(/fee de cuenta/i);
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

describe("landingCopy visitor MX (D6–D13)", () => {
  it("uses tuteo Pagas, not voseo Pagás", () => {
    expect(landingCopy.pricing.subtitle).toMatch(/Pagas /);
    expect(allCopyBlob).not.toMatch(/Pagás/);
  });

  it("trial hint mentions Micro and does not say cualquier plan", () => {
    expect(landingCopy.hero.trialHint).toMatch(/Micro/);
    expect(landingCopy.hero.trialHint).not.toMatch(/cualquier plan/i);
  });

  it("keeps a single trial verb Probar gratis across nav, hero, cards and close CTA", () => {
    expect(landingCopy.nav.register).toBe("Probar gratis");
    expect(landingCopy.hero.ctaPrimaryOpen).toBe("Probar gratis");
    expect(landingCopy.pricing.cta).toBe("Probar gratis");
    expect(landingCopy.cta.primary).toBe("Probar gratis");
  });

  it("omits Opcionales from nav copy (deep link stays via pricing footnote)", () => {
    expect(
      "optionals" in landingCopy.nav
        ? (landingCopy.nav as { optionals?: string }).optionals
        : undefined,
    ).toBeUndefined();
    expect(landingCopy.optionals.id).toBe("opcionales");
    expect(landingCopy.pricing.optionalsLink).toBe("Ver opcionales");
  });

  it("bridges optionals with section-level En preparación copy", () => {
    expect(landingCopy.optionals.title).toMatch(/mismo núcleo/i);
    expect(landingCopy.optionals.subtitle.toLowerCase()).toMatch(
      /núcleo operativo/,
    );
    expect(landingCopy.optionals.badge).toBe("En preparación");
    expect(landingCopy.optionals.footnote).toMatch(/Configuración → Tu plan/);
  });

  it("exposes optionalsLink from copy (no hardcoded Ver opcionales)", () => {
    expect(landingCopy.pricing.optionalsLink).toBe("Ver opcionales");
  });

  it("drops ERP jargon, paywall and closed-for-now phrasing", () => {
    expect(visitorFacingBlob).not.toMatch(/Wizard/);
    expect(visitorFacingBlob).not.toMatch(/Hub de aprobaciones/);
    expect(visitorFacingBlob).not.toMatch(/7 roles/);
    expect(visitorFacingBlob).not.toMatch(/Flota orientativa/);
    expect(allCopyBlob).not.toMatch(/paywall/i);
    expect(allCopyBlob).not.toMatch(/cerrado por ahora/i);
  });

  it("keeps SAT versions and the mexican invoicing aria", () => {
    expect(landingCopy.trust.ariaLabel).toBe("Facturación fiscal mexicana");
    expect(landingCopy.trust.items.map((item) => item.label)).toEqual([
      "CFDI 4.0",
      "Carta Porte 3.1",
      "REP",
    ]);
    expect(landingCopy.trust.items.map((item) => item.hint)).toEqual([
      "Timbrado con tu sello",
      "Va con el viaje",
      "Al registrar el pago",
    ]);
  });

  it("puts Equipo de apoyo in the core Viajes card, not in optionals", () => {
    const viajes = landingCopy.product.items.find((item) => item.title === "Viajes");
    expect(viajes?.bullets).toContain("Equipo de apoyo y su compensación");
    expect(landingCopy.optionals.items).toHaveLength(3);
    expect(landingCopy.optionals.items.map((item) => item.title)).toEqual([
      "Combustible",
      "Mantenimiento",
      "Seguimiento GPS",
    ]);
    expect(flattenCopy(landingCopy.optionals.items)).not.toMatch(/Equipo de apoyo/);
    expect(flattenCopy(landingCopy.optionals.items)).not.toMatch(/paywall/i);
  });

  it("replaces product jargon with visitor labels", () => {
    const bullets = landingCopy.product.items.flatMap((item) => item.bullets);
    expect(bullets).toContain("Alta de viaje por pasos");
    expect(bullets).toContain("Roles y permisos para oficina, patio y finanzas");
    expect(bullets).toContain("Aprobaciones de gastos y operación");
    expect(landingCopy.pricing.featureLabels.fleet).toBe("Motrices");
    expect(landingCopy.pricing.featureLabels.l0).toBe("Núcleo incluido");
  });

  it("F3 pricing: patio frame copy without catalog SaaS tone", () => {
    expect(landingCopy.pricing.title.toLowerCase()).toMatch(/flota|motriz|banda/);
    expect(landingCopy.pricing.subtitle.toLowerCase()).toMatch(/flota/);
    expect(landingCopy.pricing.fleetSelector.hint.toLowerCase()).toMatch(
      /flota|banda/,
    );
    expect(landingCopy.pricing.familyLabel).toBe("Operación");
    expect(landingCopy.pricing.popularBadge).toBe("Más elegido");
  });
});

describe("landingCopy F3 conversion (evidence / FAQ / fleet selector)", () => {
  it("anchors evidence at #evidencia and nav label Cómo funciona", () => {
    expect(landingCopy.evidence.id).toBe("evidencia");
    expect(landingCopy.nav.product).toBe("Cómo funciona");
    expect(landingCopy.product.items).toHaveLength(4);
    expect(landingCopy.product.items.map((i) => i.title)).toEqual([
      "Flota",
      "Viajes",
      "Clientes y personal",
      "Facturación y finanzas",
    ]);
  });

  it("exposes fleet selector bands mapped to SoT plan codes only", () => {
    const { fleetSelector } = landingCopy.pricing;
    expect(fleetSelector.label).toMatch(/motrices/i);
    expect(fleetSelector.options.map((o) => o.planCode)).toEqual([
      "operacion_micro",
      "operacion_pequena",
      "operacion_mediana",
      "operacion_grande",
    ]);
    expect(fleetSelector.defaultOptionId).toBe("6-30");
  });

  it("keeps FAQ facts aligned to SoT without inventing post-trial prices", () => {
    expect(landingCopy.faq.id).toBe("faq");
    expect(landingCopy.faq.items.length).toBeGreaterThanOrEqual(5);
    expect(landingCopy.faq.items.length).toBeLessThanOrEqual(6);
    const blob = flattenCopy(landingCopy.faq);
    expect(blob).toMatch(/CSD/);
    expect(blob).toMatch(/14 días/);
    expect(blob).toMatch(/motriz/);
    expect(blob).toMatch(/sin cargo fijo de cuenta/i);
    expect(blob).toMatch(/opcionales/i);
    expect(blob).toMatch(/ventas/i);
    expect(blob).not.toMatch(/\$\s?\d{2,}/);
    expect(blob).not.toMatch(/−\s?15%|-15%/);
    const optionalsFaq = landingCopy.faq.items.find((i) =>
      i.question.toLowerCase().includes("combustible"),
    );
    expect(optionalsFaq && "linkHref" in optionalsFaq).toBe(true);
    if (optionalsFaq && "linkHref" in optionalsFaq) {
      expect(optionalsFaq.linkHref).toBe("#opcionales");
    }
  });
});
