import { describe, expect, it } from "vitest";
import { escapeHtml } from "./escapeHtml";

describe("escapeHtml", () => {
  it("escapes script tags and quotes", () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });
});
