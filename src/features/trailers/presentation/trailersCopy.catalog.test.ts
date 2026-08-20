import { describe, expect, it } from "vitest";
import { trailersCopy } from "./copy/trailersCopy";
import { TRAILER_STATUS_CONFIG } from "./config/trailerStatusConfig";
import { createTrailerFormSchema } from "./validation";

const BANNED =
  /SubTipoRem|ConfigVehicular|\bpool\b|\bhold\b|\bSAT\b|\bmaestro\b/i;

function collectStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") {
    acc.push(value);
    return acc;
  }
  if (typeof value === "function") {
    const sample = value("ABC1234");
    if (typeof sample === "string") acc.push(sample);
    return acc;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, acc);
    return acc;
  }
  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) collectStrings(nested, acc);
  }
  return acc;
}

describe("trailers catalog copy (Capa 1 D8)", () => {
  it("keeps list/form/actions and status descriptions free of wiring jargon", () => {
    const strings = [
      ...collectStrings(trailersCopy.list),
      ...collectStrings(trailersCopy.form),
      ...collectStrings(trailersCopy.actions),
      ...collectStrings(trailersCopy.catalogSheet),
      ...Object.values(TRAILER_STATUS_CONFIG).flatMap((config) => [
        config.label,
        config.description,
      ]),
    ];

    const offenders = strings.filter((text) => BANNED.test(text));
    expect(offenders).toEqual([]);
  });

  it("uses operational validation messages without SAT jargon", () => {
    const empty = createTrailerFormSchema.safeParse({
      licensePlate: "",
      satSubTipoRemCode: "",
      notes: "",
    });
    expect(empty.success).toBe(false);
    if (empty.success) return;

    const messages = empty.error.issues.map((issue) => issue.message);
    expect(messages.some((message) => BANNED.test(message))).toBe(false);
    expect(messages).toContain("Selecciona el tipo de remolque.");
  });
});
