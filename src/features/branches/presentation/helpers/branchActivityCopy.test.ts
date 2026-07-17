import { describe, expect, it } from "vitest";
import {
  formatBranchActivityAction,
  summarizeBranchActivityPayload,
} from "./branchActivityCopy";

describe("branchActivityCopy", () => {
  it("formats known actions", () => {
    expect(formatBranchActivityAction("branch_created")).toBe("Sucursal creada");
    expect(formatBranchActivityAction("branch_deleted")).toBe("Sucursal eliminada");
  });

  it("summarizes update payload with changed fields", () => {
    const summary = summarizeBranchActivityPayload("branch_updated", {
      code: "QRO-01",
      name: "Sucursal Norte",
      status: "inactive",
      fields: ["name", "status", "address"],
    });

    expect(summary).toContain("Código: QRO-01");
    expect(summary).toContain("Nombre: Sucursal Norte");
    expect(summary).toContain("Estatus: Inactiva");
    expect(summary).toContain("Dirección");
  });

  it("summarizes deleted payload", () => {
    const summary = summarizeBranchActivityPayload("branch_deleted", {
      code: "QRO-02",
      name: "Sucursal Sur",
    });

    expect(summary).toBe("Código: QRO-02 · Nombre: Sucursal Sur");
  });
});
