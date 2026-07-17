import { describe, expect, it } from "vitest";
import { BranchStatus } from "../../domain";
import type { BranchListItem } from "../../domain";
import {
  getBranchExportHeaders,
  mapBranchesToCsvRows,
} from "./branchExportHelpers";

const sampleBranch: BranchListItem = {
  id: "branch-1",
  code: "MTY-01",
  name: "Sucursal Monterrey",
  status: BranchStatus.ACTIVE,
  isMain: true,
  city: "Monterrey",
  state: "Nuevo León",
  phone: "8181818181",
  isActive: true,
  createdAt: new Date("2026-06-01T12:00:00.000Z"),
};

describe("branchExportHelpers", () => {
  it("returns Spanish CSV headers", () => {
    expect(getBranchExportHeaders()).toEqual([
      "Código",
      "Nombre",
      "Estado",
      "Principal",
      "Ciudad",
      "Estado (domicilio)",
      "Teléfono",
      "Fecha de alta",
    ]);
  });

  it("maps branch list items to CSV rows", () => {
    const [row] = mapBranchesToCsvRows([sampleBranch]);

    expect(row).toEqual([
      "MTY-01",
      "Sucursal Monterrey",
      "Activa",
      "Sí",
      "Monterrey",
      "Nuevo León",
      "8181818181",
      "2026-06-01T12:00:00.000Z",
    ]);
  });

  it("uses empty phone and No for non-main branches", () => {
    const [row] = mapBranchesToCsvRows([
      {
        ...sampleBranch,
        isMain: false,
        phone: null,
        status: BranchStatus.INACTIVE,
      },
    ]);

    expect(row[3]).toBe("No");
    expect(row[6]).toBe("");
    expect(row[2]).toBe("Inactiva");
  });
});
