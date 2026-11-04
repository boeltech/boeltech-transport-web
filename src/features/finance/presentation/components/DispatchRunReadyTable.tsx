import { Badge } from "@shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
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

export function DispatchRunReadyTable({
  items,
}: {
  items: BillingDispatchRunItem[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{copy.table.folio}</TableHead>
          <TableHead>{copy.table.client}</TableHead>
          <TableHead>{copy.table.status}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium tabular-nums">
              {formatFolio(item)}
            </TableCell>
            <TableCell className="max-w-[16rem] truncate">
              {clientDisplayName(item, copy.buckets.clientFallback)}
            </TableCell>
            <TableCell className="w-[1%] whitespace-nowrap">
              <ReadyStatusCell item={item} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
