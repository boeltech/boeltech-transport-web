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
  {
    id: "monitoring",
    title: "Monitoreo",
    items: [
      {
        id: "fleet-map",
        label: "Mapa de flota",
        path: "/monitoring/fleet",
        icon: Circle,
      },
      {
        id: "gps-alerts",
        label: "Alertas",
        path: "/monitoring/alerts",
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
    const enriched = enrichNavigationWithBadges(sampleNavigation, 5, undefined);
    const approvalsItem = enriched[0].items.find(
      (item) => item.id === "finance-approvals",
    );

    expect(approvalsItem?.badge).toBe(5);
  });

  it("adds badge to gps-alerts when unread count is positive", () => {
    const enriched = enrichNavigationWithBadges(
      sampleNavigation,
      undefined,
      undefined,
      3,
    );
    const alertsItem = enriched[1].items.find(
      (item) => item.id === "gps-alerts",
    );

    expect(alertsItem?.badge).toBe(3);
  });

  it("leaves navigation unchanged when counts are zero or undefined", () => {
    expect(
      enrichNavigationWithBadges(sampleNavigation, 0, undefined, 0),
    ).toEqual(sampleNavigation);
    expect(
      enrichNavigationWithBadges(sampleNavigation, undefined, undefined, undefined),
    ).toEqual(sampleNavigation);
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
