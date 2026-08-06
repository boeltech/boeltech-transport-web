import { describe, expect, it } from "vitest";

import { notificationSettingsCopy } from "./notificationSettingsCopy";

describe("notificationSettingsCopy", () => {
  it("no usa léxico de canales stub ni 'inbox' en cadenas visibles", () => {
    const visible = JSON.stringify(notificationSettingsCopy);
    expect(visible).not.toMatch(/\bpush\b/i);
    expect(visible).not.toMatch(/\bSMS\b/);
    expect(visible).not.toMatch(/\binbox\b/i);
    expect(visible).not.toMatch(/panel de operación/i);
  });

  it("usa el nombre de producto Avisos de la empresa", () => {
    expect(notificationSettingsCopy.page.title).toBe("Avisos de la empresa");
    expect(notificationSettingsCopy.nav.label).toBe("Avisos de la empresa");
  });
});
