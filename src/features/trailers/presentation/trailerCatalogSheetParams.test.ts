import { describe, expect, it } from "vitest";
import {
  readTrailerCatalogEditId,
  trailerCatalogListHref,
} from "./trailerCatalogSheetParams";

describe("trailerCatalogSheetParams", () => {
  it("builds list deep-links for create and edit", () => {
    expect(trailerCatalogListHref({ create: true })).toBe("/trailers?create=true");
    expect(trailerCatalogListHref({ editId: "trailer-1" })).toBe(
      "/trailers?edit=trailer-1",
    );
  });

  it("ignores the legacy edit=true flag as an id", () => {
    expect(readTrailerCatalogEditId(null)).toBe("");
    expect(readTrailerCatalogEditId("true")).toBe("");
    expect(readTrailerCatalogEditId("trailer-1")).toBe("trailer-1");
  });
});
