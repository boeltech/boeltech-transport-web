import { describe, expect, it } from "vitest";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  findEmployeeNameById,
  resolveEmployeeFilterChipLabel,
} from "./resolveEmployeeFilterChipLabel";

describe("resolveEmployeeFilterChipLabel", () => {
  it("usa el nombre cuando está disponible", () => {
    expect(resolveEmployeeFilterChipLabel({ name: "Ana López" })).toBe(
      settlementsCopy.workbench.chip.employee("Ana López"),
    );
  });

  it("fallback sin UUID cuando no hay nombre", () => {
    expect(resolveEmployeeFilterChipLabel()).toBe(
      settlementsCopy.workbench.chip.employeeFallback,
    );
    expect(resolveEmployeeFilterChipLabel({ name: "  " })).toBe(
      settlementsCopy.workbench.chip.employeeFallback,
    );
    expect(resolveEmployeeFilterChipLabel({ name: null })).toBe(
      settlementsCopy.workbench.chip.employeeFallback,
    );
  });
});

describe("findEmployeeNameById", () => {
  it("resuelve el nombre desde la lista cargada", () => {
    expect(
      findEmployeeNameById("emp-1", [
        { employeeId: "emp-2", employeeFullName: "Otro" },
        { employeeId: "emp-1", employeeFullName: "Pedro Infante" },
      ]),
    ).toBe("Pedro Infante");
  });

  it("devuelve undefined si no hay match o el nombre está vacío", () => {
    expect(findEmployeeNameById("emp-1", [])).toBeUndefined();
    expect(
      findEmployeeNameById("emp-1", [
        { employeeId: "emp-1", employeeFullName: "  " },
      ]),
    ).toBeUndefined();
  });
});
