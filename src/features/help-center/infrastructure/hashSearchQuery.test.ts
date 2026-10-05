import { describe, expect, it } from "vitest";
import {
  hashSearchQuery,
  normalizeSearchQuery,
  searchQueryLen,
} from "./hashSearchQuery";

describe("hashSearchQuery", () => {
  it("normalizes with trim + lower before hashing", async () => {
    expect(normalizeSearchQuery("  Facturar  ")).toBe("facturar");
    const a = await hashSearchQuery("  Facturar  ");
    const b = await hashSearchQuery("facturar");
    expect(a).toBe(b);
  });

  it("returns stable 16-char lowercase hex", async () => {
    const hash = await hashSearchQuery("facturar viaje");
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
    expect(await hashSearchQuery("facturar viaje")).toBe(hash);
  });

  it("differs for different queries", async () => {
    const a = await hashSearchQuery("facturar");
    const b = await hashSearchQuery("liquidar");
    expect(a).not.toBe(b);
  });

  it("caps q_len at 200", () => {
    expect(searchQueryLen("ab")).toBe(2);
    expect(searchQueryLen(`  ${"x".repeat(250)}  `)).toBe(200);
  });
});
