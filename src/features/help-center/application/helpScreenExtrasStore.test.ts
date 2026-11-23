import { afterEach, describe, expect, it } from "vitest";
import {
  getHelpScreenExtrasSnapshot,
  publishHelpScreenExtras,
  resetHelpScreenExtrasStoreForTests,
  subscribeHelpScreenExtras,
} from "./helpScreenExtrasStore";

afterEach(() => {
  resetHelpScreenExtrasStoreForTests();
});

describe("helpScreenExtrasStore", () => {
  it("publishes and clears by owner", () => {
    publishHelpScreenExtras("trip-detail", { status: "draft" });
    expect(getHelpScreenExtrasSnapshot()).toEqual({ status: "draft" });

    publishHelpScreenExtras("trip-detail", null);
    expect(getHelpScreenExtrasSnapshot()).toEqual({});
  });

  it("later owners overwrite the same key", () => {
    publishHelpScreenExtras("a", { status: "draft", tab: "x" });
    publishHelpScreenExtras("b", { status: "scheduled" });
    expect(getHelpScreenExtrasSnapshot()).toEqual({
      status: "scheduled",
      tab: "x",
    });
  });

  it("notifies subscribers on change", () => {
    let calls = 0;
    const unsubscribe = subscribeHelpScreenExtras(() => {
      calls += 1;
    });
    publishHelpScreenExtras("trip-detail", { status: "draft" });
    publishHelpScreenExtras("trip-detail", { status: "scheduled" });
    publishHelpScreenExtras("trip-detail", null);
    unsubscribe();
    expect(calls).toBe(3);
  });
});
