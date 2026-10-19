import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Input } from "@shared/ui/input";
import { Skeleton } from "@shared/ui/skeleton";
import type { FleetVehiclePosition, FleetPositionsSummary } from "../../domain";
import { monitoringCopy } from "../copy/monitoringCopy";
import { FleetPanelRow } from "./FleetPanelRow";

export interface FleetPanelProps {
  readonly positions: FleetVehiclePosition[];
  readonly summary?: FleetPositionsSummary;
  readonly selectedVehicleId: string | null;
  readonly isLoading: boolean;
  readonly collapsed: boolean;
  readonly onToggleCollapsed: () => void;
  readonly onSelect: (position: FleetVehiclePosition) => void;
}

function matchesSearch(p: FleetVehiclePosition, q: string): boolean {
  if (!q) return true;
  const hay = [
    p.vehicleEconomicNumber,
    p.vehiclePlate,
    p.imei,
    p.vehicleBrand,
    p.vehicleModel,
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function FleetPanel({
  positions,
  summary,
  selectedVehicleId,
  isLoading,
  collapsed,
  onToggleCollapsed,
  onSelect,
}: FleetPanelProps) {
  const copy = monitoringCopy.fleet;
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();

  const filtered = useMemo(
    () => positions.filter((p) => matchesSearch(p, normalized)),
    [positions, normalized],
  );

  return (
    <aside
      className={cn(
        "absolute inset-y-0 right-0 z-20 flex transition-[width] duration-300 ease-out",
        collapsed ? "w-0" : "w-full max-w-[320px] sm:w-[320px]",
      )}
      aria-label={copy.panelTitle}
    >
      <button
        type="button"
        onClick={onToggleCollapsed}
        className={cn(
          "absolute top-1/2 z-30 flex h-10 w-7 -translate-y-1/2 items-center justify-center",
          "rounded-l-md border border-r-0 border-white/10 bg-zinc-950/85 text-zinc-200 backdrop-blur-md",
          "hover:bg-zinc-900/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success/50",
          collapsed ? "right-0 rounded-r-md border-r" : "-left-7",
        )}
        aria-label={collapsed ? copy.expandPanel : copy.collapsePanel}
        aria-expanded={!collapsed}
        data-testid="fleet-panel-toggle"
      >
        {collapsed ? (
          <ChevronLeft className="h-4 w-4" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4" aria-hidden />
        )}
      </button>

      {!collapsed ? (
        <div
          className={cn(
            "flex h-full w-full flex-col border-l border-white/10",
            "bg-zinc-950/80 text-zinc-100 shadow-2xl backdrop-blur-xl",
          )}
        >
          <div className="space-y-3 border-b border-white/10 px-4 pb-3 pt-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                  {copy.panelTitle}
                </p>
                {summary ? (
                  <p className="mt-1 text-xs text-zinc-400">
                    {copy.summary(summary.online, summary.totalLinked)}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={copy.searchPlaceholder}
                aria-label={copy.searchAria}
                className={cn(
                  "h-9 border-white/10 bg-white/5 pl-8 text-sm text-zinc-100",
                  "placeholder:text-zinc-500 focus-visible:ring-success/40",
                )}
                data-testid="fleet-panel-search"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2">
            {isLoading && positions.length === 0 ? (
              <div className="space-y-2 p-2" aria-label={copy.loadingAria}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-14 w-full rounded-xl bg-white/10"
                  />
                ))}
              </div>
            ) : (
              <ul className="space-y-0.5">
                {filtered.map((position) => (
                  <li key={position.vehicleId}>
                    <FleetPanelRow
                      position={position}
                      selected={selectedVehicleId === position.vehicleId}
                      onSelect={onSelect}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
