import { describe, expect, it } from "vitest";

import { resolveFiscalAttentionAlertSlot } from "./resolveFiscalAttentionAlertSlot";

describe("resolveFiscalAttentionAlertSlot", () => {
  it("falseTrip gana aunque hubiera parcial (precedencia PD3)", () => {
    expect(
      resolveFiscalAttentionAlertSlot({
        mode: "falseTrip",
        freightHasPartialSubstitution: true,
      }),
    ).toBe("falseTrip");
  });

  it("midTrip + activeReplacement → partialSubstitution (no midTrip)", () => {
    expect(
      resolveFiscalAttentionAlertSlot({
        mode: "midTrip",
        freightHasPartialSubstitution: true,
      }),
    ).toBe("partialSubstitution");
  });

  it("midTrip sin parcial → midTrip", () => {
    expect(
      resolveFiscalAttentionAlertSlot({
        mode: "midTrip",
        freightHasPartialSubstitution: false,
      }),
    ).toBe("midTrip");
  });

  it("postCancel no usa parcial", () => {
    expect(
      resolveFiscalAttentionAlertSlot({
        mode: "postCancel",
        freightHasPartialSubstitution: true,
      }),
    ).toBe("postCancel");
  });

  it("none → none", () => {
    expect(
      resolveFiscalAttentionAlertSlot({
        mode: "none",
        freightHasPartialSubstitution: true,
      }),
    ).toBe("none");
  });

  it("PD1: la firma no recibe visibilidad de consola (coexistencia)", () => {
    // Regression guard: if a console gate returns, this arity breaks typecheck/callers.
    const slot = resolveFiscalAttentionAlertSlot({
      mode: "midTrip",
      freightHasPartialSubstitution: false,
    });
    expect(slot).toBe("midTrip");
    expect(resolveFiscalAttentionAlertSlot).toHaveLength(1);
  });
});
