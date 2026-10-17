import type { useNavigate } from "react-router-dom";
import { DASHBOARD_PATH } from "@shared/utils/reportsWayfinding";
import type { AlertType, DashboardAlert } from "../../domain/types";
import { dashboardCopy } from "../copy/dashboardCopy";

const DOCUMENT_ALERT_TYPES: ReadonlySet<AlertType> = new Set([
  "license_expiring",
  "medical_certificate_expiring",
  "insurance_expiring",
  "sct_permit_expiring",
]);

export function isDocumentAlertType(type: AlertType): boolean {
  return DOCUMENT_ALERT_TYPES.has(type);
}

export function hasDocumentAlerts(
  alerts: readonly DashboardAlert[] | undefined,
): boolean {
  return Boolean(alerts?.some((alert) => isDocumentAlertType(alert.type)));
}

export function getAlertCtaLabel(type: AlertType): string {
  return dashboardCopy.alerts.cta[type] ?? dashboardCopy.alerts.cta.overdue_trip;
}

export function handleAlertClick(
  alert: DashboardAlert,
  navigate: ReturnType<typeof useNavigate>,
  from: string = DASHBOARD_PATH,
) {
  const state = { from };
  switch (alert.type) {
    case "overdue_trip":
      navigate(`/trips/${alert.entity_id}`, { state });
      break;
    case "license_expiring":
    case "medical_certificate_expiring":
      navigate(`/drivers/${alert.entity_id}?tab=documents`, { state });
      break;
    case "insurance_expiring":
    case "sct_permit_expiring":
      navigate(`/vehicles/${alert.entity_id}?tab=documents`, { state });
      break;
    default:
      if (
        alert.entity_code?.startsWith("VH-") ||
        alert.entity_code?.startsWith("U-")
      ) {
        navigate(`/vehicles/${alert.entity_id}`, { state });
      } else if (alert.entity_code?.startsWith("EMP")) {
        navigate(`/drivers/${alert.entity_id}`, { state });
      } else {
        navigate(`/trips/${alert.entity_id}`, { state });
      }
  }
}
