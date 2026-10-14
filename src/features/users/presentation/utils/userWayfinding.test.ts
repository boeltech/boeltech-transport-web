import { describe, expect, it } from "vitest";
import { MASTER_WAYFINDING_COPY } from "@shared/utils/masterWayfinding";
import { usersCopy } from "../copy/usersCopy";
import {
  isUsersCreateQuery,
  resolveUserBackLabel,
  usersCreatePath,
} from "./userWayfinding";

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

describe("usersCreatePath (D10)", () => {
  it("deep-link abre Sheet en listado", () => {
    expect(usersCreatePath()).toBe("/users?create=1");
    expect(isUsersCreateQuery("1")).toBe(true);
    expect(isUsersCreateQuery("true")).toBe(true);
    expect(isUsersCreateQuery("0")).toBe(false);
  });
});
