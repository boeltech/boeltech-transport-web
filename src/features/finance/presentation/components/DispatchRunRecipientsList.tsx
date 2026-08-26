import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import type {
  BillingDispatchClientReceipt,
  DispatchRecipient,
  RecipientsByClient,
} from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import type { RecipientSelectionState } from "../utils/dispatchRunRecipientSelection";

const copy = dispatchRunsCopy.detail.recipients;

function RecipientReadOnly({ recipient }: { recipient: DispatchRecipient }) {
  return (
    <div className="min-w-0 py-1 leading-snug">
      <p className="text-sm text-foreground">{recipient.label}</p>
      <p className="truncate text-xs text-muted-foreground">{recipient.email}</p>
    </div>
  );
}

function RecipientRow({
  recipient,
  checked,
  disabled,
  onCheckedChange,
}: {
  recipient: DispatchRecipient;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const id = `dispatch-recipient-${recipient.key.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  return (
    <div className="flex items-start gap-2 py-1">
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <Label htmlFor={id} className="cursor-pointer font-normal">
        <span className="text-sm text-foreground">{recipient.label}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {recipient.email}
        </span>
      </Label>
    </div>
  );
}

export function DispatchRunRecipientsEditor({
  groups,
  selection,
  disabled,
  onToggle,
}: {
  groups: RecipientsByClient[];
  selection: RecipientSelectionState;
  disabled?: boolean;
  onToggle: (clientId: string, key: string, checked: boolean) => void;
}) {
  if (groups.length === 0) return null;

  return (
    <div className="space-y-3 border-t pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {copy.title}
      </p>
      {groups.map((group) => {
        if (group.recipients.length === 0) {
          return (
            <p key={group.clientId} className="text-xs text-destructive">
              {copy.empty}
            </p>
          );
        }
        const selected = new Set(selection[group.clientId] ?? []);
        return (
          <ul key={group.clientId} className="space-y-0.5">
            {group.recipients.map((recipient) => (
              <li key={recipient.key}>
                <RecipientRow
                  recipient={recipient}
                  checked={selected.has(recipient.key)}
                  disabled={disabled}
                  onCheckedChange={(checked) =>
                    onToggle(group.clientId, recipient.key, checked)
                  }
                />
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

export function DispatchRunRecipientsReadOnly({
  group,
}: {
  group: RecipientsByClient;
}) {
  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {copy.title}
      </p>
      {group.recipients.length === 0 ? (
        <p className="text-xs text-destructive">{copy.empty}</p>
      ) : (
        <ul className="space-y-0.5">
          {group.recipients.map((recipient) => (
            <li key={recipient.key}>
              <RecipientReadOnly recipient={recipient} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DispatchRunClientReceipts({
  receipts,
  clientId,
}: {
  receipts: BillingDispatchClientReceipt[];
  clientId: string;
}) {
  const receipt = receipts.find((row) => row.clientId === clientId);
  if (!receipt) {
    return (
      <p className="border-t pt-3 text-xs text-muted-foreground">
        {copy.receiptEmpty}
      </p>
    );
  }

  const title =
    receipt.status === "failed" ? copy.failedTitle : copy.sentTitle;

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      {receipt.recipients.length === 0 ? (
        <p className="text-xs text-muted-foreground">{copy.receiptEmpty}</p>
      ) : (
        <ul className="space-y-0.5">
          {receipt.recipients.map((recipient) => (
            <li key={recipient.key}>
              <RecipientReadOnly recipient={recipient} />
            </li>
          ))}
        </ul>
      )}
      {receipt.errorMessage ? (
        <p className="text-xs text-destructive">{receipt.errorMessage}</p>
      ) : null}
    </div>
  );
}
