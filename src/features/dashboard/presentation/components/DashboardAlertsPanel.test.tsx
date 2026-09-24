import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { DashboardAlert } from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";
import {
  DASHBOARD_ALERTS_VISIBLE_LIMIT,
  DashboardAlertsPanel,
} from "./DashboardAlertsPanel";

const navigate = vi.fn();

const errorAlert: DashboardAlert = {
  type: "overdue_trip",
  severity: "error",
  title: "Viaje vencido",
  description: "El viaje V-001 superó la fecha estimada de entrega.",
  entity_id: "trip-1",
  entity_code: "V-001",
};

const warningAlert: DashboardAlert = {
  type: "license_expiring",
  severity: "warning",
  title: "Licencia por vencer",
  description: "La licencia del conductor vence en 15 días.",
  entity_id: "driver-1",
};

const infoAlert: DashboardAlert = {
  type: "insurance_expiring",
  severity: "info",
  title: "Seguro por renovar",
  description: "La póliza del vehículo vence el próximo mes.",
  entity_id: "vehicle-1",
};

const RAW_COLOR_PATTERN =
  /\b(bg|text|border)-(red|blue|green|yellow|amber|emerald|gray|slate|white)-\d/;

function collectClassNames(element: HTMLElement): string {
  const classes = [element.className];
  element.querySelectorAll("[class]").forEach((node) => {
    classes.push((node as HTMLElement).className);
  });
  return classes.join(" ");
}

function makeAlerts(count: number): DashboardAlert[] {
  return Array.from({ length: count }, (_, i) => ({
    type: "overdue_trip" as const,
    severity: "error" as const,
    title: `Alerta ${i + 1}`,
    description: `Descripción ${i + 1}`,
    entity_id: `trip-${i + 1}`,
    entity_code: `V-${String(i + 1).padStart(3, "0")}`,
  }));
}

describe("DashboardAlertsPanel", () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  it("renders error alert without raw Tailwind color classes", () => {
    const { container } = render(
      <DashboardAlertsPanel
        alerts={[errorAlert]}
        isLoading={false}
        navigate={navigate}
      />,
    );

    expect(screen.getByText("Viaje vencido")).toBeInTheDocument();
    expect(collectClassNames(container)).not.toMatch(RAW_COLOR_PATTERN);
  });

  it("renders severity count badges with copy labels", () => {
    render(
      <DashboardAlertsPanel
        alerts={[errorAlert, warningAlert, infoAlert]}
        isLoading={false}
        navigate={navigate}
      />,
    );

    expect(
      screen.getByText(dashboardCopy.alerts.severity.error(1)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.alerts.severity.warning(1)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.alerts.severity.info(1)),
    ).toBeInTheDocument();
  });

  it("shows unavailable state when isError and alerts are missing (no all-clear)", () => {
    const onRetry = vi.fn();
    render(
      <DashboardAlertsPanel
        alerts={undefined}
        isLoading={false}
        isError
        onRetry={onRetry}
        navigate={navigate}
      />,
    );

    expect(
      screen.queryByText(dashboardCopy.alerts.allClearTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.alerts.unavailableTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dashboardCopy.alerts.unavailableDescription),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: dashboardCopy.alerts.retry }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("caps the list and expands remaining alerts in place", () => {
    const total = DASHBOARD_ALERTS_VISIBLE_LIMIT + 3;
    const remaining = total - DASHBOARD_ALERTS_VISIBLE_LIMIT;
    render(
      <DashboardAlertsPanel
        alerts={makeAlerts(total)}
        isLoading={false}
        navigate={navigate}
      />,
    );

    expect(screen.getByText("Alerta 1")).toBeInTheDocument();
    expect(
      screen.getByText(`Alerta ${DASHBOARD_ALERTS_VISIBLE_LIMIT}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(`Alerta ${DASHBOARD_ALERTS_VISIBLE_LIMIT + 1}`),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: dashboardCopy.alerts.showRemaining(remaining),
      }),
    );

    expect(
      screen.getByText(`Alerta ${DASHBOARD_ALERTS_VISIBLE_LIMIT + 1}`),
    ).toBeInTheDocument();
    expect(screen.getByText(`Alerta ${total}`)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: dashboardCopy.alerts.showRemaining(remaining),
      }),
    ).not.toBeInTheDocument();
  });

  it("renders each alert row with a single type icon and no chevron", () => {
    render(
      <DashboardAlertsPanel
        alerts={[errorAlert]}
        isLoading={false}
        navigate={navigate}
      />,
    );

    const row = screen.getByRole("button", { name: /Viaje vencido/i });
    expect(row.querySelectorAll(":scope > svg")).toHaveLength(1);
  });

  it("uses ScrollArea for the alert list and keeps row click navigation", () => {
    const { container } = render(
      <DashboardAlertsPanel
        alerts={[errorAlert]}
        isLoading={false}
        navigate={navigate}
      />,
    );

    expect(
      container.querySelector("[data-radix-scroll-area-viewport]"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Viaje vencido/i }));
    expect(navigate).toHaveBeenCalledWith(`/trips/${errorAlert.entity_id}`);
  });
});
