import { describe, expect, it } from "vitest";
import {
  IMPORT_ENTITY_TYPE_LABELS,
  IMPORT_IMPLEMENTED_ENTITY_TYPES,
  IMPORT_OLA_A_ENTITY_TYPES,
  IMPORT_OLA_B_ENTITY_TYPES,
} from "./entities";

describe("import entity registry", () => {
  it("defines Ola B as employees, vehicles, drivers", () => {
    expect([...IMPORT_OLA_B_ENTITY_TYPES]).toEqual([
      "employees",
      "vehicles",
      "drivers",
    ]);
  });

  it("implemented types include Ola A and Ola B", () => {
    for (const type of IMPORT_OLA_A_ENTITY_TYPES) {
      expect(IMPORT_IMPLEMENTED_ENTITY_TYPES).toContain(type);
    }
    for (const type of IMPORT_OLA_B_ENTITY_TYPES) {
      expect(IMPORT_IMPLEMENTED_ENTITY_TYPES).toContain(type);
    }
  });

  it("has non-empty labels for every implemented type", () => {
    for (const type of IMPORT_IMPLEMENTED_ENTITY_TYPES) {
      expect(IMPORT_ENTITY_TYPE_LABELS[type].length).toBeGreaterThan(0);
    }
  });
});
