import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@shared/ui/sheet";
import { formatDateTime } from "@shared/utils/dateUtils";
import type { ApprovalConcept } from "../../domain";
import { usePolicyVersions } from "../../application";
import { APPROVAL_CONCEPT_LABELS, approvalPoliciesCopy } from "../copy/approvalPoliciesCopy";
import { describePolicyDiffEntry } from "../utils/describePolicyDiff";

const copy = approvalPoliciesCopy.versions;

interface PolicyVersionsSheetProps {
  concept: ApprovalConcept | null;
  onOpenChange: (open: boolean) => void;
}

export function PolicyVersionsSheet({ concept, onOpenChange }: PolicyVersionsSheetProps) {
  return (
    <Sheet open={concept !== null} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex h-full w-full flex-col bg-background p-0 sm:max-w-lg"
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className="shrink-0 border-b bg-card px-6 py-4">
          <SheetTitle>{copy.title(concept ? APPROVAL_CONCEPT_LABELS[concept] : "")}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>
        {concept ? <VersionsList key={concept} concept={concept} /> : null}
      </SheetContent>
    </Sheet>
  );
}

function VersionsList({ concept }: { concept: ApprovalConcept }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, isFetching } = usePolicyVersions(concept, page);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{copy.loadError}</AlertDescription>
        </Alert>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.empty}</p>
      ) : (
        <>
          <ol className="space-y-3">
            {data.items.map((item) => (
              <li key={item.version} className="rounded-lg border bg-card p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral" tone="soft" className="text-xs">
                    {copy.version(item.version)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(item.effectiveFrom)}
                    {item.createdByName ? ` · ${copy.by(item.createdByName)}` : ""}
                  </span>
                  {item.source === "system_default_reset" ? (
                    <Badge variant="warning" tone="soft" className="text-xs">
                      {copy.resetSource}
                    </Badge>
                  ) : null}
                </div>
                {item.diffSummary.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm">
                    {item.diffSummary.map((entry, index) => (
                      <li key={index}>{describePolicyDiffEntry(entry, concept)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">{copy.noChanges}</p>
                )}
              </li>
            ))}
          </ol>
          {data.totalPages > 1 ? (
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => p - 1)}
              >
                {copy.next}
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {data.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                {copy.prev}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
