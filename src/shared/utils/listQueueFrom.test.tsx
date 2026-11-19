import { describe, expect, it } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";

import {
  useIncomingFrom,
  useIncomingFromLabel,
  useIncomingWayfinding,
} from "./listQueueFrom";

function wrapperFor(state: unknown) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter
        initialEntries={[{ pathname: "/vehicles/v-1", state }]}
      >
        {children}
      </MemoryRouter>
    );
  };
}

describe("listQueueFrom wayfinding state", () => {
  it("useIncomingFrom lee from", () => {
    const { result } = renderHook(() => useIncomingFrom(), {
      wrapper: wrapperFor({ from: "/trips?status=active" }),
    });
    expect(result.current).toBe("/trips?status=active");
  });

  it("useIncomingFromLabel lee fromLabel opcional", () => {
    const { result } = renderHook(
      () => ({
        from: useIncomingFrom(),
        fromLabel: useIncomingFromLabel(),
        both: useIncomingWayfinding(),
      }),
      {
        wrapper: wrapperFor({
          from: "/trips/trip-1",
          fromLabel: "TRP-261118-0001",
        }),
      },
    );
    expect(result.current.from).toBe("/trips/trip-1");
    expect(result.current.fromLabel).toBe("TRP-261118-0001");
    expect(result.current.both).toEqual({
      from: "/trips/trip-1",
      fromLabel: "TRP-261118-0001",
    });
  });

  it("sin fromLabel válido no lo expone", () => {
    const { result } = renderHook(() => useIncomingWayfinding(), {
      wrapper: wrapperFor({ from: "/clients", fromLabel: "  " }),
    });
    expect(result.current).toEqual({ from: "/clients" });
  });

  it("sin from ignora fromLabel suelto", () => {
    const { result } = renderHook(
      () => ({
        from: useIncomingFrom(),
        fromLabel: useIncomingFromLabel(),
        loc: useLocation().state,
      }),
      { wrapper: wrapperFor({ fromLabel: "Huérfano" }) },
    );
    expect(result.current.from).toBeUndefined();
    expect(result.current.fromLabel).toBeUndefined();
  });
});
