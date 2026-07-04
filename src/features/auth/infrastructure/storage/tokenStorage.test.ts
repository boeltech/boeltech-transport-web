import { beforeEach, describe, expect, it } from "vitest";
import {
  consumeFreshLoginSession,
  markFreshLoginSession,
} from "./tokenStorage";

describe("fresh login session flag", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("marks and consumes fresh login once", () => {
    expect(consumeFreshLoginSession()).toBe(false);

    markFreshLoginSession();
    expect(consumeFreshLoginSession()).toBe(true);
    expect(consumeFreshLoginSession()).toBe(false);
  });
});
