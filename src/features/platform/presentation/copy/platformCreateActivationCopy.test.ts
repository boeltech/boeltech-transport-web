import { describe, expect, it } from "vitest";
import { platformCopy } from "./platformCopy";

describe("platform create activation copy", () => {
  it("states password is offline and not emailed", () => {
    const { notice, hints } = platformCopy.tenants.create;
    expect(notice.description).toMatch(/no va en el correo/i);
    expect(notice.description).toMatch(/activación/i);
    expect(hints.adminPassword).toMatch(/no se envía por correo/i);
  });
});
