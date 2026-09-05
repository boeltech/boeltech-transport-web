import type { DriverSettlement } from "../../domain/entities";
import type { SettlementWorkbenchNavBucket } from "../config/settlementWorkbenchConfig";
import { settlementsCopy } from "../copy/settlementsCopy";
import { SettlementsTable } from "./SettlementsTable";
import { SettlementCard } from "./SettlementCard";
import { SettlementCardSkeleton } from "./SettlementCard";

const copy = settlementsCopy.workbench;

interface SettlementPipelineQueueProps {
  bucket: SettlementWorkbenchNavBucket;
  settlements: DriverSettlement[];
  isLoading: boolean;
  viewMode: "table" | "cards";
  onView: (id: string) => void;
  onDisburse?: (settlement: DriverSettlement) => void;
  onActionComplete?: () => void;
}

export function SettlementPipelineQueue({
  bucket,
  settlements,
  isLoading,
  viewMode,
  onView,
  onDisburse,
  onActionComplete,
}: SettlementPipelineQueueProps) {
  const hideDisburse = bucket !== "payable";
  const showRejectedCorrection = bucket === "draft";

  if (!isLoading && settlements.length === 0) {
    return (
      <div className="rounded-md border bg-card p-8 text-center space-y-2">
        <p className="text-sm font-medium">{copy.empty.pipelineTitle}</p>
        <p className="text-sm text-muted-foreground">{copy.empty.pipelineDescription}</p>
      </div>
    );
  }

  if (viewMode === "cards") {
    if (isLoading) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SettlementCardSkeleton key={index} />
          ))}
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {settlements.map((settlement) => (
          <SettlementCard
            key={settlement.id}
            settlement={settlement}
            onView={onView}
            onDisburse={hideDisburse ? undefined : onDisburse}
            onActionComplete={onActionComplete}
            showRejectedCorrection={showRejectedCorrection}
          />
        ))}
      </div>
    );
  }

  return (
    <SettlementsTable
      settlements={settlements}
      isLoading={isLoading}
      onView={onView}
      onDisburse={hideDisburse ? undefined : onDisburse}
      onActionComplete={onActionComplete}
      showRejectedCorrection={showRejectedCorrection}
      emptyMessage={copy.empty.pipelineDescription}
      columnMode="pipeline"
    />
  );
}
