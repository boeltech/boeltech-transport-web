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
const operatorPaymentsNav: NavGroup[] = [
  {
    id: "operator-payments",
    title: "Pagos a operadores",
    items: [
      {
        id: "operator-payments-pagos",
        label: "Pagos",
        path: "/finance/operator-payments",
        icon: Circle,
      },
      {
        id: "operator-payments-advances",
        label: "Anticipos",
        path: "/finance/operator-payments/advances",
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

  it("adds F4 nav-badges to Pagos and Anticipos", () => {
    const enriched = enrichNavigationWithBadges(operatorPaymentsNav, 0, {
      payments: 38,
      advances: 4,
    });
    expect(
      enriched[0].items.find((i) => i.id === "operator-payments-pagos")?.badge,
    ).toBe(38);
    expect(
      enriched[0].items.find((i) => i.id === "operator-payments-advances")
        ?.badge,
    ).toBe(4);
  });
});
