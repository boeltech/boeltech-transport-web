import { describe, expect, it } from "vitest";

import { billingCopy } from "../copy/tripDetail/billingCopy";
import {
  fiscalAttentionMutationTitle,
  isFleetFiscalAttentionMutation,
} from "./fiscalAttentionMutationCopy";

describe("fiscalAttentionMutationTitle", () => {
  it("mapea stop_replan al copy PRD", () => {
    expect(fiscalAttentionMutationTitle("stop_replan")).toBe(
      "Se reordenaron las escalas",
    );
  });

  it("cubre kinds conocidos del PRD", () => {
    expect(fiscalAttentionMutationTitle("stops")).toBe(
      billingCopy.pendientes.mutationKinds.stops,
    );
    expect(fiscalAttentionMutationTitle("route")).toBe(
      billingCopy.pendientes.mutationKinds.stops,
    );
    expect(fiscalAttentionMutationTitle("cargo")).toBe(
      billingCopy.pendientes.mutationKinds.cargo,
    );
    expect(fiscalAttentionMutationTitle("fleet")).toBe(
      billingCopy.pendientes.mutationKinds.fleet,
    );
    expect(fiscalAttentionMutationTitle("reassignment")).toBe(
      billingCopy.pendientes.mutationKinds.fleet,
    );
    expect(fiscalAttentionMutationTitle("base_rate")).toBe(
      billingCopy.pendientes.mutationKinds.base_rate,
    );
    expect(fiscalAttentionMutationTitle("unknown")).toBe(
      billingCopy.pendientes.mutationKinds.unknown,
    );
  });

  it("kinds desconocidos caen a unknown (sin mostrar el código)", () => {
    expect(fiscalAttentionMutationTitle("weird_code")).toBe(
      billingCopy.pendientes.mutationKinds.unknown,
    );
    expect(fiscalAttentionMutationTitle("weird_code")).not.toMatch(/weird/i);
  });

  it("no expone jerga técnica en ningún label", () => {
    const labels = [
      "stop_replan",
      "stops",
      "cargo",
      "fleet",
      "base_rate",
      "unknown",
      "otro",
    ].map(fiscalAttentionMutationTitle);
    for (const label of labels) {
      expect(label).not.toMatch(/stop_replan|Mutación|CFDI|base_rate|_/i);
    }
  });
});

describe("isFleetFiscalAttentionMutation", () => {
  it("solo fleet / reassignment", () => {
    expect(isFleetFiscalAttentionMutation("fleet")).toBe(true);
    expect(isFleetFiscalAttentionMutation("reassignment")).toBe(true);
    expect(isFleetFiscalAttentionMutation("stop_replan")).toBe(false);
    expect(isFleetFiscalAttentionMutation("cargo")).toBe(false);
    expect(isFleetFiscalAttentionMutation(null)).toBe(false);
  });
});

describe("billingCopy cobro / pendientes action", () => {
  it("substituteHint sin REP aislado", () => {
    expect(billingCopy.cobroRail.substituteHint).toMatch(/cobros/i);
    expect(billingCopy.cobroRail.substituteHint).toMatch(/sustituta/i);
    expect(billingCopy.cobroRail.substituteHint).not.toMatch(/\bREP\b/);
  });

  it("cuerpos de acción single vs split", () => {
    expect(billingCopy.pendientes.actionBody).toMatch(/Sustituye la factura/i);
    expect(billingCopy.pendientes.actionBodySplit).toMatch(
      /cada porción ya facturada/i,
    );
  });
});
