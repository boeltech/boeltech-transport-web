import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigationType } from "react-router-dom";
import type { ReactNode } from "react";
import { useTabParam } from "./useTabParam";

const TABS = ["summary", "team", "history"] as const;

function wrapperFor(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
  };
}

function renderTabParam(initialEntry: string) {
  return renderHook(
    () => ({
      tab: useTabParam(TABS, "summary"),
      location: useLocation(),
      navigationType: useNavigationType(),
    }),
    { wrapper: wrapperFor(initialEntry) },
  );
}

describe("useTabParam", () => {
  it("resolves the active tab from the URL", () => {
    const { result } = renderTabParam("/branches/b-1?tab=team");

    expect(result.current.tab.activeTab).toBe("team");
  });

  it("falls back to the default tab for missing or unknown values", () => {
    expect(renderTabParam("/branches/b-1").result.current.tab.activeTab).toBe(
      "summary",
    );
    expect(
      renderTabParam("/branches/b-1?tab=nope").result.current.tab.activeTab,
    ).toBe("summary");
  });

  it("writes the tab into the URL and keeps other params", () => {
    const { result } = renderTabParam("/branches/b-1?period=30d");

    act(() => {
      result.current.tab.setActiveTab("history");
    });

    expect(result.current.tab.activeTab).toBe("history");
    expect(result.current.location.search).toBe("?period=30d&tab=history");
  });

  it("replaces the entry so browser back leaves the screen", () => {
    const { result } = renderTabParam("/branches/b-1");

    act(() => {
      result.current.tab.setActiveTab("team");
    });

    expect(result.current.navigationType).toBe("REPLACE");
  });

  it("removes the param when returning to the default tab", () => {
    const { result } = renderTabParam("/branches/b-1?tab=history");

    act(() => {
      result.current.tab.setActiveTab("summary");
    });

    expect(result.current.location.search).toBe("");
  });
});
