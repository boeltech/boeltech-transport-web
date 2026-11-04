import { describe, expect, it } from "vitest";
import { BILLING_CADENCE_KINDS } from "../../domain/billingScheme.types";
import { billingSchemesCopy } from "./billingSchemesCopy";

/** Anti-jerga ingeniería en chrome del catálogo (capa A). */
const ENGINEERING_JARGON =
  /billing_scheme|esquema de facturación|periodic_decadal|force_resend|confirm-send|corrida|digest|despachar/i;

function surfaceStrings(): string[] {
  const c = billingSchemesCopy;
  return [
    c.page.title,
    c.page.description,
    c.page.assignmentTip,
    c.page.clientsCta,
    c.page.periodMailCta,
    c.list.title,
    c.list.add,
    c.list.emptyTitle,
    c.list.emptyDescription,
    c.list.emptyCta,
    c.list.defaultBadge,
    c.list.inactiveBadge,
    ...Object.values(c.cadence),
    ...Object.values(c.cadenceOption),
    c.form.createTitle,
    c.form.editTitle,
    c.form.createDescription,
    c.form.editDescription,
    c.form.cadence,
    c.form.cadenceHint,
    c.delete.title,
    c.delete.description,
    c.toast.created,
    c.toast.updated,
    c.toast.deleted,
  ];
}

describe("billingSchemesCopy (F4 capa A)", () => {
  it("chrome usa Frecuencias de envío, no esquemas de facturación", () => {
    expect(billingSchemesCopy.page.title).toBe("Frecuencias de envío");
    expect(billingSchemesCopy.page.title).not.toMatch(/esquema/i);
    expect(billingSchemesCopy.list.title).toBe("Frecuencias");
  });

  it("cadencias en lenguaje patio", () => {
    expect(billingSchemesCopy.cadence.event).toBe("Al vuelo");
    expect(billingSchemesCopy.cadence.periodic_weekly).toBe("Semanal");
    expect(billingSchemesCopy.cadence.periodic_decadal).toBe("Cortes del mes");
    expect(billingSchemesCopy.cadence.periodic_monthly).toBe("Mensual");
  });

  it("opciones del select glosan kinds crudos, no los usan como título solo", () => {
    for (const kind of BILLING_CADENCE_KINDS) {
      const option = billingSchemesCopy.cadenceOption[kind];
      expect(option).toBeTruthy();
      expect(option).not.toBe(kind);
      expect(option).not.toMatch(/^periodic_/);
    }
    expect(billingSchemesCopy.cadenceOption.event).toMatch(/Al vuelo/i);
    expect(billingSchemesCopy.cadenceOption.event).toMatch(/cierra el viaje/i);
    expect(billingSchemesCopy.cadenceOption.periodic_decadal).toMatch(
      /Cortes del mes/i,
    );
  });

  it("empty de primer uso explica el ritmo y CTA crear", () => {
    expect(billingSchemesCopy.list.emptyTitle).toMatch(/frecuencias/i);
    expect(billingSchemesCopy.list.emptyDescription).toMatch(/ritmo/i);
    expect(billingSchemesCopy.list.emptyDescription).toMatch(/al vuelo/i);
    expect(billingSchemesCopy.list.emptyCta).toMatch(/Crear primera frecuencia/i);
  });

  it("atajo a Correo del periodo (sin embeber ritual)", () => {
    expect(billingSchemesCopy.page.periodMailHref).toBe(
      "/finance/dispatch/period",
    );
    expect(billingSchemesCopy.page.periodMailCta).toMatch(/Correo del periodo/i);
    const blob = surfaceStrings().join("\n");
    expect(blob).not.toMatch(/\bMandar\b/);
    expect(blob).not.toMatch(/Armar lista/i);
  });

  it("superficie visible sin jerga de ingeniería", () => {
    for (const text of surfaceStrings()) {
      expect(text).not.toMatch(ENGINEERING_JARGON);
    }
  });
});
