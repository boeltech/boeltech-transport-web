import { platformCopy } from "../copy/platformCopy";
import { OpsButton } from "./ui/OpsButton";

interface OpsArRowActionsProps {
  isDraft?: boolean;
  canChargeStripe?: boolean;
  onIssueDraft?: () => void;
  issueDraftPending?: boolean;
  onCharge?: () => void;
  onMarkPaid?: () => void;
  onVoid?: () => void;
}

/** Acciones densas de fila AR — OpsButton (fork de PlatformArRowActions buttons). */
export function OpsArRowActions({
  isDraft = false,
  canChargeStripe = false,
  onIssueDraft,
  issueDraftPending = false,
  onCharge,
  onMarkPaid,
  onVoid,
}: OpsArRowActionsProps) {
  const copy = platformCopy.ar.actions;

  if (isDraft) {
    if (!onIssueDraft) return null;
    return (
      <OpsButton
        size="sm"
        variant="primary"
        disabled={issueDraftPending}
        onClick={onIssueDraft}
      >
        {issueDraftPending ? copy.issueDraftSubmitting : copy.issueDraft}
      </OpsButton>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {canChargeStripe && onCharge ? (
        <OpsButton size="sm" variant="ghost" onClick={onCharge}>
          {copy.chargeStripe}
        </OpsButton>
      ) : null}
      {onMarkPaid ? (
        <OpsButton size="sm" variant="primary" onClick={onMarkPaid}>
          {copy.markPaid}
        </OpsButton>
      ) : null}
      {onVoid ? (
        <OpsButton size="sm" variant="danger" onClick={onVoid}>
          {copy.void}
        </OpsButton>
      ) : null}
    </div>
  );
}
