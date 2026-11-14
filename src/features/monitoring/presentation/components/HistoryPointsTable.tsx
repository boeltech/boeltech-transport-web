/**
 * HistoryPointsTable — puntos GPS del recorrido (`EntityListTable`).
 *
 * Seq · Hora · Movimiento · Velocidad · Rumbo. Selección vía onRowActivate.
 * Host FleetHistoryPage (panel oscuro, no ListPageShell): `framed={false}`.
 * Empty → null. Sin sort API. Hora compacta de dominio (no ISO crudo).
 */

import { useEffect, type HTMLAttributes, type KeyboardEvent } from "react";
import { cn } from "@shared/lib/utils/cn";
import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
import type { FleetHistoryPoint } from "../../domain";
import { monitoringCopy } from "../copy/monitoringCopy";
import { formatCardinalHeading } from "../utils/cardinalHeading";
import { formatHistoryTableTime } from "../utils/formatAbsoluteTime";
import { movementLabel } from "../utils/movementLabel";

export interface HistoryPointsTableProps {
  readonly points: FleetHistoryPoint[];
  readonly selectedSeq: number | null;
  readonly onSelectSeq: (seq: number) => void;
  readonly className?: string;
}

function buildColumns(): EntityListColumnDef<FleetHistoryPoint>[] {
  const copy = monitoringCopy.history;
  const parity = monitoringCopy.parity;

  return [
    {
      id: "seq",
      header: copy.table.seq,
      kind: "number",
      className: "text-muted-foreground",
      accessor: (point) => point.seq,
    },
    {
      id: "time",
      header: copy.table.time,
      kind: "meta",
      className: "whitespace-nowrap tabular-nums",
      accessor: (point) => formatHistoryTableTime(point.recordedAt),
    },
    {
      id: "movement",
      header: copy.table.movement,
      kind: "text",
      accessor: (point) =>
        movementLabel(point.movementStatus, {
          moving: parity.movement.moving,
          stopped: parity.movement.stopped,
          empty: parity.empty,
        }),
    },
    {
      id: "speed",
      header: copy.table.speed,
      kind: "number",
      accessor: (point) =>
        point.speedKmh != null ? Math.round(point.speedKmh) : parity.empty,
    },
    {
      id: "course",
      header: copy.table.course,
      kind: "meta",
      className: "whitespace-nowrap",
      accessor: (point) => {
        const heading = formatCardinalHeading(point.courseDeg);
        return heading?.label ?? parity.empty;
      },
    },
  ];
}

export function HistoryPointsTable({
  points,
  selectedSeq,
  onSelectSeq,
  className,
}: HistoryPointsTableProps) {
  const copy = monitoringCopy.history;
  const columns = buildColumns();

  useEffect(() => {
    if (selectedSeq == null) return;
    const row = document.querySelector<HTMLElement>(
      `[data-testid="history-row-${selectedSeq}"]`,
    );
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedSeq]);

  return (
    <div
      className={cn("flex min-h-0 flex-col", className)}
      data-testid="history-points-table"
    >
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {copy.tableTitle}
      </p>
      <EntityListTable
        framed={false}
        density="list"
        stickyHeader
        aria-label={copy.tableTitle}
        className="min-h-0 flex-1 overflow-auto [&_table]:text-xs"
        columns={columns}
        rows={points}
        getRowId={(row) => String(row.seq)}
        onRowActivate={(point) => onSelectSeq(point.seq)}
        getRowClassName={(point) =>
          point.seq === selectedSeq ? "bg-primary/10" : undefined
        }
        getRowProps={(point) => {
          const selected = point.seq === selectedSeq;
          // Sin role="button": EntityListTable trata [role=button] como target
          // interactivo y cancela onRowActivate.
          return {
            tabIndex: 0,
            "aria-selected": selected,
            "data-testid": `history-row-${point.seq}`,
            onKeyDown: (e: KeyboardEvent<HTMLTableRowElement>) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectSeq(point.seq);
              }
            },
          } as HTMLAttributes<HTMLTableRowElement>;
        }}
      />
    </div>
  );
}
