import { useState } from "react";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { monitoringCopy } from "../copy/monitoringCopy";
import {
  historyRangeError,
  resolveHistoryPreset,
  type HistoryPeriodPreset,
  type HistoryPeriodRange,
} from "../utils/historyPeriod";

export interface HistoryPeriodToolbarProps {
  readonly preset: HistoryPeriodPreset;
  readonly range: HistoryPeriodRange;
  readonly onPresetChange: (
    preset: HistoryPeriodPreset,
    range: HistoryPeriodRange,
  ) => void;
  readonly className?: string;
}

const PRESETS: Array<Exclude<HistoryPeriodPreset, "custom">> = [
  "last4h",
  "today",
  "yesterday",
  "last24h",
];

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function HistoryPeriodToolbar({
  preset,
  range,
  onPresetChange,
  className,
}: HistoryPeriodToolbarProps) {
  const copy = monitoringCopy.history;
  const [customFrom, setCustomFrom] = useState(() =>
    toLocalInputValue(range.from),
  );
  const [customTo, setCustomTo] = useState(() => toLocalInputValue(range.to));
  const [customError, setCustomError] = useState<string | null>(null);

  const applyCustom = () => {
    const from = new Date(customFrom);
    const to = new Date(customTo);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      setCustomError(copy.rangeOrderError);
      return;
    }
    const err = historyRangeError(from, to);
    if (err === "order") {
      setCustomError(copy.rangeOrderError);
      return;
    }
    if (err === "max") {
      setCustomError(copy.rangeMaxError);
      return;
    }
    setCustomError(null);
    onPresetChange("custom", { from, to });
  };

  return (
    <div
      className={cn("space-y-2", className)}
      data-testid="history-period-toolbar"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-500">
        {copy.periodLabel}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((key) => (
          <Button
            key={key}
            type="button"
            size="sm"
            variant={preset === key ? "default" : "outline"}
            className={cn(
              "h-7 px-2.5 text-[11px]",
              preset === key
                ? "bg-emerald-600 text-white hover:bg-emerald-500"
                : "border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10",
            )}
            onClick={() => {
              setCustomError(null);
              onPresetChange(key, resolveHistoryPreset(key));
            }}
            data-testid={`history-preset-${key}`}
          >
            {copy.presets[key]}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant={preset === "custom" ? "default" : "outline"}
          className={cn(
            "h-7 px-2.5 text-[11px]",
            preset === "custom"
              ? "bg-emerald-600 text-white hover:bg-emerald-500"
              : "border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10",
          )}
          onClick={() => {
            setCustomFrom(toLocalInputValue(range.from));
            setCustomTo(toLocalInputValue(range.to));
            setCustomError(null);
            onPresetChange("custom", range);
          }}
          data-testid="history-preset-custom"
        >
          {copy.presets.custom}
        </Button>
      </div>

      {preset === "custom" ? (
        <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="space-y-1 text-[11px] text-zinc-400">
              <span>{copy.customFrom}</span>
              <Input
                type="datetime-local"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-8 border-white/10 bg-zinc-950/60 text-xs text-zinc-100"
                data-testid="history-custom-from"
              />
            </label>
            <label className="space-y-1 text-[11px] text-zinc-400">
              <span>{copy.customTo}</span>
              <Input
                type="datetime-local"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-8 border-white/10 bg-zinc-950/60 text-xs text-zinc-100"
                data-testid="history-custom-to"
              />
            </label>
          </div>
          {customError ? (
            <p className="text-[11px] text-destructive" role="alert">
              {customError}
            </p>
          ) : null}
          <Button
            type="button"
            size="sm"
            className="h-7 bg-emerald-600 text-xs hover:bg-emerald-500"
            onClick={applyCustom}
            data-testid="history-custom-apply"
          >
            {copy.applyCustom}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
