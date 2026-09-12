import { describe, expect, it } from "vitest";
import {
  parseStartMileageInput,
  resolveSuggestedEndMileage,
  resolveSuggestedStartMileage,
} from "./startTripMileage";

describe("resolveSuggestedStartMileage", () => {
  it("prioriza kilometraje actual del vehiculo", () => {
    expect(resolveSuggestedStartMileage(125_000, 120_000)).toBe(125_000);
  });

  it("usa start_mileage del viaje si no hay vehiculo", () => {
    expect(resolveSuggestedStartMileage(undefined, 120_000)).toBe(120_000);
  });

  it("acepta 0 km del vehículo como sugerencia", () => {
    expect(resolveSuggestedStartMileage(0, null)).toBe(0);
  });
});

describe("resolveSuggestedEndMileage", () => {
  it("suma km inicial + distancia total del viaje", () => {
    expect(resolveSuggestedEndMileage(3200, 450.4)).toBe(3650);
  });

  it("sin distancia cae al km inicial", () => {
    expect(resolveSuggestedEndMileage(3200, null)).toBe(3200);
    expect(resolveSuggestedEndMileage(3200, 0)).toBe(3200);
  });

  it("sin km inicial no sugiere", () => {
    expect(resolveSuggestedEndMileage(undefined, 100)).toBeUndefined();
    expect(resolveSuggestedEndMileage(null, 100)).toBeUndefined();
  });
});

describe("parseStartMileageInput", () => {
  it("parsea enteros no negativos", () => {
    expect(parseStartMileageInput("150000")).toBe(150_000);
    expect(parseStartMileageInput("0")).toBe(0);
  });

  it("rechaza vacio o invalido", () => {
    expect(parseStartMileageInput("")).toBeNull();
    expect(parseStartMileageInput("-1")).toBeNull();
    expect(parseStartMileageInput("abc")).toBeNull();
  });
});
