import { AlertWithIcon } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDateTime } from "@shared/utils/dateUtils";
import { useApprovalHistory } from "../../application/hooks/useApprovalHistory";
import type { ApprovableType, ApprovalHistoryEntry } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import {
  formatApprovalRole,
  formatFieldChanges,
  formatHistoryEventLabel,
} from "../utils/approvalFlowFormat";

const copy = approvalsCopy.history;

function formatHistoryReason(entry: ApprovalHistoryEntry): string | null {
  if (entry.eventType === "invalidated") return entry.reason?.trim() || null;
  const codeLabel = entry.reasonCode
    ? (approvalsCopy.returnSheet.reasonCodes as Record<string, string>)[entry.reasonCode]
    : null;
  const text = entry.reason?.trim() || null;
  if (codeLabel && text && text !== codeLabel) return `${codeLabel}: ${text}`;
  return text ?? codeLabel ?? null;
}

function HistoryEntryRow({ entry }: { entry: ApprovalHistoryEntry }) {
  const actor = entry.actorName?.trim() || copy.actorUnknown;
  const role = formatApprovalRole(entry.actorRole);
  const reason = formatHistoryReason(entry);
  const changes = formatFieldChanges(entry.changes);
  const policy =
    entry.policyVersion !== null ? copy.policyVersion(entry.policyVersion) : copy.policyStandard;

  return (
    <li className="space-y-1 border-l-2 border-muted pl-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{formatHistoryEventLabel(entry)}</span>
        {entry.stepNo ? (
          <Badge variant="neutral" tone="soft">
            {copy.step(entry.stepNo)}
          </Badge>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {actor}
        {role ? ` (${role})` : ""} · {formatDateTime(entry.createdAt)} · {policy}
      </p>
      {reason ? <p className="text-sm">{reason}</p> : null}
      {changes.length > 0 ? (
        <ul className="text-xs text-muted-foreground">
          {changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export interface ApprovalHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ApprovableType | null;
  id: string | null;
  /** Folio o referencia para la descripción. */
  subtitle?: string;
}

/** ADR-0099 (handoff F6 D4): historial de autorización de solo lectura. */
export function ApprovalHistorySheet({
  open,
  onOpenChange,
  type,
  id,
  subtitle,
}: ApprovalHistorySheetProps) {
  const history = useApprovalHistory(type, id, { enabled: open });
  const entries = history.data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col sm:max-w-lg"
        onFocusOutside={(event) => event.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          {subtitle ? <SheetDescription>{copy.description(subtitle)}</SheetDescription> : null}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {history.isLoading ? (
            <div className="space-y-3" aria-busy="true">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : history.isError ? (
            <AlertWithIcon variant="destructive" title={copy.loadError}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => void history.refetch()}
              >
                {copy.retry}
              </Button>
            </AlertWithIcon>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.empty}</p>
          ) : (
            <ol className="space-y-4">
              {entries.map((entry) => (
                <HistoryEntryRow key={entry.id} entry={entry} />
              ))}
            </ol>
          )}
        </div>

        <SheetFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {copy.close}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
