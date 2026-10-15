import type { useNavigate } from "react-router-dom";
import { DASHBOARD_PATH } from "@shared/utils/reportsWayfinding";
import type { DashboardAlert } from "../../domain/types";

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
