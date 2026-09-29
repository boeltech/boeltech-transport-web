import type { WorkbenchBucket } from "@shared/ui/page-shells";
import { FINANCE_DISPATCH_PERIOD_PATH } from "../../application/financeRoutes";
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
  /** Total de facturas stamped + sent (badge Enviadas). */
  sentCount?: number;
  /** Total de envíos del periodo (`pagination.total`). */
  periodCount?: number;
}

export function mapDispatchWorkbenchBuckets({
  activeTab,
  onTabChange,
  pendingCount = 0,
  sentCount = 0,
  periodCount = 0,
}: MapDispatchWorkbenchBucketsParams): WorkbenchBucket[] {
  const buckets: WorkbenchBucket[] = DISPATCH_WORKBENCH_TABS.map((tab) => ({
    id: tab,
    label: copy.buckets[tab],
    description: copy.bucketDescriptions[tab],
    count: tab === "pending" ? pendingCount : sentCount,
    isActive: activeTab === tab,
    onClick: () => onTabChange(tab),
    tone: "default" as const,
  }));

  buckets.push({
    id: "period",
    label: copy.buckets.period,
    description: copy.bucketDescriptions.period,
    count: periodCount,
    isActive: false,
    onClick: () => undefined,
    tone: "default",
    crossLink: {
      href: FINANCE_DISPATCH_PERIOD_PATH,
      label: copy.periodLinkAria,
    },
  });

  return buckets;
}
