import { useEffect, useRef } from "react";
import { cn } from "@shared/lib/utils/cn";
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

export function HistoryPointsTable({
  points,
  selectedSeq,
  onSelectSeq,
  className,
}: HistoryPointsTableProps) {
  const copy = monitoringCopy.history;
  const parity = monitoringCopy.parity;
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  useEffect(() => {
    if (selectedSeq == null) return;
    const row = rowRefs.current.get(selectedSeq);
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedSeq]);

  return (
    <div
      className={cn("flex min-h-0 flex-col", className)}
      data-testid="history-points-table"
    >
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {copy.tableTitle}
      </p>
      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-white/10">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-[1] bg-zinc-900/95 text-[10px] uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-2 py-2 font-medium">{copy.table.seq}</th>
              <th className="px-2 py-2 font-medium">{copy.table.time}</th>
              <th className="px-2 py-2 font-medium">{copy.table.movement}</th>
              <th className="px-2 py-2 font-medium">{copy.table.speed}</th>
              <th className="px-2 py-2 font-medium">{copy.table.course}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => {
              const selected = point.seq === selectedSeq;
              const heading = formatCardinalHeading(point.courseDeg);
              const movement = movementLabel(point.movementStatus, {
                moving: parity.movement.moving,
                stopped: parity.movement.stopped,
                empty: parity.empty,
              });
              return (
                <tr
                  key={point.seq}
                  ref={(el) => {
                    if (el) rowRefs.current.set(point.seq, el);
                    else rowRefs.current.delete(point.seq);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-selected={selected}
                  data-testid={`history-row-${point.seq}`}
                  onClick={() => onSelectSeq(point.seq)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectSeq(point.seq);
                    }
                  }}
                  className={cn(
                    "cursor-pointer border-t border-white/5 text-zinc-300 transition-colors",
                    "hover:bg-white/8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/60",
                    selected && "bg-emerald-500/15 text-zinc-50",
                  )}
                >
                  <td className="px-2 py-1.5 tabular-nums text-zinc-500">
                    {point.seq}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap tabular-nums">
                    {formatHistoryTableTime(point.recordedAt)}
                  </td>
                  <td className="px-2 py-1.5">{movement}</td>
                  <td className="px-2 py-1.5 tabular-nums">
                    {point.speedKmh != null
                      ? Math.round(point.speedKmh)
                      : parity.empty}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {heading?.label ?? parity.empty}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
