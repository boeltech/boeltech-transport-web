import { useMemo } from "react";
import { usePendingApprovalsCount } from "@features/approvals";
import { useNavigation } from "./useNavigation";
import type { NavGroup, NavItem } from "./types";

export function enrichNavigationWithBadges(
  navigation: NavGroup[],
  pendingCount: number | undefined,
): NavGroup[] {
  if (pendingCount == null || pendingCount <= 0) {
    return navigation;
  }

  return navigation.map((group) => ({
    ...group,
    items: group.items.map((item): NavItem =>
      item.id === "finance-approvals"
        ? { ...item, badge: pendingCount }
        : item,
    ),
  }));
}

export function useNavigationWithBadges() {
  const base = useNavigation();
  const { data: pendingCount } = usePendingApprovalsCount();

  const navigation = useMemo(
    () => enrichNavigationWithBadges(base.navigation, pendingCount),
    [base.navigation, pendingCount],
  );

  return {
    ...base,
    navigation,
  };
}
