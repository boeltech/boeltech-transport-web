/**
 * Sheet mínimo de elección de borradores ligados (F9b / D18′).
 * Patrón cercano a TripInvoiceScopeDecisionSheet — overlay de elección, no create.
 */

import { FileText } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { tripDetailCopy } from "../copy";
import type { LinkedTripInvoiceDraft } from "../helpers/listLinkedTripInvoiceDrafts";

const copy = tripDetailCopy.shell.linkedDraftsSheet;

const SHEET_CONTENT_CLASS =
  "flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-md";
const SHEET_HEADER_CLASS =
  "shrink-0 space-y-1 border-b px-6 py-4 text-left";
const SHEET_BODY_CLASS =
  "min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4";
const SHEET_FOOTER_CLASS =
  "mt-auto shrink-0 flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end";

export type TripLinkedInvoiceDraftsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: readonly LinkedTripInvoiceDraft[];
  onSelectDraft: (invoiceId: string) => void;
};

function draftRowLabel(draft: LinkedTripInvoiceDraft): string {
  return draft.source === "principal" ? copy.rowPrincipal : copy.rowAccessory;
}

export function TripLinkedInvoiceDraftsSheet({
  open,
  onOpenChange,
  drafts,
  onSelectDraft,
}: TripLinkedInvoiceDraftsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={SHEET_CONTENT_CLASS}
        side="right"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className={SHEET_HEADER_CLASS}>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        <div className={SHEET_BODY_CLASS}>
          {drafts.length === 0 ? null : (
            <ul className="space-y-2" role="list">
              {drafts.map((draft) => {
                const label = draftRowLabel(draft);
                return (
                  <li key={draft.id}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 rounded-lg border bg-background px-3 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      data-testid={`trip-linked-draft-row-${draft.id}`}
                      onClick={() => {
                        onSelectDraft(draft.id);
                        onOpenChange(false);
                      }}
                    >
                      <FileText
                        className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <span className="min-w-0 space-y-0.5">
                        <span className="block text-sm font-medium">{label}</span>
                        {draft.folio ? (
                          <span className="block text-xs text-muted-foreground">
                            {draft.folio}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <SheetFooter className={SHEET_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            data-testid="trip-linked-drafts-sheet-close"
            onClick={() => onOpenChange(false)}
          >
            {copy.close}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default TripLinkedInvoiceDraftsSheet;
