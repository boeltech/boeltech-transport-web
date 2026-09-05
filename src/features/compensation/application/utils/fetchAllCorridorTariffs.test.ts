import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAllCorridorTariffs } from "./fetchAllCorridorTariffs";
import type { RouteCorridorTariff } from "../../domain/entities";

const mockListCorridors = vi.fn();

vi.mock("../../infrastructure/compensationApi", () => ({
  compensationApi: {
    listCorridors: (...args: unknown[]) => mockListCorridors(...args),
  },
}));

function corridor(id: string, name: string): RouteCorridorTariff {
  return {
    id,
    name,
    originRefType: "city_label",
    originRefValue: "Ciudad de México",
    destinationRefType: "city_label",
    destinationRefValue: "Monterrey",
    fixedAmount: 1500,
    notes: null,
    isActive: true,
  };
}

describe("fetchAllCorridorTariffs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pagina hasta agotar todas las páginas", async () => {
    mockListCorridors
      .mockResolvedValueOnce({
        data: [corridor("cor-1", "Uno")],
        pagination: { page: 1, limit: 100, total: 2, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        data: [corridor("cor-2", "Dos")],
        pagination: { page: 2, limit: 100, total: 2, totalPages: 2 },
      });

    const result = await fetchAllCorridorTariffs();

    expect(result).toHaveLength(2);
    expect(result.map((row) => row.id)).toEqual(["cor-1", "cor-2"]);
    expect(mockListCorridors).toHaveBeenCalledTimes(2);
    expect(mockListCorridors.mock.calls[0]?.[0]).toMatchObject({
      page: 1,
      pageSize: 100,
    });
    expect(mockListCorridors.mock.calls[1]?.[0]).toMatchObject({
      page: 2,
      pageSize: 100,
    });
  });
});
