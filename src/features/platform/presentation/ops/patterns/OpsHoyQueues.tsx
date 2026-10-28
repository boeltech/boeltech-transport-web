import type { ReactNode } from "react";
import { OpsButton } from "../ui/OpsButton";
import type { HoyQueueId } from "../hoyQueues";
import { OpsEmptyState } from "./OpsEmptyState";
import { OpsTableSkeleton } from "./OpsTableSkeleton";

const HOY_PANEL_ID = "ops-hoy-queue-panel";

function hoyCountTone(
  id: HoyQueueId,
  count: number,
): "warn" | "danger" | undefined {
  if (count <= 0) return undefined;
  if (id === "past_due") return "warn";
  if (id === "suspended") return "danger";
  return undefined;
}

export interface OpsHoyQueueChip {
  id: HoyQueueId;
  label: string;
  count: number | string;
}

export interface OpsHoyQueuesProps {
  chips: OpsHoyQueueChip[];
  activeQueue: HoyQueueId;
  onQueueChange: (id: HoyQueueId) => void;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyTitle: string;
  emptyDescription: string;
  error?: {
    title: string;
    description: string;
    retryLabel: string;
    onRetry: () => void;
  } | null;
  children?: ReactNode;
}

/**
 * Colas Hoy — contadores mono display (M5) + empty/error Ops.
 */
export function OpsHoyQueues({
  chips,
  activeQueue,
  onQueueChange,
  isLoading = false,
  isEmpty = false,
  emptyTitle,
  emptyDescription,
  error = null,
  children,
}: OpsHoyQueuesProps) {
  return (
    <div className="space-y-3" data-testid="ops-hoy-queues">
      {error ? (
        <OpsEmptyState
          variant="error"
          title={error.title}
          description={error.description}
          action={
            <OpsButton variant="ghost" size="sm" onClick={error.onRetry}>
              {error.retryLabel}
            </OpsButton>
          }
        />
      ) : null}

      <div
        className="ops-hoy-queue-strip"
        role="tablist"
        aria-label="Colas"
      >
        {chips.map((chip) => {
          const numeric = typeof chip.count === "number" ? chip.count : null;
          const tone =
            !isLoading && numeric != null
              ? hoyCountTone(chip.id, numeric)
              : undefined;
          return (
            <button
              key={chip.id}
              id={`ops-hoy-tab-${chip.id}`}
              type="button"
              role="tab"
              aria-selected={activeQueue === chip.id}
              aria-controls={HOY_PANEL_ID}
              data-active={activeQueue === chip.id}
              data-ops-hoy-chip={chip.id}
              data-tick-tone={tone}
              className="ops-hoy-queue-chip"
              onClick={() => onQueueChange(chip.id)}
            >
              <span
                className="ops-hoy-queue-count"
                data-ops-hoy-count=""
                data-empty={
                  isLoading || numeric === 0 ? "true" : undefined
                }
                data-count-tone={tone}
              >
                {isLoading ? "…" : chip.count}
              </span>
              <span className="ops-hoy-queue-label">{chip.label}</span>
            </button>
          );
        })}
      </div>

      <div
        id={HOY_PANEL_ID}
        role="tabpanel"
        aria-labelledby={`ops-hoy-tab-${activeQueue}`}
      >
        {isLoading ? (
          <OpsTableSkeleton />
        ) : error ? null : isEmpty ? (
          <div data-testid="ops-hoy-empty">
            <OpsEmptyState title={emptyTitle} description={emptyDescription} />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
