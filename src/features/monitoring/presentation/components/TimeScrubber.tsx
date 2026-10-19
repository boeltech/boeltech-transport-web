import type { FleetHistoryPoint } from "../../domain";
import { monitoringCopy } from "../copy/monitoringCopy";
import { formatHistoryTableTime } from "../utils/formatAbsoluteTime";
import { cn } from "@shared/lib/utils/cn";

export interface TimeScrubberProps {
  readonly points: FleetHistoryPoint[];
  readonly selectedSeq: number | null;
  readonly onSelectSeq: (seq: number) => void;
  readonly className?: string;
}

export function TimeScrubber({
  points,
  selectedSeq,
  onSelectSeq,
  className,
}: TimeScrubberProps) {
  const copy = monitoringCopy.history;
  if (points.length === 0) return null;

  const index =
    selectedSeq != null
      ? Math.max(
          0,
          points.findIndex((p) => p.seq === selectedSeq),
        )
      : 0;
  const safeIndex = index < 0 ? 0 : index;
  const current = points[safeIndex]!;

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2.5 backdrop-blur-md",
        className,
      )}
      data-testid="history-time-scrubber"
    >
      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
        <span className="tabular-nums">
          {formatHistoryTableTime(points[0]!.recordedAt)}
        </span>
        <span className="font-medium text-zinc-200 tabular-nums">
          {formatHistoryTableTime(current.recordedAt)}
        </span>
        <span className="tabular-nums">
          {formatHistoryTableTime(points[points.length - 1]!.recordedAt)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={points.length - 1}
        step={1}
        value={safeIndex}
        aria-label={copy.scrubberAria}
        onChange={(e) => {
          const next = points[Number(e.target.value)];
          if (next) onSelectSeq(next.seq);
        }}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-700 accent-emerald-500",
          "[&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:bg-emerald-400",
        )}
        data-testid="history-scrubber-input"
      />
    </div>
  );
}
