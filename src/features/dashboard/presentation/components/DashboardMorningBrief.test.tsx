import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import { DashboardMorningBrief } from "./DashboardMorningBrief";
import { dashboardCopy } from "../copy/dashboardCopy";
import { DASHBOARD_ALERTS_WIDGET_DOM_ID } from "../../domain/morningBrief";

const navigate = vi.fn();

const pendingApprovalsRowName = new RegExp(
  dashboardCopy.morningBrief.stats.pendingApprovals,
  "i",
);

function renderBrief(
  props: Partial<ComponentProps<typeof DashboardMorningBrief>> = {},
) {
  return render(
    <MemoryRouter>
      <DashboardMorningBrief
        user={{ firstName: "Gerardo" }}
        pendingApprovals={5}
        pendingApprovalsCounts={{
          trip_expense: 0,
          driver_advance_request: 2,
          internal_staff_compensation: 3,
        }}
        showPendingApprovalsStat
        collectedYesterday={8200}
        alertCount={2}
        tripsToday={[
          {
            id: "trip-1",
            trip_code: "TRP-001",
            origin_city: "CDMX",
            destination_city: "GDL",
            status: "in_progress",
            scheduled_departure: "2026-10-17T14:00:00Z",
            driver_full_name: "Ana",
            vehicle_unit_number: "U-10",
          },
        ]}
        isLoading={false}
        navigate={navigate}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("DashboardMorningBrief", () => {
  beforeEach(() => {
    navigate.mockReset();
  });

  it("renderiza resumen del día y viajes de hoy", () => {
    renderBrief();
    expect(
      screen.getByRole("heading", {
        name: dashboardCopy.morningBrief.summaryTitle,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("TRP-001")).toBeInTheDocument();
    expect(screen.getByText(/CDMX/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: dashboardCopy.morningBrief.tripsToday.viewAll,
      }),
    ).toBeInTheDocument();
  });

  it("Por autorizar es la 1ª fila con el total Me toca", () => {
    renderBrief();
    const first = screen.getAllByRole("button")[0];
    expect(first).toHaveTextContent(
      dashboardCopy.morningBrief.stats.pendingApprovals,
    );
    expect(first).toHaveTextContent(dashboardCopy.morningBrief.microLabels.mine);
    expect(first).toHaveTextContent("5");
    expect(screen.queryByText("Viajes en ruta")).not.toBeInTheDocument();
  });

  it("no monta Por autorizar sin permiso y deja las demás filas", () => {
    renderBrief({ showPendingApprovalsStat: false });
    expect(
      screen.queryByText(dashboardCopy.morningBrief.stats.pendingApprovals),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.morningBrief.stats.collectedYesterday),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.morningBrief.stats.activeAlerts),
    ).toBeInTheDocument();
  });

  it("muestra skeleton propio mientras cargan las aprobaciones", () => {
    renderBrief({ isPendingApprovalsLoading: true });
    const row = screen.getByRole("button", { name: pendingApprovalsRowName });
    expect(row).not.toHaveTextContent("5");
    expect(row.querySelector('[class*="h-6"]')).not.toBeNull();
    // Las otras filas no se ven afectadas por este loading.
    expect(
      screen.getByRole("button", {
        name: new RegExp(dashboardCopy.morningBrief.stats.activeAlerts, "i"),
      }),
    ).toHaveTextContent("2");
  });

  it("undefined → «—» y 0 se muestra con permiso", () => {
    const { unmount } = renderBrief({ pendingApprovals: undefined });
    expect(
      screen.getByRole("button", { name: pendingApprovalsRowName }),
    ).toHaveTextContent("—");
    unmount();

    renderBrief({ pendingApprovals: 0 });
    expect(
      screen.getByRole("button", { name: pendingApprovalsRowName }),
    ).toHaveTextContent("0");
  });

  it("oculta cobrado ayer cuando es null (no inventa 0)", () => {
    renderBrief({ collectedYesterday: null });
    expect(
      screen.queryByText(dashboardCopy.morningBrief.stats.collectedYesterday),
    ).not.toBeInTheDocument();
  });

  it("navega a aprobaciones con el primer type con pendientes y a cobros", async () => {
    const user = userEvent.setup();
    renderBrief();
    await user.click(
      screen.getByRole("button", { name: pendingApprovalsRowName }),
    );
    expect(navigate).toHaveBeenCalledWith(
      "/finance/approvals?type=driver_advance_request",
      { state: { from: "/dashboard" } },
    );

    await user.click(
      screen.getByRole("button", {
        name: new RegExp(
          dashboardCopy.morningBrief.stats.collectedYesterday,
          "i",
        ),
      }),
    );
    expect(navigate).toHaveBeenCalledWith("/finance/cobros", {
      state: { from: "/dashboard" },
    });
  });

  it("todos en 0 → destino trip_expense", async () => {
    const user = userEvent.setup();
    renderBrief({
      pendingApprovals: 0,
      pendingApprovalsCounts: {
        trip_expense: 0,
        driver_advance_request: 0,
        internal_staff_compensation: 0,
      },
    });
    await user.click(
      screen.getByRole("button", { name: pendingApprovalsRowName }),
    );
    expect(navigate).toHaveBeenCalledWith(
      "/finance/approvals?type=trip_expense",
      { state: { from: "/dashboard" } },
    );
  });

  it("hace focus/scroll al panel de alertas", async () => {
    const user = userEvent.setup();
    const el = document.createElement("div");
    el.id = DASHBOARD_ALERTS_WIDGET_DOM_ID;
    document.body.appendChild(el);
    const focus = vi.spyOn(el, "focus").mockImplementation(() => undefined);
    const scrollIntoView = vi
      .spyOn(el, "scrollIntoView")
      .mockImplementation(() => undefined);

    renderBrief();
    await user.click(
      screen.getByRole("button", {
        name: new RegExp(dashboardCopy.morningBrief.stats.activeAlerts, "i"),
      }),
    );
    expect(scrollIntoView).toHaveBeenCalled();
    expect(focus).toHaveBeenCalled();
    el.remove();
  });

  it("footer navega con opsDay de hoy CDMX", async () => {
    const user = userEvent.setup();
    renderBrief();
    await user.click(
      screen.getByRole("button", {
        name: dashboardCopy.morningBrief.tripsToday.viewAll,
      }),
    );
    expect(navigate).toHaveBeenCalledWith(
      expect.stringMatching(/^\/trips\?opsDay=\d{4}-\d{2}-\d{2}$/),
      { state: { from: "/dashboard" } },
    );
  });

  it("expone focus-visible ring en filas clickeables (F5 a11y)", () => {
    renderBrief();
    const pending = screen.getByRole("button", {
      name: pendingApprovalsRowName,
    });
    expect(pending.className).toContain("focus-visible:ring-2");
    expect(pending.className).toContain("focus-visible:ring-ring");

    const tripRow = screen.getByRole("button", { name: /TRP-001/i });
    expect(tripRow.className).toContain("focus-visible:ring-2");
  });
});
