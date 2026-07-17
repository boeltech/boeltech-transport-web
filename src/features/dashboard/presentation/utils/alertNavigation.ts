import type { useNavigate } from "react-router-dom";
import type { DashboardAlert } from "../../domain/types";

export function handleAlertClick(
  alert: DashboardAlert,
  navigate: ReturnType<typeof useNavigate>,
) {
  switch (alert.type) {
    case "overdue_trip":
      navigate("/trips?overdue=1");
      break;
    case "license_expiring":
    case "medical_certificate_expiring":
      navigate(`/drivers/${alert.entity_id}`);
      break;
    case "insurance_expiring":
    case "sct_permit_expiring":
      navigate(`/vehicles/${alert.entity_id}`);
      break;
    default:
      if (
        alert.entity_code?.startsWith("VH-") ||
        alert.entity_code?.startsWith("U-")
      ) {
        navigate(`/vehicles/${alert.entity_id}`);
      } else if (alert.entity_code?.startsWith("EMP")) {
        navigate(`/drivers/${alert.entity_id}`);
      } else {
        navigate(`/trips/${alert.entity_id}`);
      }
  }
}
