import { describe, expect, it } from "vitest";
import { navigationConfig } from "../model/navigation";
import { navigationCopy } from "./navigationCopy";

describe("navigationCopy", () => {
  it("uses correct Spanish accents in shell labels", () => {
    expect(navigationCopy.item.vehicles).toBe("Vehículos");
    expect(navigationCopy.item.usersActivity).toBe("Auditoría");
    expect(navigationCopy.item.settings).toBe("Configuración");
    expect(navigationCopy.group.admin).toBe("Administración");
    expect(navigationCopy.badge.comingSoon).toBe("Próximamente");
  });

  it("does not contain mojibake plus-sign corruption", () => {
    const allStrings = JSON.stringify(navigationCopy);
    expect(allStrings).not.toMatch(/[A-Za-z]\+[A-Za-z]/);
  });

  it("wires copy into navigationConfig labels and badges", () => {
    const labels = navigationConfig.flatMap((group) =>
      group.items.map((item) => item.label),
    );
    const badges = navigationConfig.flatMap((group) =>
      group.items
        .map((item) => item.badge)
        .filter((badge): badge is string => typeof badge === "string"),
    );

    expect(labels).toContain("Vehículos");
    expect(labels).toContain("Auditoría");
    expect(labels).toContain("Configuración");
    expect(badges).toContain("Próximamente");
  });
});
