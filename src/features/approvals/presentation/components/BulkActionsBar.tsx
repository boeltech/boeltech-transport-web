import { Button } from "@shared/ui/button";
import { approvalsCopy } from "../copy/approvalsCopy";

const copy = approvalsCopy.inbox.bulk;

interface BulkActionsBarProps {
  selectedCount: number;
  maxSelection: number;
  canUpdate: boolean;
  onApproveSelected: () => void;
  onRejectSelected: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  maxSelection,
  canUpdate,
  onApproveSelected,
  onRejectSelected,
  onClearSelection,
}: BulkActionsBarProps) {
  if (!canUpdate || selectedCount === 0) {
    return null;
  }

  const atLimit = selectedCount >= maxSelection;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
      <span className="text-sm font-medium">{copy.selected(selectedCount)}</span>
      {atLimit ? (
        <span className="text-xs text-muted-foreground">{copy.maxSelection}</span>
      ) : null}
      <div className="ml-auto flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClearSelection}>
          {copy.clearSelection}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onApproveSelected}>
          {copy.approve}
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onRejectSelected}
        >
          {copy.reject}
        </Button>
      </div>
    </div>
  );
}
