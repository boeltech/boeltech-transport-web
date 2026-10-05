import { describe, expect, it } from "vitest";
import { Circle } from "lucide-react";
import type { NavGroup } from "./types";
import { enrichNavigationWithBadges } from "./useNavigationWithBadges";

const sampleNavigation: NavGroup[] = [
  {
    id: "finance",
    title: "Finanzas",
    items: [
      {
        id: "finance-hub",
        label: "Finanzas",
        path: "/finance",
        icon: Circle,
      },
      {
        id: "finance-approvals",
        label: "Aprobaciones",
        path: "/finance/approvals?status=pending&type=trip_expense",
        icon: Circle,
      },
    ],
  },
];
describe("enrichNavigationWithBadges", () => {
  it("adds badge to finance-approvals when pending count is positive", () => {
    const enriched = enrichNavigationWithBadges(sampleNavigation, 5);
    const approvalsItem = enriched[0].items.find(
      (item) => item.id === "finance-approvals",
    );

    expect(approvalsItem?.badge).toBe(5);
  });

  it("leaves navigation unchanged when pending count is zero or undefined", () => {
    expect(enrichNavigationWithBadges(sampleNavigation, 0)).toEqual(
      sampleNavigation,
    );
    expect(enrichNavigationWithBadges(sampleNavigation, undefined)).toEqual(
      sampleNavigation,
    );
  });
});
