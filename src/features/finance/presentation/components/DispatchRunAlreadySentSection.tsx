import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import { Button } from "@shared/ui/button";
import type {
  BillingDispatchClientReceipt,
  BillingDispatchRunItem,
  RecipientsByClient,
} from "../../domain/billingDispatchRun.types";
import {
  DispatchRunClientReceipts,
  DispatchRunRecipientsEditor,
} from "./DispatchRunRecipientsList";
import { DispatchRunItemStatusBadge } from "./DispatchRunItemStatusBadge";
import {
  DispatchRunClientGroup,
  DispatchRunFolioList,
} from "./DispatchRunClientGroup";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import {
  clientDisplayName,
  formatDispatchDocumentLabel,
  groupAlreadySentByClient,
  isRepDocument,
  partitionByDocumentKind,
} from "../utils/dispatchRunPreviewBuckets";
import type { ResendSelectionState } from "../utils/dispatchRunResendSelection";
import type { RecipientSelectionState } from "../utils/dispatchRunRecipientSelection";

const copy = dispatchRunsCopy.detail;

function DocumentRow({
  item,
  editable,
  checked,
  checkboxId,
  onToggle,
}: {
  item: BillingDispatchRunItem;
  editable: boolean;
  checked: boolean;
  checkboxId: string;
  onToggle: (checked: boolean) => void;
}) {
  const label = formatDispatchDocumentLabel(item, {
    invoice: copy.buckets.invoiceLabel,
    invoiceFallback: copy.buckets.invoiceFallback,
    rep: copy.buckets.repLabel,
    repFallback: copy.buckets.repFallback,
  });

  if (!editable) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span>{label}</span>
        <DispatchRunItemStatusBadge status={item.status} />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <Checkbox
        id={checkboxId}
        checked={checked}
        onCheckedChange={(value) => onToggle(value === true)}
      />
      <Label htmlFor={checkboxId} className="cursor-pointer font-normal">
        {label}
      </Label>
    </div>
  );
}

function DocumentKindSection({
  title,
  description,
  items,
  emptyCopy,
  editable,
  selection,
  recipientsByClient,
  clientReceipts,
  recipientSelection,
  listedClientIds,
  collapseGroups,
  onToggleInvoice,
  onTogglePayment,
  onSelectClient,
  onToggleRecipient,
}: {
  title: string;
  description?: string;
  items: BillingDispatchRunItem[];
  emptyCopy: string;
  editable: boolean;
  selection: ResendSelectionState;
  recipientsByClient: RecipientsByClient[];
  clientReceipts?: BillingDispatchClientReceipt[] | null;
  recipientSelection: RecipientSelectionState;
  listedClientIds: Set<string>;
  collapseGroups: boolean;
  onToggleInvoice: (invoiceId: string, checked: boolean) => void;
  onTogglePayment: (paymentId: string, checked: boolean) => void;
  onSelectClient: (clientId: string) => void;
  onToggleRecipient: (clientId: string, key: string, checked: boolean) => void;
}) {
  const byClient = groupAlreadySentByClient(items);
  const selectedInvoices = new Set(selection.invoiceIds);
  const selectedPayments = new Set(selection.paymentIds);
  const recipientsMap = new Map(
    recipientsByClient.map((group) => [group.clientId, group]),
  );

  if (items.length === 0) {
    return (
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
        <p className="text-sm text-muted-foreground">{emptyCopy}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
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
            key={`${title}-${clientId}`}
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
                if (isRepDocument(item)) {
                  const paymentId = item.paymentId;
                  if (!paymentId) {
                    return (
                      <span className="text-sm text-muted-foreground">
                        {copy.buckets.repFallback}
                      </span>
                    );
                  }
                  return (
                    <DocumentRow
                      item={item}
                      editable={editable}
                      checked={selectedPayments.has(paymentId)}
                      checkboxId={`dispatch-resend-pay-${paymentId}`}
                      onToggle={(checked) =>
                        onTogglePayment(paymentId, checked)
                      }
                    />
                  );
                }
                const invoiceId = item.invoiceId;
                if (!invoiceId) {
                  return (
                    <span className="text-sm text-muted-foreground">
                      {copy.buckets.invoiceFallback}
                    </span>
                  );
                }
                return (
                  <DocumentRow
                    item={item}
                    editable={editable}
                    checked={selectedInvoices.has(invoiceId)}
                    checkboxId={`dispatch-resend-inv-${invoiceId}`}
                    onToggle={(checked) => onToggleInvoice(invoiceId, checked)}
                  />
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
            {!editable &&
            clientReceipts?.some((receipt) => receipt.clientId === clientId) ? (
              <DispatchRunClientReceipts
                receipts={clientReceipts}
                clientId={clientId}
              />
            ) : null}
          </DispatchRunClientGroup>
        );
      })}
    </div>
  );
}

export function DispatchRunAlreadySentSection({
  items,
  recipientsByClient,
  clientReceipts,
  resendSelection,
  recipientSelection,
  editable,
  listedClientIds,
  collapseGroups,
  onToggleInvoice,
  onTogglePayment,
  onSelectAll,
  onClearSelection,
  onSelectClient,
  onToggleRecipient,
}: {
  items: BillingDispatchRunItem[];
  recipientsByClient: RecipientsByClient[];
  clientReceipts?: BillingDispatchClientReceipt[] | null;
  resendSelection: ResendSelectionState;
  recipientSelection: RecipientSelectionState;
  editable: boolean;
  /** Clientes que ya muestran destinatarios en «Listos para enviar». */
  listedClientIds: Set<string>;
  collapseGroups: boolean;
  onToggleInvoice: (invoiceId: string, checked: boolean) => void;
  onTogglePayment: (paymentId: string, checked: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onSelectClient: (clientId: string) => void;
  onToggleRecipient: (clientId: string, key: string, checked: boolean) => void;
}) {
  const { invoices, reps } = partitionByDocumentKind(items);
  const selectedCount =
    resendSelection.invoiceIds.length + resendSelection.paymentIds.length;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {copy.alreadySent.emptyBucket}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {editable ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onSelectAll}>
            {copy.alreadySent.selectAll}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={selectedCount === 0}
          >
            {copy.alreadySent.clearSelection}
          </Button>
        </div>
      ) : null}

      <DocumentKindSection
        title={copy.sections.invoices}
        items={invoices}
        emptyCopy={copy.alreadySent.emptyInvoices}
        editable={editable}
        selection={resendSelection}
        recipientsByClient={recipientsByClient}
        clientReceipts={clientReceipts}
        recipientSelection={recipientSelection}
        listedClientIds={listedClientIds}
        collapseGroups={collapseGroups}
        onToggleInvoice={onToggleInvoice}
        onTogglePayment={onTogglePayment}
        onSelectClient={onSelectClient}
        onToggleRecipient={onToggleRecipient}
      />

      <DocumentKindSection
        title={copy.sections.reps}
        description={copy.sections.repsPeriodHint}
        items={reps}
        emptyCopy={copy.alreadySent.emptyReps}
        editable={editable}
        selection={resendSelection}
        recipientsByClient={recipientsByClient}
        clientReceipts={clientReceipts}
        recipientSelection={recipientSelection}
        listedClientIds={listedClientIds}
        collapseGroups={collapseGroups}
        onToggleInvoice={onToggleInvoice}
        onTogglePayment={onTogglePayment}
        onSelectClient={onSelectClient}
        onToggleRecipient={onToggleRecipient}
      />
    </div>
  );
}
