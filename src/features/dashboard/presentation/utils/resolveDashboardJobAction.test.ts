import { describe, expect, it } from "vitest";

import { resolveDashboardJobAction } from "./resolveDashboardJobAction";
import { dashboardCopy } from "../copy/dashboardCopy";

const job = dashboardCopy.page.jobActions;

describe("resolveDashboardJobAction", () => {
  it("null en portales", () => {
    expect(
      resolveDashboardJobAction({
        role: "client",
        canReadTrips: true,
        canCreateTrip: true,
        isPortal: true,
        firstPending: null,
      }),
    ).toBeNull();
  });

  it("dispatcher → Nuevo viaje", () => {
    expect(
      resolveDashboardJobAction({
        role: "dispatcher",
        canReadTrips: true,
        canCreateTrip: true,
        isPortal: false,
        firstPending: null,
      }),
    ).toEqual({ id: "job-new-trip", label: job.newTrip, href: "/trips/new" });
  });

  it("dispatcher sin create → Ir a Viajes", () => {
    expect(
      resolveDashboardJobAction({
        role: "dispatcher",
        canReadTrips: true,
        canCreateTrip: false,
        isPortal: false,
        firstPending: null,
      }),
    ).toEqual({ id: "job-trips", label: job.trips, href: "/trips" });
  });

  it("accountant → Ir a Por facturar", () => {
    expect(
      resolveDashboardJobAction({
        role: "accountant",
        canReadTrips: true,
        canCreateTrip: false,
        isPortal: false,
        firstPending: {
          id: "approvals",
          count: 4,
          labelDetail: "por autorizar",
          href: "/finance/approvals",
          ctaVerb: "Revisar",
        },
      }),
    ).toEqual({
      id: "job-invoiceable",
      label: job.invoiceable,
      href: "/finance/invoiceable",
    });
  });

  it("admin prioriza primer pendiente", () => {
    expect(
      resolveDashboardJobAction({
        role: "admin",
        canReadTrips: true,
        canCreateTrip: true,
        isPortal: false,
        firstPending: {
          id: "approvals",
          count: 4,
          labelDetail: "por autorizar",
          href: "/finance/approvals?type=trip_expense",
          ctaVerb: "Revisar",
        },
      }),
    ).toEqual({
      id: "job-approvals",
      label: "Revisar 4 por autorizar",
      href: "/finance/approvals?type=trip_expense",
    });
  });

  it("admin al día → Nuevo viaje", () => {
    expect(
      resolveDashboardJobAction({
        role: "admin",
        canReadTrips: true,
        canCreateTrip: true,
        isPortal: false,
        firstPending: null,
      }),
    ).toEqual({ id: "job-new-trip", label: job.newTrip, href: "/trips/new" });
  });
});
