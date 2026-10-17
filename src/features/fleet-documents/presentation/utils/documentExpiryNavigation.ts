import type { NavigateFunction } from "react-router-dom";
import type { DocumentExpiryItem } from "../../domain";
import { FLEET_DOCUMENTS_PATH } from "../../domain";

/**
 * Deep-link al detalle (paridad con dashboard `alertNavigation.ts`).
 * license / medical_certificate → drivers; insurance / sct_permit → vehicles.
 */
export function navigateToDocumentExpiryDetail(
  item: DocumentExpiryItem,
  navigate: NavigateFunction,
  from: string = FLEET_DOCUMENTS_PATH,
): void {
  const state = { from };
  switch (item.docType) {
    case "license":
    case "medical_certificate":
      navigate(`/drivers/${item.entityId}?tab=documents`, { state });
      break;
    case "insurance":
    case "sct_permit":
      navigate(`/vehicles/${item.entityId}?tab=documents`, { state });
      break;
    default:
      if (item.entityType === "driver") {
        navigate(`/drivers/${item.entityId}?tab=documents`, { state });
      } else {
        navigate(`/vehicles/${item.entityId}?tab=documents`, { state });
      }
  }
}
