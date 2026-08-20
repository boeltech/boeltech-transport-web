import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { invoicingCopy } from "../copy/invoicingCopy";
import type { InvoiceCreateReadiness } from "../invoiceCreateReadiness";

const copy = invoicingCopy.checklist;

type ChecklistItemProps = {
  ok: boolean;
  label: string;
  doneHint: string;
  pendingHint: string;
  onAction?: () => void;
};

function ChecklistItem({
  ok,
  label,
  doneHint,
  pendingHint,
  onAction,
}: ChecklistItemProps) {
  const Icon = ok ? CheckCircle2 : Circle;
  const hint = ok ? doneHint : pendingHint;

  return (
    <li className="flex items-start gap-2">
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          ok ? "text-success" : "text-muted-foreground",
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-none">{label}</p>
        {onAction && !ok ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-1 text-left text-xs text-primary underline-offset-4 hover:underline"
          >
            {hint}
          </button>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    </li>
  );
}

export function InvoiceCreateReadinessChecklist({
  readiness,
  onFixReceiver,
  onFixConcepts,
  className,
}: {
  readiness: InvoiceCreateReadiness;
  onFixReceiver?: () => void;
  onFixConcepts?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-sm",
        className,
      )}
      aria-label={copy.title}
    >
      <p className="mb-3 text-sm font-semibold">{copy.title}</p>
      <ul className="space-y-3">
        <ChecklistItem
          ok={readiness.receiverOk}
          label={copy.receiver}
          doneHint={copy.receiverDone}
          pendingHint={copy.receiverPending}
          onAction={onFixReceiver}
        />
        <ChecklistItem
          ok={readiness.conceptsOk}
          label={copy.concepts}
          doneHint={copy.conceptsDone}
          pendingHint={copy.conceptsPending}
          onAction={onFixConcepts}
        />
        <ChecklistItem
          ok={readiness.totalOk}
          label={copy.total}
          doneHint={copy.totalDone}
          pendingHint={copy.totalPending}
        />
      </ul>
    </div>
  );
}
