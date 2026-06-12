/**
 * Smoke dark — dashboard alerts panel sin colores Tailwind crudos.
 */
import { describe, expect, it, vi } from "vitest";
import type { DashboardAlert } from "@features/dashboard/domain/types";
import { DashboardAlertsPanel } from "@features/dashboard/presentation/components/DashboardAlertsPanel";
import {
  expectNoRawTailwindColors,
  renderWithTheme,
} from "@/test/renderWithTheme";

const navigate = vi.fn();

const alerts: DashboardAlert[] = [
  {
    type: "overdue_trip",
    severity: "error",
    title: "Viaje vencido",
    description: "Requiere atención inmediata.",
    entity_id: "trip-1",
  },
  {
    type: "license_expiring",
    severity: "warning",
    title: "Licencia por vencer",
    description: "Renovar en 15 días.",
    entity_id: "driver-1",
  },
];

describe("dashboard dark smoke", () => {
  it("renders alerts panel in dark theme without raw palette classes", () => {
    const { container } = renderWithTheme(
      <DashboardAlertsPanel
        alerts={alerts}
        isLoading={false}
        navigate={navigate}
      />,
      { resolvedTheme: "dark" },
    );

    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expectNoRawTailwindColors(container);
  });
});
