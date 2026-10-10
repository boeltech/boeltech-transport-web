import { describe, expect, it } from "vitest";
import type { Client } from "../../domain";
import {
  genericRfcTaxRegimeMismatch,
  isClientTaxIdFormatSuspicious,
} from "./clientDetailGuards";

function client(overrides: Partial<Client>): Client {
  return {
    type: "individual",
    taxId: "XAXX010101000",
    taxRegime: "616",
    cfdiReceptorProfile: "receptor_cfdi",
    ...overrides,
  } as Client;
}

describe("isClientTaxIdFormatSuspicious", () => {
  it.each(["XAXX010101000", "XEXX010101000"])(
    "no marca %s como «RFC incompleto o inválido»",
    (taxId) => {
      expect(isClientTaxIdFormatSuspicious(client({ taxId }))).toBe(false);
      expect(
        isClientTaxIdFormatSuspicious(client({ taxId, type: "company" })),
      ).toBe(false);
    },
  );

  it("sigue marcando un RFC normal con formato inválido", () => {
    expect(
      isClientTaxIdFormatSuspicious(client({ type: "company", taxId: "ABC" })),
    ).toBe(true);
  });
});

describe("genericRfcTaxRegimeMismatch", () => {
  it("detecta XAXX con régimen distinto de 616", () => {
    expect(genericRfcTaxRegimeMismatch(client({ taxRegime: "626" }))).toEqual({
      kind: "national",
      currentTaxRegime: "626",
    });
  });

  it("detecta XEXX con régimen distinto de 616", () => {
    expect(
      genericRfcTaxRegimeMismatch(
        client({ taxId: "XEXX010101000", taxRegime: "601" }),
      ),
    ).toEqual({ kind: "foreign", currentTaxRegime: "601" });
  });

  it.each([
    ["régimen correcto", client({ taxRegime: "616" })],
    ["RFC normal", client({ taxId: "CSA010101AB1", taxRegime: "626" })],
    [
      "cliente solo comercial",
      client({ taxRegime: "626", cfdiReceptorProfile: "comercial_only" }),
    ],
  ])("no aplica con %s", (_label, value) => {
    expect(genericRfcTaxRegimeMismatch(value)).toBeNull();
  });
});
