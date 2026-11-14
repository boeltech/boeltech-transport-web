/**
 * DispatchRunReadyTable — documentos listos en detalle de corrida (`EntityListTable`).
 *
 * Folio · Cliente · Estado. Empty → null (host pinta empty del bucket).
 * Host ya enmarca en Card + border: `framed={false}`. Sin checkboxes.
 */

import { Badge } from "@shared/ui/badge";
import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
import type { BillingDispatchRunItem } from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import {
  clientDisplayName,
  isRepDocument,
  shortId,
} from "../utils/dispatchRunPreviewBuckets";
import { DispatchRunItemStatusBadge } from "./DispatchRunItemStatusBadge";

const copy = dispatchRunsCopy.detail;

/** UUID canónico (36) o seudofolio largo sin serie humana → truncar en Folio. */
function looksLikeOpaqueId(value: string): boolean {
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    return true;
  }
  return value.length > 16 && !/[A-Za-z]+-\d+/.test(value);
}

function formatFolio(item: BillingDispatchRunItem): string {
  const folio = item.folio?.trim();
  if (folio) {
    return looksLikeOpaqueId(folio) ? shortId(folio, 8) : folio;
  }
  if (isRepDocument(item) && item.paymentId) {
    return shortId(item.paymentId, 8);
  }
  if (item.invoiceId) {
    return shortId(item.invoiceId, 8);
  }
  return "—";
}

function ReadyStatusCell({ item }: { item: BillingDispatchRunItem }) {
  if (item.status === "listed" || item.status === "queued") {
    return (
      <Badge variant="success" tone="soft" className="w-fit shrink-0">
        {copy.table.readyStatus}
      </Badge>
    );
  }

  return (
    <div className="flex w-fit max-w-full flex-col items-start gap-0.5">
      <DispatchRunItemStatusBadge status={item.status} />
      {item.status === "failed" && item.errorMessage ? (
        <span className="text-xs text-destructive">{item.errorMessage}</span>
      ) : null}
    </div>
  );
}

const columns: EntityListColumnDef<BillingDispatchRunItem>[] = [
  {
    id: "folio",
    header: copy.table.folio,
    kind: "code",
    className: "font-medium tabular-nums",
    accessor: (item) => formatFolio(item),
  },
  {
    id: "client",
    header: copy.table.client,
    kind: "text",
    className: "max-w-[16rem]",
    accessor: (item) => clientDisplayName(item, copy.buckets.clientFallback),
  },
  {
    id: "status",
    header: copy.table.status,
    kind: "status",
    className: "w-[1%] whitespace-nowrap",
    accessor: (item) => <ReadyStatusCell item={item} />,
  },
];

export function DispatchRunReadyTable({
  items,
}: {
  items: BillingDispatchRunItem[];
}) {
  return (
    <EntityListTable
      framed={false}
      density="list"
      aria-label={copy.buckets.readyTitle}
      columns={columns}
      rows={items}
      getRowId={(row) => row.id}
    />
  );
}
