import { ApprovalInboxPage } from "@features/approvals";
import { useSettlementSettings } from "../../application/hooks";
import { settlementsCopy } from "../copy/settlementsCopy";

const hubCopy = settlementsCopy.hub;

/**
 * Pestaña «Por autorizar» del hub Pagos a operadores (ADR-0099 F6a): la misma
 * bandeja de autorizaciones fijada a liquidaciones, con «Me toca · Todas»,
 * filtro por operador y vacío según autorizadores activos.
 */
export function SettlementsPendingApprovalPage() {
  const { data: settings } = useSettlementSettings();
  const emptyDescription =
    settings?.activeApproverCount === 1
      ? hubCopy.pendingApprovalEmptyDescriptionSingle
      : hubCopy.pendingApprovalEmptyDescription;

  return (
    <ApprovalInboxPage
      embedded
      lockedType="internal_staff_compensation"
      operatorFilter={{ placeholder: hubCopy.operatorFilterPlaceholder }}
      emptyState={{
        title: hubCopy.pendingApprovalEmptyTitle,
        description: emptyDescription,
      }}
    />
  );
}
