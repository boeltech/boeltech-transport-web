import { describe, expect, it } from "vitest";
import {
  buildOverlayErrorToastDescription,
  formatGroupedWarningDescription,
  isInlineOverlayError,
  OVERLAY_ERROR_INLINE_THRESHOLD,
  resolveToastDuration,
  TOAST_DURATION_DEFAULT_MS,
  TOAST_DURATION_ERROR_LONG_MS,
  TOAST_DURATION_ERROR_SHORT_MS,
  TOAST_DURATION_ERROR_VERY_LONG_MS,
} from "./overlayErrorFeedback";

describe("overlayErrorFeedback", () => {
  it("usa mensaje completo en toast cuando es corto", () => {
    const short = "a".repeat(OVERLAY_ERROR_INLINE_THRESHOLD);
    expect(buildOverlayErrorToastDescription(short, "Ver formulario")).toBe(short);
    expect(isInlineOverlayError(short)).toBe(false);
  });

  it("usa copy inline cuando el mensaje es largo", () => {
    const long = "a".repeat(OVERLAY_ERROR_INLINE_THRESHOLD + 1);
    expect(buildOverlayErrorToastDescription(long, "Ver formulario")).toBe(
      "Ver formulario",
    );
    expect(isInlineOverlayError(long)).toBe(true);
  });

  it("agrupa warnings en una sola description (D6)", () => {
    expect(formatGroupedWarningDescription(["Uno"])).toBe("Uno");
    expect(formatGroupedWarningDescription(["Uno", "Dos"])).toBe(
      "1. Uno\n2. Dos",
    );
  });

  it("unifica duración: éxito/info/warning = 4s", () => {
    expect(resolveToastDuration("success", undefined)).toBe(
      TOAST_DURATION_DEFAULT_MS,
    );
    expect(resolveToastDuration("info", "detalle")).toBe(
      TOAST_DURATION_DEFAULT_MS,
    );
    expect(resolveToastDuration("warning", "aviso")).toBe(
      TOAST_DURATION_DEFAULT_MS,
    );
  });

  it("unifica duración de error: corto / largo / muy largo", () => {
    expect(resolveToastDuration("error", "corto")).toBe(
      TOAST_DURATION_ERROR_SHORT_MS,
    );
    expect(
      resolveToastDuration(
        "error",
        "a".repeat(OVERLAY_ERROR_INLINE_THRESHOLD + 1),
      ),
    ).toBe(TOAST_DURATION_ERROR_LONG_MS);
    expect(
      resolveToastDuration(
        "error",
        "a".repeat(OVERLAY_ERROR_INLINE_THRESHOLD * 2 + 1),
      ),
    ).toBe(TOAST_DURATION_ERROR_VERY_LONG_MS);
  });

  it("toastError(msgLargo) mide el title cuando no hay description", () => {
    const long = "a".repeat(OVERLAY_ERROR_INLINE_THRESHOLD + 1);
    expect(resolveToastDuration("error", undefined, undefined, long)).toBe(
      TOAST_DURATION_ERROR_LONG_MS,
    );
    expect(resolveToastDuration("error", long)).toBe(
      TOAST_DURATION_ERROR_LONG_MS,
    );
  });

  it("respeta duración explícita", () => {
    expect(resolveToastDuration("error", "x", 10_000)).toBe(10_000);
  });
});
