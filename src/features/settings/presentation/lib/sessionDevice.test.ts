import { describe, expect, it } from "vitest";
import type { AuthSessionItem } from "@features/auth";
import {
  describeUserAgent,
  formatRevokeOthersDescription,
  formatSessionWhen,
  formatSpanishNaturalList,
  sortSessionsCurrentFirst,
} from "./sessionDevice";

function session(
  partial: Partial<AuthSessionItem> & Pick<AuthSessionItem, "id" | "current">,
): AuthSessionItem {
  return {
    createdAt: "2026-11-18T15:02:00.000Z",
    lastUsedAt: null,
    expiresAt: "2026-12-01T00:00:00.000Z",
    userAgent: null,
    ip: null,
    label: null,
    ...partial,
  };
}

describe("sessionDevice", () => {
  it("describeUserAgent maps Chrome on Windows without exposing raw UA", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    expect(describeUserAgent(ua)).toBe("Chrome · Windows");
  });

  it("describeUserAgent maps Safari on iOS", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
    expect(describeUserAgent(ua)).toBe("Safari · iOS");
  });

  it("formatSessionWhen returns Ahora for recent activity", () => {
    const now = Date.parse("2026-11-21T12:00:00.000Z");
    expect(
      formatSessionWhen("2026-11-21T11:59:30.000Z", now),
    ).toBe("Ahora");
  });

  it("sortSessionsCurrentFirst puts current first", () => {
    const sorted = sortSessionsCurrentFirst([
      session({ id: "a", current: false }),
      session({ id: "b", current: true }),
      session({ id: "c", current: false }),
    ]);
    expect(sorted.map((s) => s.id)).toEqual(["b", "a", "c"]);
  });

  it("formatSpanishNaturalList joins 2–3 items", () => {
    expect(formatSpanishNaturalList(["Safari · iOS", "Microsoft Edge · Windows"])).toBe(
      "Safari · iOS y Microsoft Edge · Windows",
    );
    expect(
      formatSpanishNaturalList(["A", "B", "C"]),
    ).toBe("A, B y C");
  });

  it("formatRevokeOthersDescription uses singular for N=1", () => {
    expect(formatRevokeOthersDescription(["Chrome · Windows"])).toBe(
      "Chrome · Windows tendrá que volver a iniciar sesión. Esta sesión sigue abierta.",
    );
  });

  it("formatRevokeOthersDescription lists 2–3 distinct labels", () => {
    expect(
      formatRevokeOthersDescription([
        "Safari · iOS",
        "Microsoft Edge · Windows",
      ]),
    ).toBe(
      "Safari · iOS y Microsoft Edge · Windows tendrán que volver a iniciar sesión. Esta sesión sigue abierta.",
    );
    expect(
      formatRevokeOthersDescription(["A · X", "B · Y", "C · Z"]),
    ).toBe(
      "A · X, B · Y y C · Z tendrán que volver a iniciar sesión. Esta sesión sigue abierta.",
    );
  });

  it("formatRevokeOthersDescription uses count when N>3 or labels repeat", () => {
    expect(
      formatRevokeOthersDescription(Array.from({ length: 22 }, () => "Chrome · Windows")),
    ).toBe(
      "Las otras 22 sesiones tendrán que volver a iniciar sesión. Esta sesión sigue abierta.",
    );
    expect(
      formatRevokeOthersDescription(["Chrome · Windows", "Chrome · Windows"]),
    ).toBe(
      "Las otras 2 sesiones tendrán que volver a iniciar sesión. Esta sesión sigue abierta.",
    );
  });
});
