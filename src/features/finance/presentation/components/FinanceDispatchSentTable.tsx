import { MoreHorizontal } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { DispatchDocumentItem } from "@features/invoicing";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import {
  dispatchDocumentSelectionKey,
  formatDispatchDocumentLabel,
} from "../utils/groupDispatchDocumentsForSend";
import { DispatchDocumentCell } from "./DispatchDocumentCell";

const copy = dispatchRunsCopy.workbench.sent;
const typeCopy = dispatchRunsCopy.workbench.documentLabels;
const SKELETON_ROWS = 8;

function ClientCell({ doc }: { doc: DispatchDocumentItem }) {
  const name = doc.clientName?.trim();
  return (
    <div className="min-w-0">
      <p className="truncate text-sm">{name || doc.receiverRfc}</p>
      {name ? (
        <p className="font-mono text-xs text-muted-foreground">
          {doc.receiverRfc}
        </p>
      ) : null}
    </div>
  );
}

function TypeBadge({ doc }: { doc: DispatchDocumentItem }) {
  const isRep = doc.documentKind === "rep";
  return (
    <Badge
      variant="neutral"
      tone="soft"
      className="text-xs font-medium"
      title={isRep ? typeCopy.typeRepLong : undefined}
      aria-label={isRep ? typeCopy.typeRepLong : undefined}
    >
      {isRep ? typeCopy.typeRep : typeCopy.typeInvoice}
    </Badge>
  );
}

interface FinanceDispatchSentTableProps {
  documents: DispatchDocumentItem[];
  selected: Record<string, boolean>;
  selectable?: boolean;
  isLoading?: boolean;
  onToggle: (doc: DispatchDocumentItem, checked: boolean) => void;
  onTogglePage: (checked: boolean) => void;
  /** Reenvío unitario: factura → SendInvoiceDialog; REP → SendRepDialog. */
  onResend?: (doc: DispatchDocumentItem) => void;
  onView?: (doc: DispatchDocumentItem) => void;
}

export function FinanceDispatchSentTable({
  documents,
  selected,
  selectable = true,
  isLoading = false,
  onToggle,
  onTogglePage,
  onResend,
  onView,
}: FinanceDispatchSentTableProps) {
  const selectedOnPage = documents.filter(
    (doc) => selected[dispatchDocumentSelectionKey(doc)],
  );
  const allSelected =
    selectable &&
    documents.length > 0 &&
    selectedOnPage.length === documents.length;
  const someSelected =
    selectable && selectedOnPage.length > 0 && !allSelected;
  const selectAllState = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  if (isLoading) {
    return (
      <>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                {selectable ? <TableHead className="w-10" /> : null}
                <TableHead>{copy.columns.document}</TableHead>
                <TableHead>{copy.columns.client}</TableHead>
                <TableHead>{copy.columns.issuedAt}</TableHead>
                <TableHead>{copy.columns.sentAt}</TableHead>
                <TableHead className="text-right">{copy.columns.total}</TableHead>
                <TableHead>{copy.columns.type}</TableHead>
                <TableHead className="w-10">{copy.columns.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                <TableRow key={index}>
                  {selectable ? (
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-6" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="space-y-3 md:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable ? (
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectAllState}
                    onCheckedChange={(checked) =>
                      onTogglePage(checked === true)
                    }
                    aria-label={copy.selectAllAria}
                    disabled={documents.length === 0}
                  />
                </TableHead>
              ) : null}
              <TableHead>{copy.columns.document}</TableHead>
              <TableHead>{copy.columns.client}</TableHead>
              <TableHead>{copy.columns.issuedAt}</TableHead>
              <TableHead>{copy.columns.sentAt}</TableHead>
              <TableHead className="text-right">{copy.columns.total}</TableHead>
              <TableHead>{copy.columns.type}</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">{copy.columns.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => {
              const key = dispatchDocumentSelectionKey(doc);
              const label = formatDispatchDocumentLabel(doc);
              const isChecked = Boolean(selected[key]);
              const showView = doc.documentKind === "invoice" && Boolean(onView);
              const showRowActions = Boolean(onResend) || showView;
              return (
                <TableRow key={key}>
                  {selectable ? (
                    <TableCell>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          onToggle(doc, checked === true)
                        }
                        aria-label={copy.selectDocument(label)}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell className="font-medium">
                    <DispatchDocumentCell doc={doc} />
                  </TableCell>
                  <TableCell>
                    <ClientCell doc={doc} />
                  </TableCell>
                  <TableCell>
                    {doc.stampedAt ? formatDate(doc.stampedAt) : "—"}
                  </TableCell>
                  <TableCell>
                    {doc.dispatchSentAt ? (
                      <span className="whitespace-nowrap text-sm">
                        {formatDateTime(doc.dispatchSentAt)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMxCurrency(doc.amount)}
                  </TableCell>
                  <TableCell>
                    <TypeBadge doc={doc} />
                  </TableCell>
                  <TableCell>
                    {showRowActions ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={copy.rowActionsAria(label)}
                          >
                            <MoreHorizontal className="h-4 w-4" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {showView ? (
                            <DropdownMenuItem onSelect={() => onView?.(doc)}>
                              {copy.actions.view}
                            </DropdownMenuItem>
                          ) : null}
                          {onResend ? (
                            <DropdownMenuItem onSelect={() => onResend(doc)}>
                              {copy.actions.resend}
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y md:hidden">
        {selectable ? (
          <div className="flex items-center gap-3 py-3">
            <Checkbox
              checked={selectAllState}
              onCheckedChange={(checked) => onTogglePage(checked === true)}
              aria-label={copy.selectAllAria}
              disabled={documents.length === 0}
            />
            <span className="text-sm font-medium">{copy.selectAllAria}</span>
          </div>
        ) : null}
        {documents.map((doc) => {
          const key = dispatchDocumentSelectionKey(doc);
          const label = formatDispatchDocumentLabel(doc);
          return (
            <div key={key} className="flex items-start gap-3 py-3">
              {selectable ? (
                <div className="pt-1">
                  <Checkbox
                    checked={Boolean(selected[key])}
                    onCheckedChange={(checked) =>
                      onToggle(doc, checked === true)
                    }
                    aria-label={copy.selectDocument(label)}
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1 space-y-1">
                <DispatchDocumentCell doc={doc} />
                <ClientCell doc={doc} />
                <p className="text-xs text-muted-foreground">
                  {copy.columns.sentAt}:{" "}
                  {doc.dispatchSentAt
                    ? formatDateTime(doc.dispatchSentAt)
                    : "—"}
                </p>
                <TypeBadge doc={doc} />
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">
                  {copy.columns.total}
                </p>
                <p className="font-semibold tabular-nums">
                  {formatMxCurrency(doc.amount)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
