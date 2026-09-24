import { describe, expect, it } from "vitest";
import { vehiclesCopy } from "./vehiclesCopy";

const BANNED =
  /\$389|\bIVA\b|overage|banda|cupo|tu factura|calculadora/i;

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") {
    acc.push(value);
    return acc;
  }
  if (typeof value === "function") {
    const sample = value("ABC1234", 1);
    if (typeof sample === "string") acc.push(sample);
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, acc);
    return acc;
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) collectStrings(nested, acc);
  }
  return acc;
}

describe("vehiclesCopy.billingPolicy", () => {
  it("ancla la frase de alta (mes completo, tracción)", () => {
    expect(vehiclesCopy.billingPolicy.create).toMatch(/tracción/i);
    expect(vehiclesCopy.billingPolicy.create).toMatch(/mes completo/i);
    expect(vehiclesCopy.billingPolicy.create).toMatch(/mitad de mes/i);
  });

  it("ancla la frase de baja / fuera de servicio (sin crédito)", () => {
    expect(vehiclesCopy.billingPolicy.remove).toMatch(/1\.º del mes siguiente/);
    expect(vehiclesCopy.billingPolicy.remove).toMatch(/no hay crédito/i);
  });

  it("el link va a suscripción sin copy de factura", () => {
    expect(vehiclesCopy.billingPolicy.link).toBe("Ver suscripción");
    expect(vehiclesCopy.billingPolicy.subscriptionHref).toBe(
      "/settings/subscription",
    );
  });

  it("prohíbe montos, IVA, overage, cupo y banda", () => {
    const strings = collectStrings(vehiclesCopy.billingPolicy);
    const offenders = strings.filter((text) => BANNED.test(text));
    expect(offenders).toEqual([]);
  });
});
