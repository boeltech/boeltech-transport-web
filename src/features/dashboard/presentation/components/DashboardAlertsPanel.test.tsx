import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { DashboardAlert } from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";
import { DashboardAlertsPanel } from "./DashboardAlertsPanel";

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

describe("DashboardAlertsPanel", () => {
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
});
