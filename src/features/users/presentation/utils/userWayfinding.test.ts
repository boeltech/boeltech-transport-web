import { describe, expect, it } from "vitest";
import { MASTER_WAYFINDING_COPY } from "@shared/utils/masterWayfinding";
import { usersCopy } from "../copy/usersCopy";
import { resolveUserBackLabel } from "./userWayfinding";

describe("resolveUserBackLabel", () => {
  it("label del listado filtrado", () => {
    expect(resolveUserBackLabel("/users?status=inactive")).toBe(
      usersCopy.detail.backToList,
    );
  });

  it("label del historial", () => {
    expect(
      resolveUserBackLabel("/users/activity?subjectUserId=u1&period=all"),
    ).toBe(usersCopy.detail.backToActivity);
  });

  it("label desde el dashboard", () => {
    expect(resolveUserBackLabel("/dashboard")).toBe(
      MASTER_WAYFINDING_COPY.backToDashboard,
    );
  });
});
