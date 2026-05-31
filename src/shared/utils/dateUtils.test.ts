import { describe, expect, it } from "vitest";

import {
  formatDateTime,
  formatDateTimeFromLocalInput,
  localInputToUtcIso,
} from "./dateUtils";

describe("formatDateTimeFromLocalInput", () => {
  it("muestra la misma hora civil que el input datetime-local del wizard", () => {
    const localInput = "2026-05-28T18:55";
    const displayed = formatDateTimeFromLocalInput(localInput);
    const viaUtc = formatDateTime(localInputToUtcIso(localInput));

    expect(displayed).toBe(viaUtc);
    expect(displayed).toMatch(/28 may 2026/i);
    expect(displayed).toMatch(/6:55/i);
  });

  it("delega en formatDateTime cuando el valor ya trae zona UTC", () => {
    const iso = "2026-05-29T00:55:00.000Z";
    expect(formatDateTimeFromLocalInput(iso)).toBe(formatDateTime(iso));
  });
});
