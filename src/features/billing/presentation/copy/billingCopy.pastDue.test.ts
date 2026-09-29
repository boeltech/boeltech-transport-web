import { describe, expect, it } from "vitest";
import { billingCopy } from "../copy/billingCopy";

describe("billingCopy pastDue (PD3)", () => {
  it("does not promise automatic pause", () => {
    const withDeadline = billingCopy.notices.pastDue.description("15 ago 2026");
    const withoutDeadline = billingCopy.notices.pastDue.description("");

    for (const text of [withDeadline, withoutDeadline]) {
      expect(text.toLowerCase()).not.toContain("pausará");
      expect(text.toLowerCase()).not.toContain("se pausar");
      expect(text.toLowerCase()).not.toContain("automátic");
    }
  });

  it("keeps operate-normally messaging and Boeltech contact framing", () => {
    const text = billingCopy.notices.pastDue.description("15 ago 2026");
    expect(text).toContain("operando y facturando");
    expect(text).toContain("Boeltech");
  });
});

describe("billingCopy arrears + costs (ADR-0072 · D3/D4)", () => {
  it("does not promise automatic pause in legacy arrears notice copy", () => {
    const text = billingCopy.notices.arrears.description({
      totalLabel: "$2,154.24",
      periodsLabel: "jul 2026",
      dueOrOverdueLabel: "Vence el 15 ago 2026.",
    });
    expect(text.toLowerCase()).not.toContain("pausará");
    expect(text.toLowerCase()).not.toContain("se pausar");
    expect(text.toLowerCase()).not.toContain("automátic");
  });

  it("costs copy uses operative month framing without system jargon", () => {
    expect(billingCopy.costs.title).toBe("Este mes");
    expect(billingCopy.costs.disclaimer.toLowerCase()).not.toContain(
      "fuera del sistema",
    );
    expect(billingCopy.costs.disclaimer.toLowerCase()).toContain("correo");
    expect(billingCopy.arrears.columns.period).toBe("Mes");
    expect(billingCopy.costs.description.toLowerCase()).not.toContain("q ×");
    expect(billingCopy.plan.fields.qFact).toBe("Motrizes cobrables");
    expect(billingCopy.plan.fields.qFact).not.toMatch(/\bQ\b/);
  });
});

describe("billingCopy saasInvoiceHistory", () => {
  it("uses tenant charge copy without CFDI/flete except the disclaimer", () => {
    const copy = billingCopy.saasInvoiceHistory;
    expect(copy.title).toBe("Cargos de tu suscripción");
    expect(copy.description).toMatch(/saldo pendiente/i);
    expect(copy.columns.period).toBe("Mes");
    expect(copy.columns.status).toBe("Estado");
    expect(copy.columns.amount).toBe("Monto");
    expect(copy.columns.collected).toBe("Cobrado");
    expect(copy.columns.method).toBe("Cómo");
    expect(copy.status.paid).toBe("Pagado");
    expect(copy.status.void).toBe("Anulado");
    expect(copy.methods.stripe).toBe("Tarjeta");
    expect(copy.methods.card_external).toBe("Tarjeta");
    expect(copy.methods.spei).toBe("Transferencia");
    expect(copy.methods.manual).toBe("Manual");
    expect(copy.methods.other).toBe("Otro");
    expect(copy.emptyTitle).toBe("Aún no hay cargos cobrados");
    expect(copy.empty).toMatch(/estimado de este mes/i);
    expect(copy.footer).toMatch(/Tlamx/);
    expect(copy.footer).toMatch(/flete/);

    const body = [
      copy.title,
      copy.description,
      copy.emptyTitle,
      copy.empty,
      ...Object.values(copy.columns),
      ...Object.values(copy.status),
    ].join(" ");
    expect(body).not.toMatch(/CFDI/i);
    expect(body).not.toMatch(/flete/i);
  });
});

describe("billingCopy Stripe-B auto-charge", () => {
  it("uses Tlamx subscription cargo copy without CFDI/flete", () => {
    expect(billingCopy.arrears.autoChargeFailed).toBe(
      "No se pudo cobrar la tarjeta",
    );
    expect(billingCopy.arrears.autoChargeRequiresAction).toBe(
      "Tu banco pide confirmación",
    );
    expect(billingCopy.paymentMethods.autoChargeHint).toMatch(/Tlamx/);
    expect(billingCopy.paymentMethods.autoChargeHint).toMatch(
      /transferencia/i,
    );
    expect(billingCopy.arrears.autoChargeFailedHint).not.toMatch(/CFDI|flete/i);
    expect(billingCopy.arrears.autoChargeRequiresActionHint).not.toMatch(
      /CFDI|flete/i,
    );
    expect(billingCopy.paymentMethods.autoChargeHint).not.toMatch(/CFDI|flete/i);
  });
});
