import { describe, expect, it } from "vitest";
import { mapCollectionsWeek } from "./mappers";

describe("mapCollectionsWeek", () => {
  it("maps snake_case week payload to camelCase", () => {
    const mapped = mapCollectionsWeek({
      week_start: "2026-11-16",
      week_end: "2026-11-22",
      days: [
        {
          date: "2026-11-16",
          with_invoice: 8000,
          without_invoice: 3200,
          total: 11200,
        },
        {
          date: "2026-11-17",
          with_invoice: 0,
          without_invoice: 0,
          total: 0,
        },
      ],
    });

    expect(mapped).toEqual({
      weekStart: "2026-11-16",
      weekEnd: "2026-11-22",
      days: [
        {
          date: "2026-11-16",
          withInvoice: 8000,
          withoutInvoice: 3200,
          total: 11200,
        },
        {
          date: "2026-11-17",
          withInvoice: 0,
          withoutInvoice: 0,
          total: 0,
        },
      ],
    });
  });
});
