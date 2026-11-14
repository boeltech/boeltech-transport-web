import type { NavigateFunction } from "react-router-dom";
import type { DocumentExpiryItem } from "../../domain";
import { FLEET_DOCUMENTS_PATH } from "../../domain";

/**
 * Href del detalle (paridad con dashboard `alertNavigation.ts`).
 * license / medical_certificate → drivers; insurance / sct_permit → vehicles.
 */
export function documentExpiryDetailPath(item: DocumentExpiryItem): string {
  switch (item.docType) {
    case "license":
    case "medical_certificate":
      return `/drivers/${item.entityId}?tab=documents`;
    case "insurance":
    case "sct_permit":
      return `/vehicles/${item.entityId}?tab=documents`;
    default:
      if (item.entityType === "driver") {
        return `/drivers/${item.entityId}?tab=documents`;
      }
      return `/vehicles/${item.entityId}?tab=documents`;
  }
}

/**
 * Deep-link al detalle (paridad con dashboard `alertNavigation.ts`).
 */
export function navigateToDocumentExpiryDetail(
  item: DocumentExpiryItem,
  navigate: NavigateFunction,
  from: string = FLEET_DOCUMENTS_PATH,
): void {
  navigate(documentExpiryDetailPath(item), { state: { from } });
}
