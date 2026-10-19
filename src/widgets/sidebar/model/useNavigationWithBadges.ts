import { useMemo } from "react";
import { usePendingApprovalsCount } from "@features/approvals";
import { useSettlementsNavBadges } from "@features/settlements/application";
import { useGpsAlertsSummary } from "@features/monitoring/application";
import { usePermissions } from "@shared/permissions";
import { useNavigation } from "./useNavigation";
import type { NavGroup, NavItem } from "./types";

export function enrichNavigationWithBadges(
  navigation: NavGroup[],
  pendingCount: number | undefined,
  settlementsBadges?: { payments: number; advances: number } | undefined,
  unreadGpsAlerts?: number | undefined,
): NavGroup[] {
  const hasApprovals = pendingCount != null && pendingCount > 0;
  const paymentsBadge = settlementsBadges?.payments ?? 0;
  const advancesBadge = settlementsBadges?.advances ?? 0;
  const hasSettlements = paymentsBadge > 0 || advancesBadge > 0;
  const hasGpsUnread = unreadGpsAlerts != null && unreadGpsAlerts > 0;

  if (!hasApprovals && !hasSettlements && !hasGpsUnread) {
    return navigation;
  }

  return navigation.map((group) => ({
    ...group,
    items: group.items.map((item): NavItem => {
      if (item.id === "finance-approvals" && hasApprovals) {
        return { ...item, badge: pendingCount };
      }
      if (item.id === "operator-payments-pagos" && paymentsBadge > 0) {
        return { ...item, badge: paymentsBadge };
      }
      if (item.id === "operator-payments-advances" && advancesBadge > 0) {
        return { ...item, badge: advancesBadge };
      }
      if (item.id === "gps-alerts" && hasGpsUnread) {
        return { ...item, badge: unreadGpsAlerts };
      }
      return item;
    }),
  }));
}

export function useNavigationWithBadges() {
  const base = useNavigation();
  const { data: pendingCount } = usePendingApprovalsCount();
  const { data: settlementsBadges } = useSettlementsNavBadges();
  const { hasPermission } = usePermissions();
  const canReadGps = hasPermission("gps_tracking", "read");
  const { data: gpsSummary } = useGpsAlertsSummary({ enabled: canReadGps });

  const navigation = useMemo(
    () =>
      enrichNavigationWithBadges(
        base.navigation,
        pendingCount,
        settlementsBadges,
        gpsSummary?.unreadCount,
      ),
    [
      base.navigation,
      pendingCount,
      settlementsBadges,
      gpsSummary?.unreadCount,
    ],
  );

  return {
    ...base,
    navigation,
  };
}
