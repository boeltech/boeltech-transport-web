/**
 * FinanceDispatchSentTable — Envíos enviados (`EntityListTable`).
 *
 * Checkbox de lote (si selectable) · Documento · Cliente · Emisión · Enviado ·
 * Total · Tipo · Acciones. Empty → null. Bajo ListPageShell: `framed={false}`.
 */

import { useMemo } from "react";
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
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatDateTime } from "@shared/utils/dateUtils";
import type { DispatchDocumentItem } from "@features/invoicing";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import {
  dispatchDocumentSelectionKey,
  formatDispatchDocumentLabel,
} from "../utils/groupDispatchDocumentsForSend";
import { DispatchDocumentCell } from "./DispatchDocumentCell";

const copy = dispatchRunsCopy.workbench.sent;
const typeCopy = dispatchRunsCopy.workbench.documentLabels;

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

function buildColumns(opts: {
  selectable: boolean;
  selected: Record<string, boolean>;
  selectAllState: boolean | "indeterminate";
  documentsLength: number;
  onToggle: (doc: DispatchDocumentItem, checked: boolean) => void;
  onTogglePage: (checked: boolean) => void;
  onResend?: (doc: DispatchDocumentItem) => void;
  onView?: (doc: DispatchDocumentItem) => void;
}): EntityListColumnDef<DispatchDocumentItem>[] {
  const {
    selectable,
    selected,
    selectAllState,
    documentsLength,
    onToggle,
    onTogglePage,
    onResend,
    onView,
  } = opts;

  const columns: EntityListColumnDef<DispatchDocumentItem>[] = [];

  if (selectable) {
    columns.push({
      id: "select",
      header: (
        <Checkbox
          checked={selectAllState}
          onCheckedChange={(checked) => onTogglePage(checked === true)}
          aria-label={copy.selectAllAria}
          disabled={documentsLength === 0}
        />
      ) as unknown as string,
      kind: "text",
      className: "w-10",
      headerClassName: "w-10",
      accessor: (doc) => {
        const key = dispatchDocumentSelectionKey(doc);
        const label = formatDispatchDocumentLabel(doc);
        return (
          <span data-no-row-nav="" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={Boolean(selected[key])}
              onCheckedChange={(checked) => onToggle(doc, checked === true)}
              aria-label={copy.selectDocument(label)}
            />
          </span>
        );
      },
    });
  }

  columns.push(
    {
      id: "document",
      header: copy.columns.document,
      kind: "text",
      className: "font-medium",
      accessor: (doc) => <DispatchDocumentCell doc={doc} />,
    },
    {
      id: "client",
      header: copy.columns.client,
      kind: "stacked",
      accessor: (doc): EntityListStackedValue => {
        const name = doc.clientName?.trim();
        return {
          primary: name || doc.receiverRfc,
          secondary: name ? doc.receiverRfc : undefined,
        };
      },
    },
    {
      id: "issuedAt",
      header: copy.columns.issuedAt,
      kind: "date",
      accessor: (doc) => doc.stampedAt,
    },
    {
      id: "sentAt",
      header: copy.columns.sentAt,
      kind: "text",
      className: "whitespace-nowrap text-sm",
      accessor: (doc) =>
        doc.dispatchSentAt ? formatDateTime(doc.dispatchSentAt) : null,
    },
    {
      id: "total",
      header: copy.columns.total,
      kind: "money",
      accessor: (doc) => doc.amount,
    },
    {
      id: "type",
      header: copy.columns.type,
      kind: "status",
      accessor: (doc) => <TypeBadge doc={doc} />,
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (doc) => {
        const label = formatDispatchDocumentLabel(doc);
        const showView = doc.documentKind === "invoice" && Boolean(onView);
        const showRowActions = Boolean(onResend) || showView;
        if (!showRowActions) return null;
        return (
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
        );
      },
    },
  );

  return columns;
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

  const columns = useMemo(
    () =>
      buildColumns({
        selectable,
        selected,
        selectAllState,
        documentsLength: documents.length,
        onToggle,
        onTogglePage,
        onResend,
        onView,
      }),
    [
      selectable,
      selected,
      selectAllState,
      documents.length,
      onToggle,
      onTogglePage,
      onResend,
      onView,
    ],
  );

  return (
    <EntityListTable
      framed={false}
      density="list"
      aria-label={copy.entityLabelPlural}
      columns={columns}
      rows={documents}
      getRowId={(row) => dispatchDocumentSelectionKey(row)}
      isLoading={isLoading}
    />
  );
}
