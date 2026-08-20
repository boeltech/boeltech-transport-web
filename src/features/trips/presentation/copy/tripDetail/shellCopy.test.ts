import { describe, expect, it } from "vitest";

import { shellCopy } from "./shellCopy";

function flattenCopy(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "function") {
    try {
      return String((value as (arg: never) => unknown)("x" as never));
    } catch {
      return "";
    }
  }
  if (value && typeof value === "object") {
    return Object.values(value).map(flattenCopy).join("\n");
  }
  return "";
}

describe("shellCopy — léxico operativo (Capa 1 D8)", () => {
  const visible = flattenCopy({
    alert: shellCopy.alert,
    action: shellCopy.action,
    tab: shellCopy.tab,
    readiness: {
      title: shellCopy.readiness.title,
      titleScheduled: shellCopy.readiness.titleScheduled,
      scheduleGroup: shellCopy.readiness.scheduleGroup,
      operateGroup: shellCopy.readiness.operateGroup,
    },
  });

  it("no usa CFDI, UUID, SAT ni timbrar en superficie", () => {
    expect(visible).not.toMatch(/\bCFDI\b/);
    expect(visible).not.toMatch(/\bUUID\b/i);
    expect(visible).not.toMatch(/\bSAT\b/);
    expect(visible).not.toMatch(/timbrar/i);
    expect(visible).not.toMatch(/Carta Porte/i);
  });

  it("nombra el menú secundario Más", () => {
    expect(shellCopy.action.more).toBe("Más");
  });
});
