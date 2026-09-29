import { describe, expect, it } from "vitest";

import { tripsListHref } from "./tripsListHref";

describe("tripsListHref", () => {
  it("devuelve /trips sin query", () => {
    expect(tripsListHref(new URLSearchParams())).toBe("/trips");
  });

  it("preserva bucket y filtros", () => {
    const params = new URLSearchParams({
      status: "in_progress",
      page: "2",
      q: "TRP",
    });
    expect(tripsListHref(params)).toBe("/trips?status=in_progress&page=2&q=TRP");
  });
});
