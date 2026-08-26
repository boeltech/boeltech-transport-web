import { useState } from "react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import type { ClientSendResultRow } from "../utils/dispatchRunPreviewBuckets";

const copy = dispatchRunsCopy.detail.result;

function statusBadge(status: ClientSendResultRow["status"]) {
  if (status === "failed") {
    return <Badge variant="destructive">{copy.statusFailed}</Badge>;
  }
  if (status === "mixed") {
    return <Badge variant="warning">{copy.statusMixed}</Badge>;
  }
  return <Badge variant="success">{copy.statusSent}</Badge>;
}

function ResultRow({ row }: { row: ClientSendResultRow }) {
  const [open, setOpen] = useState(false);
  const label =
    row.clientRfc != null && row.clientRfc.length > 0
      ? `${row.clientName} · ${row.clientRfc}`
      : row.clientName;

  return (
    <div className="space-y-2 rounded-md border px-3 py-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {copy.folioCount(row.folioCount)}
            {" · "}
            {copy.recipientCount(row.recipientCount)}
          </p>
          {row.errorMessage ? (
            <p className="text-xs text-destructive">{row.errorMessage}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statusBadge(row.status)}
          {row.folios.length > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen((v) => !v)}
            >
              {copy.expandFolios}
            </Button>
          ) : null}
        </div>
      </div>
      {open && row.folios.length > 0 ? (
        <ul className="space-y-0.5 border-t pt-2 text-xs text-muted-foreground">
          {row.folios.map((folio) => (
            <li key={folio}>
              {dispatchRunsCopy.detail.buckets.invoiceLabel(folio)}
            </li>
          ))}
        </ul>
      ) : null}
      {row.recipientCount === 0 && row.receiptStatus == null ? (
        <p className="text-xs text-muted-foreground">{copy.noReceipts}</p>
      ) : null}
    </div>
  );
}

export function DispatchRunSendResults({
  rows,
}: {
  rows: ClientSendResultRow[];
}) {
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.byClientTitle}</CardTitle>
        <CardDescription>{copy.byClientDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <ResultRow key={row.clientId} row={row} />
        ))}
      </CardContent>
    </Card>
  );
}
