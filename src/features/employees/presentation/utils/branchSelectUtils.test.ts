import { describe, expect, it } from "vitest";
import { BranchStatus } from "@features/branches";
import { buildBranchSelectOptionsWithEligibility } from "./branchSelectUtils";

describe("buildBranchSelectOptionsWithEligibility", () => {
  const branches = [
    {
      id: "main",
      code: "QRO-01",
      name: "Matriz",
      status: BranchStatus.ACTIVE,
      isMain: true,
      city: "QRO",
      state: "QRO",
      phone: null,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "sec-2",
      code: "QRO-02",
      name: "Secundaria 2",
      status: BranchStatus.ACTIVE,
      isMain: false,
      city: "QRO",
      state: "QRO",
      phone: null,
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "sec-3",
      code: "QRO-03",
      name: "Secundaria 3",
      status: BranchStatus.ACTIVE,
      isMain: false,
      city: "QRO",
      state: "QRO",
      phone: null,
      isActive: true,
      createdAt: new Date(),
    },
  ];

  it("filters to eligible branches when over quota", () => {
    const options = buildBranchSelectOptionsWithEligibility(branches, ["main"], undefined);

    expect(options.map((option) => option.value)).toEqual(["main"]);
  });

  it("keeps current branch in edit mode even if outside plan", () => {
    const options = buildBranchSelectOptionsWithEligibility(
      branches,
      ["main"],
      "sec-2",
    );

    expect(options.map((option) => option.value)).toEqual(["main", "sec-2"]);
    expect(options.find((option) => option.value === "sec-2")?.label).toContain(
      "fuera de plan",
    );
  });
});
