import { afterEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import {
  getHelpScreenExtrasSnapshot,
  resetHelpScreenExtrasStoreForTests,
  useMergedHelpScreen,
} from "@features/help-center/application";
import { usePublishTripHelpScreenExtras } from "./usePublishTripHelpScreenExtras";

afterEach(() => {
  resetHelpScreenExtrasStoreForTests();
});

function wrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    );
  };
}

describe("usePublishTripHelpScreenExtras — CB-INJ-7", () => {
  it("publishes status extras without writing status= to location.search", () => {
    const { result } = renderHook(
      () => {
        usePublishTripHelpScreenExtras({
          tripStatus: "draft",
          activeTab: "overview",
          tripLoaded: true,
        });
        const location = useLocation();
        const merged = useMergedHelpScreen();
        return { search: location.search, merged };
      },
      {
        wrapper: wrapper(
          "/trips/a1b2c3d4-e5f6-7890-abcd-ef1234567890?tab=overview",
        ),
      },
    );

    expect(result.current.search).not.toMatch(/(^|[?&])status=/);
    expect(result.current.search).toBe("?tab=overview");
    expect(getHelpScreenExtrasSnapshot()).toEqual({ status: "draft" });
    expect(result.current.merged).toContain("status=draft");
    expect(result.current.merged).toContain("tab=overview");
  });

  it("clears extras on unmount", () => {
    const { unmount } = renderHook(
      () =>
        usePublishTripHelpScreenExtras({
          tripStatus: "scheduled",
          activeTab: "tracking",
          tripLoaded: true,
        }),
      { wrapper: wrapper("/trips/x") },
    );
    expect(getHelpScreenExtrasSnapshot()).toEqual({ status: "scheduled" });
    act(() => {
      unmount();
    });
    expect(getHelpScreenExtrasSnapshot()).toEqual({});
  });
});
