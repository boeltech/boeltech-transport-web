import { describe, expect, it, vi } from "vitest";

import { resolveDashboardJobAction } from "./resolveDashboardJobAction";
import { dashboardCopy } from "../copy/dashboardCopy";

const job = dashboardCopy.page.jobActions;
const onFocusAlerts = vi.fn();

describe("resolveDashboardJobAction", () => {
  it("null en portales o sin trips", () => {
    expect(
      resolveDashboardJobAction({
        role: "client",
        canReadTrips: true,
        isPortal: true,
        showPendingApprovals: false,
        pendingApprovalsTotal: 0,
        pendingApprovalsCounts: undefined,
        alertCount: 0,
        todayOpsDay: "2026-10-26",
        onFocusAlerts,
      }),
    ).toBeNull();
  });

  it("dispatcher → Ir a Viajes", () => {
    expect(
      resolveDashboardJobAction({
        role: "dispatcher",
        canReadTrips: true,
        isPortal: false,
        showPendingApprovals: false,
        pendingApprovalsTotal: undefined,
        pendingApprovalsCounts: undefined,
        alertCount: 3,
        todayOpsDay: "2026-10-26",
        onFocusAlerts,
      }),
    ).toEqual({ id: "job-trips", label: job.trips, href: "/trips" });
  });

  it("admin prioriza Por autorizar cuando hay pendientes", () => {
    expect(
      resolveDashboardJobAction({
        role: "admin",
        canReadTrips: true,
        isPortal: false,
        showPendingApprovals: true,
        pendingApprovalsTotal: 2,
        pendingApprovalsCounts: { trip_expense: 2 },
        alertCount: 5,
        todayOpsDay: "2026-10-26",
        onFocusAlerts,
      }),
    ).toEqual({
      id: "job-approvals",
      label: job.pendingApprovals,
      href: "/finance/approvals?type=trip_expense",
    });
  });

  it("admin sin pendientes con alertas → Ver alertas", () => {
    const action = resolveDashboardJobAction({
      role: "admin",
      canReadTrips: true,
      isPortal: false,
      showPendingApprovals: true,
      pendingApprovalsTotal: 0,
      pendingApprovalsCounts: undefined,
      alertCount: 2,
      todayOpsDay: "2026-10-26",
      onFocusAlerts,
    });
    expect(action?.id).toBe("job-alerts");
    expect(action?.label).toBe(job.viewAlerts);
    expect(action?.onClick).toBe(onFocusAlerts);
  });

  it("admin sin cola ni alertas → Viajes de hoy", () => {
    expect(
      resolveDashboardJobAction({
        role: "admin",
        canReadTrips: true,
        isPortal: false,
        showPendingApprovals: false,
        pendingApprovalsTotal: undefined,
        pendingApprovalsCounts: undefined,
        alertCount: 0,
        todayOpsDay: "2026-10-26",
        onFocusAlerts,
      }),
    ).toEqual({
      id: "job-trips-today",
      label: job.tripsToday,
      href: "/trips?opsDay=2026-10-26",
    });
  });
});
