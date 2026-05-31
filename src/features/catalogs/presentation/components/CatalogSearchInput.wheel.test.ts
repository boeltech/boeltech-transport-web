import { describe, expect, it, vi } from "vitest";
import { handleCatalogResultsListWheel } from "./catalogSearchInputWheel";

function wheelEvent(deltaY: number): WheelEvent {
  return { deltaY, stopPropagation: vi.fn(), preventDefault: vi.fn() } as unknown as WheelEvent;
}

describe("handleCatalogResultsListWheel", () => {
  it("does not call preventDefault when the list has no overflow", () => {
    const el = {
      scrollTop: 0,
      scrollHeight: 120,
      clientHeight: 120,
    } as HTMLElement;
    const e = wheelEvent(100);

    handleCatalogResultsListWheel(el, e);

    expect(e.stopPropagation).toHaveBeenCalled();
    expect(e.preventDefault).not.toHaveBeenCalled();
  });

  it("calls preventDefault at the bottom edge when content overflows", () => {
    const el = {
      scrollTop: 100,
      scrollHeight: 200,
      clientHeight: 100,
    } as HTMLElement;
    const e = wheelEvent(50);

    handleCatalogResultsListWheel(el, e);

    expect(e.preventDefault).toHaveBeenCalled();
  });
});
