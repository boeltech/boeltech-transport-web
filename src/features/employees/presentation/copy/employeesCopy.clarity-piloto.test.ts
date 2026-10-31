import { describe, expect, it } from "vitest";
import { employeesCopy } from "./employeesCopy";

describe("employeesCopy — F2 claridad piloto (sueldo ≠ nómina operativa)", () => {
  it("retira «Importe base registrado en nómina» del contexto del corte", () => {
    expect(employeesCopy.detail.stat.baseSalary.description).not.toMatch(
      /registrado en nómina/i,
    );
    expect(employeesCopy.detail.stat.baseSalary.description).toMatch(
      /corte operativo/i,
    );
    expect(employeesCopy.detail.stat.baseSalary.description).toMatch(
      /no es recibo de nómina/i,
    );
  });

  it("tab Compensación alinea frecuencia al corte operativo", () => {
    expect(employeesCopy.detail.section.compensation.description).toMatch(
      /corte operativo/i,
    );
    expect(employeesCopy.detail.section.banking.description).not.toMatch(
      /dispersión de nómina/i,
    );
  });
});
