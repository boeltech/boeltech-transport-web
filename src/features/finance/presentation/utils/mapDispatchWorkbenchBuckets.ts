import type { WorkbenchBucket } from "@shared/ui/page-shells";
import {
  DISPATCH_WORKBENCH_TABS,
  type DispatchWorkbenchTabId,
} from "../config/dispatchWorkbenchConfig";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

const copy = dispatchRunsCopy.workbench;

export interface MapDispatchWorkbenchBucketsParams {
  activeTab: DispatchWorkbenchTabId;
  onTabChange: (tab: DispatchWorkbenchTabId) => void;
  /** Total de facturas stamped + unsent (badge Pendientes). */
  pendingCount?: number;
  /** Total de facturas stamped + sent (badge Enviadas, F4). */
  sentCount?: number;
}

export function mapDispatchWorkbenchBuckets({
  activeTab,
  onTabChange,
  pendingCount = 0,
  sentCount = 0,
}: MapDispatchWorkbenchBucketsParams): WorkbenchBucket[] {
  return DISPATCH_WORKBENCH_TABS.map((tab) => ({
    id: tab,
    label: copy.buckets[tab],
    description: copy.bucketDescriptions[tab],
    count:
      tab === "pending" ? pendingCount : tab === "sent" ? sentCount : 0,
    isActive: activeTab === tab,
    onClick: () => onTabChange(tab),
    tone: "default" as const,
  }));
}
