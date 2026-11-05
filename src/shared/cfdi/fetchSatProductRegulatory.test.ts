import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@shared/api/client/apiClient";

import { fetchRegulatoryFlagsForSatProductCp } from "./fetchSatProductRegulatory";

vi.mock("@shared/api/client/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe("fetchRegulatoryFlagsForSatProductCp", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it("clasifica material_peligroso 0,1 del body crudo como declare_optional", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        code: "50202200",
        name: "Bebidas alcohólicas",
        metadata: { material_peligroso: "0,1" },
      },
    });

    const flags = await fetchRegulatoryFlagsForSatProductCp("50202200");

    expect(flags.materialPeligrosoRequirement).toBe("declare_optional");
  });
});
