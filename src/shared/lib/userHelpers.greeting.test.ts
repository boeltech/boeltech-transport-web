import { afterEach, describe, expect, it, vi } from "vitest";
import { getGreeting, getUserFirstName } from "./userHelpers";

describe("getGreeting (Q18)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("incluye nombre cuando hay firstName", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T10:00:00"));
    expect(getGreeting({ firstName: "Rodrigo" })).toBe("Buenos días, Rodrigo");
  });

  it("omite Usuario y coma sin firstName", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-16T10:00:00"));
    expect(getGreeting({})).toBe("Buenos días");
    expect(getGreeting(null)).toBe("Buenos días");
  });

  it("no muta getUserFirstName", () => {
    expect(getUserFirstName({})).toBe("Usuario");
    expect(getUserFirstName(null)).toBe("Usuario");
  });
});
