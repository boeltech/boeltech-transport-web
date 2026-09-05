import { describe, expect, it } from "vitest";
import {
  buildCorridorMatchKey,
  buildDuplicateCorridorIndex,
  findDuplicateCorridorIdsForPayload,
  normalizeCorridorRefValue,
} from "./corridorMatchKey";
import type { RouteCorridorTariff } from "../../domain/entities";

function corridor(
  overrides: Partial<RouteCorridorTariff> & Pick<RouteCorridorTariff, "id" | "name">,
): RouteCorridorTariff {
  return {
    originRefType: "city_label",
    originRefValue: "Ciudad de México",
    destinationRefType: "city_label",
    destinationRefValue: "Monterrey",
    fixedAmount: 1500,
    notes: null,
    isActive: true,
    ...overrides,
  };
}

describe("corridorMatchKey", () => {
  it("normaliza city_label sin distinguir mayúsculas ni espacios extra", () => {
    expect(normalizeCorridorRefValue("city_label", "  Ciudad   de México ")).toBe(
      "ciudad de méxico",
    );
  });

  it("conserva branch UUID con trim", () => {
    expect(
      normalizeCorridorRefValue("branch", " 11111111-1111-4111-8111-111111111111 "),
    ).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("genera la misma clave para rutas equivalentes", () => {
    const left = buildCorridorMatchKey(
      corridor({
        id: "c1",
        name: "A",
        originRefValue: "ciudad de méxico",
        destinationRefValue: "MONTERREY",
      }),
    );
    const right = buildCorridorMatchKey(
      corridor({
        id: "c2",
        name: "B",
        originRefValue: "Ciudad de México",
        destinationRefValue: "Monterrey",
      }),
    );

    expect(left).toBe(right);
  });

  it("marca ids duplicados en el índice", () => {
    const index = buildDuplicateCorridorIndex([
      corridor({ id: "c1", name: "Uno" }),
      corridor({ id: "c2", name: "Dos" }),
      corridor({
        id: "c3",
        name: "Otro",
        originRefValue: "Guadalajara",
        destinationRefValue: "Tijuana",
      }),
    ]);

    expect(index.duplicateIds.has("c1")).toBe(true);
    expect(index.duplicateIds.has("c2")).toBe(true);
    expect(index.duplicateIds.has("c3")).toBe(false);
  });

  it("excluye el id en edición al buscar duplicados del payload", () => {
    const corridors = [corridor({ id: "c1", name: "Uno" })];

    expect(
      findDuplicateCorridorIdsForPayload(
        corridors,
        {
          originRefType: "city_label",
          originRefValue: "Ciudad de México",
          destinationRefType: "city_label",
          destinationRefValue: "Monterrey",
        },
        "c1",
      ),
    ).toEqual([]);
  });
});
