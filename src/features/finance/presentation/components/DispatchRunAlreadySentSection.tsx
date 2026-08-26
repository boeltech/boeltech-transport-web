import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import { Button } from "@shared/ui/button";
import type {
  BillingDispatchRunItem,
  RecipientsByClient,
} from "../../domain/billingDispatchRun.types";
import { DispatchRunRecipientsEditor } from "./DispatchRunRecipientsList";
import {
  DispatchRunClientGroup,
  DispatchRunFolioList,
} from "./DispatchRunClientGroup";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import {
  clientDisplayName,
  groupAlreadySentByClient,
} from "../utils/dispatchRunPreviewBuckets";
import type { InvoiceSelectionState } from "../utils/dispatchRunResendSelection";
import type { RecipientSelectionState } from "../utils/dispatchRunRecipientSelection";

const copy = dispatchRunsCopy.detail;

export function DispatchRunAlreadySentSection({
  items,
  recipientsByClient,
  invoiceSelection,
  recipientSelection,
  editable,
  listedClientIds,
  collapseGroups,
  onToggleInvoice,
  onSelectAll,
  onClearSelection,
  onSelectClient,
  onToggleRecipient,
}: {
  items: BillingDispatchRunItem[];
  recipientsByClient: RecipientsByClient[];
  invoiceSelection: InvoiceSelectionState;
  recipientSelection: RecipientSelectionState;
  editable: boolean;
  /** Clientes que ya muestran destinatarios en «Listas para enviar». */
  listedClientIds: Set<string>;
  collapseGroups: boolean;
  onToggleInvoice: (invoiceId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onSelectClient: (clientId: string) => void;
  onToggleRecipient: (clientId: string, key: string, checked: boolean) => void;
}) {
  const byClient = groupAlreadySentByClient(items);
  const selected = new Set(invoiceSelection);
  const recipientsMap = new Map(
    recipientsByClient.map((group) => [group.clientId, group]),
  );

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {copy.alreadySent.emptyBucket}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {editable ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSelectAll}
          >
            {copy.alreadySent.selectAll}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={invoiceSelection.length === 0}
          >
            {copy.alreadySent.clearSelection}
          </Button>
        </div>
      ) : null}

      {Array.from(byClient.entries()).map(([clientId, clientItems]) => {
        const label = clientDisplayName(
          clientItems[0]!,
          copy.buckets.clientFallback,
        );
        const group = recipientsMap.get(clientId);
        const showRecipients =
          editable && group && !listedClientIds.has(clientId);
        const selectedKeys = recipientSelection[clientId] ?? [];
        const recipientTotal = group?.recipients.length ?? 0;

        return (
          <DispatchRunClientGroup
            key={clientId}
            title={label}
            invoiceCount={clientItems.length}
            recipientSelected={showRecipients ? selectedKeys.length : undefined}
            recipientTotal={showRecipients ? recipientTotal : undefined}
            hasZeroRecipients={
              showRecipients ? selectedKeys.length === 0 : false
            }
            defaultOpen={!collapseGroups}
            headerExtra={
              editable ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onSelectClient(clientId)}
                >
                  {copy.alreadySent.selectClient}
                </Button>
              ) : null
            }
          >
            <DispatchRunFolioList
              items={clientItems}
              renderItem={(item) => {
                const invoiceId = item.invoiceId;
                if (!invoiceId) {
                  return (
                    <span className="text-sm text-muted-foreground">
                      {copy.buckets.invoiceFallback}
                    </span>
                  );
                }
                const checkboxId = `dispatch-resend-${invoiceId}`;
                const checked = selected.has(invoiceId);
                if (!editable) {
                  return (
                    <span className="text-sm text-muted-foreground">
                      {item.folio
                        ? copy.buckets.invoiceLabel(item.folio)
                        : copy.buckets.invoiceFallback}
                    </span>
                  );
                }
                return (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Checkbox
                      id={checkboxId}
                      checked={checked}
                      onCheckedChange={(value) =>
                        onToggleInvoice(invoiceId, value === true)
                      }
                    />
                    <Label
                      htmlFor={checkboxId}
                      className="cursor-pointer font-normal"
                    >
                      {item.folio
                        ? copy.buckets.invoiceLabel(item.folio)
                        : copy.buckets.invoiceFallback}
                    </Label>
                  </div>
                );
              }}
            />
            {showRecipients ? (
              <DispatchRunRecipientsEditor
                groups={[group]}
                selection={recipientSelection}
                onToggle={onToggleRecipient}
              />
            ) : null}
          </DispatchRunClientGroup>
        );
      })}
    </div>
  );
}
