import { describe, expect, it } from "vitest";
import type { HelpArticle } from "../domain";
import { selectPrimaryHelpArticle } from "./selectPrimaryHelpArticle";

function article(
  partial: Pick<HelpArticle, "id" | "sortOrder"> &
    Partial<Omit<HelpArticle, "id" | "sortOrder">>,
): HelpArticle {
  return {
    title: partial.title ?? partial.id,
    group: partial.group ?? "viajes",
    screens: partial.screens ?? [],
    roles: partial.roles ?? [],
    phrase: partial.phrase ?? `phrase-${partial.id}`,
    guide: partial.guide ?? null,
    problem: partial.problem ?? null,
    ...partial,
  };
}

describe("selectPrimaryHelpArticle", () => {
  it("returns null for empty/missing lists", () => {
    expect(selectPrimaryHelpArticle(undefined)).toBeNull();
    expect(selectPrimaryHelpArticle(null)).toBeNull();
    expect(selectPrimaryHelpArticle([])).toBeNull();
  });

  it("picks the lowest sortOrder (ASC)", () => {
    const primary = selectPrimaryHelpArticle([
      article({ id: "b", sortOrder: 20, phrase: "second" }),
      article({ id: "a", sortOrder: 10, phrase: "first" }),
      article({ id: "c", sortOrder: 30, phrase: "third" }),
    ]);
    expect(primary?.id).toBe("a");
    expect(primary?.phrase).toBe("first");
  });

  it("keeps first among equal sortOrder after stable sort by input order", () => {
    const primary = selectPrimaryHelpArticle([
      article({ id: "first", sortOrder: 1 }),
      article({ id: "second", sortOrder: 1 }),
    ]);
    expect(primary?.id).toBe("first");
  });
});
