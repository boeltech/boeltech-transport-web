import { describe, expect, it } from "vitest";
import {
  buildOverlayErrorToastDescription,
  OVERLAY_ERROR_INLINE_THRESHOLD,
} from "./overlayErrorFeedback";

describe("overlayErrorFeedback", () => {
  it("usa mensaje completo en toast cuando es corto", () => {
    const short = "a".repeat(OVERLAY_ERROR_INLINE_THRESHOLD);
    expect(buildOverlayErrorToastDescription(short, "Ver formulario")).toBe(short);
  });

  it("usa copy inline cuando el mensaje es largo", () => {
    const long = "a".repeat(OVERLAY_ERROR_INLINE_THRESHOLD + 1);
    expect(buildOverlayErrorToastDescription(long, "Ver formulario")).toBe(
      "Ver formulario",
    );
  });
});
