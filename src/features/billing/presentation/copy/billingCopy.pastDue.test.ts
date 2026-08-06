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
  });
});
