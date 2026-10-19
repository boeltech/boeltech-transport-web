import { describe, expect, it } from "vitest";
import {
  courseToCardinal,
  formatCardinalHeading,
  normalizeCourseDeg,
} from "./cardinalHeading";

describe("cardinalHeading", () => {
  it("normalizes negative and >360 degrees", () => {
    expect(normalizeCourseDeg(-45)).toBe(315);
    expect(normalizeCourseDeg(405)).toBe(45);
  });

  it("maps 8-point cardinals", () => {
    expect(courseToCardinal(0)).toBe("N");
    expect(courseToCardinal(45)).toBe("NE");
    expect(courseToCardinal(90)).toBe("E");
    expect(courseToCardinal(135)).toBe("SE");
    expect(courseToCardinal(180)).toBe("S");
    expect(courseToCardinal(225)).toBe("SW");
    expect(courseToCardinal(270)).toBe("W");
    expect(courseToCardinal(315)).toBe("NW");
  });

  it("formats label like Track One (↗ NE 045°)", () => {
    expect(formatCardinalHeading(45)?.label).toBe("↗ NE 045°");
    expect(formatCardinalHeading(null)).toBeNull();
  });
});
