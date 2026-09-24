import { describe, expect, it, vi } from "vitest";
import type { DashboardAlert } from "../../domain/types";
import { handleAlertClick } from "./alertNavigation";

describe("handleAlertClick", () => {
  it("navigates overdue_trip to trip detail", () => {
    const navigate = vi.fn();
    const alert: DashboardAlert = {
      type: "overdue_trip",
      severity: "error",
      title: "Viaje vencido",
      description: "Retraso",
      entity_id: "trip-42",
      entity_code: "V-042",
    };

    handleAlertClick(alert, navigate);

    expect(navigate).toHaveBeenCalledWith("/trips/trip-42");
  });

  it("navigates license_expiring to driver documents tab", () => {
    const navigate = vi.fn();
    const alert: DashboardAlert = {
      type: "license_expiring",
      severity: "warning",
      title: "Licencia",
      description: "Por vencer",
      entity_id: "driver-9",
    };

    handleAlertClick(alert, navigate);

    expect(navigate).toHaveBeenCalledWith("/drivers/driver-9?tab=documents");
  });

  it("navigates insurance_expiring to vehicle documents tab", () => {
    const navigate = vi.fn();
    const alert: DashboardAlert = {
      type: "insurance_expiring",
      severity: "info",
      title: "Seguro",
      description: "Por renovar",
      entity_id: "vehicle-3",
    };

    handleAlertClick(alert, navigate);

    expect(navigate).toHaveBeenCalledWith("/vehicles/vehicle-3?tab=documents");
  });
});
