/**
 * FinanceDispatchPendingTable — Envíos pendientes (`EntityListTable`).
 *
 * Checkbox de lote (si selectable) · Documento · Cliente · Emisión · Total · Tipo.
 * Empty → null. Bajo ListPageShell: `framed={false}`.
 */

import { useMemo } from "react";
import { Badge } from "@shared/ui/badge";
import { Checkbox } from "@shared/ui/checkbox";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import type { DispatchDocumentItem } from "@features/invoicing";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import {
  dispatchDocumentSelectionKey,
  formatDispatchDocumentLabel,
} from "../utils/groupDispatchDocumentsForSend";
import { DispatchDocumentCell } from "./DispatchDocumentCell";

const copy = dispatchRunsCopy.workbench.pending;
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

interface FinanceDispatchPendingTableProps {
  documents: DispatchDocumentItem[];
  selected: Record<string, boolean>;
  /** Si false, tabla read-only sin checkboxes (sin invoices.execute). */
  selectable?: boolean;
  isLoading?: boolean;
  onToggle: (doc: DispatchDocumentItem, checked: boolean) => void;
  onTogglePage: (checked: boolean) => void;
}

function buildColumns(opts: {
  selectable: boolean;
  selected: Record<string, boolean>;
  selectAllState: boolean | "indeterminate";
  documentsLength: number;
  onToggle: (doc: DispatchDocumentItem, checked: boolean) => void;
  onTogglePage: (checked: boolean) => void;
}): EntityListColumnDef<DispatchDocumentItem>[] {
  const {
    selectable,
    selected,
    selectAllState,
    documentsLength,
    onToggle,
    onTogglePage,
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
  );

  return columns;
}

export function FinanceDispatchPendingTable({
  documents,
  selected,
  selectable = true,
  isLoading = false,
  onToggle,
  onTogglePage,
}: FinanceDispatchPendingTableProps) {
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
      }),
    [
      selectable,
      selected,
      selectAllState,
      documents.length,
      onToggle,
      onTogglePage,
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
