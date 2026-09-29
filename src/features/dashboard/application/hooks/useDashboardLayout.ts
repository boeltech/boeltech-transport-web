import { useCallback, useMemo, useState, useEffect } from "react";

import { useAuth } from "@/features/auth";
import type { UserRole } from "@shared/constants/roles";
import { isClientPortalRole, isDriverPortalRole } from "@shared/constants/roles";
import {
  usePermissions,
  canAccessFinanceSummaryRoute,
} from "@shared/permissions";
import {
  buildRoleDefaultLayout,
  mergeWithDefaults,
  getVisibleWidgetsInOrder,
  getCustomizableWidgets,
  setWidgetVisibility,
  reorderWidgets,
  type DashboardLayout,
  type DashboardWidgetGateContext,
  type DashboardWidgetPref,
  type WidgetId,
} from "../../domain/layout";
import { dashboardLayoutStore } from "../../infrastructure/layoutStore";
import {
  DASHBOARD_WIDGETS,
  getWidgetRegistryEntry,
  getWidgetSpanClass,
} from "../../presentation/widgets/registry";

export type DashboardLayoutPersistMode = "user" | "role";

export interface UseDashboardLayoutOptions {
  /** `user` = dashboard personalización; `role` = settings admin por rol */
  persistMode?: DashboardLayoutPersistMode;
  /** Rol cuyo default se edita o se simula (settings) */
  roleForEdit?: UserRole;
}

function resolveStoredLayout(
  persistMode: DashboardLayoutPersistMode,
  userId: string | undefined,
  tenantId: string | undefined,
  userRole: UserRole | undefined,
  roleForEdit: UserRole | undefined,
): DashboardLayout {
  const productRole = persistMode === "role" ? roleForEdit : userRole;
  const product = buildRoleDefaultLayout(productRole);

  if (persistMode === "role") {
    const role = roleForEdit;
    if (!tenantId || !role) return product;
    const roleLayout = dashboardLayoutStore.getRoleLayout(tenantId, role);
    return mergeWithDefaults(roleLayout, product);
  }

  if (!userId || !tenantId || !userRole) return product;

  const userLayout = dashboardLayoutStore.getUserLayout(userId);
  if (userLayout) return mergeWithDefaults(userLayout, product);

  const roleLayout = dashboardLayoutStore.getRoleLayout(tenantId, userRole);
  return mergeWithDefaults(roleLayout, product);
}

export function useDashboardLayout(options: UseDashboardLayoutOptions = {}) {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const persistMode = options.persistMode ?? "user";
  const roleForEdit = options.roleForEdit;

  const userId = user?.id;
  const tenantId = user?.tenant?.id;
  const userRole = user?.role;

  const canReadTrips = hasPermission("trips", "read");
  const canReadBranches = hasPermission("branches", "read");

  const gateRole: UserRole | undefined =
    persistMode === "role" ? roleForEdit : userRole;

  const showFinance = canAccessFinanceSummaryRoute(gateRole);
  const isClientPortal = isClientPortalRole(gateRole);
  const isDriverPortal = isDriverPortalRole(gateRole);

  const gateCtx: DashboardWidgetGateContext = useMemo(
    () => ({
      canReadTrips,
      showFinance,
      canReadBranches,
      isClientPortal,
      isDriverPortal,
    }),
    [canReadTrips, showFinance, canReadBranches, isClientPortal, isDriverPortal],
  );

  const [layout, setLayout] = useState<DashboardLayout>(() =>
    resolveStoredLayout(
      persistMode,
      userId,
      tenantId,
      userRole,
      roleForEdit,
    ),
  );

  useEffect(() => {
    setLayout(
      resolveStoredLayout(
        persistMode,
        userId,
        tenantId,
        userRole,
        roleForEdit,
      ),
    );
  }, [persistMode, userId, tenantId, userRole, roleForEdit]);

  const persist = useCallback(
    (next: DashboardLayout) => {
      setLayout(next);
      if (persistMode === "role") {
        if (tenantId && roleForEdit) {
          dashboardLayoutStore.setRoleLayout(tenantId, roleForEdit, next);
        }
        return;
      }
      if (userId) {
        dashboardLayoutStore.setUserLayout(userId, next);
      }
    },
    [persistMode, tenantId, roleForEdit, userId],
  );

  const customizableWidgets = useMemo(
    () => getCustomizableWidgets(layout, gateCtx),
    [layout, gateCtx],
  );

  const visibleWidgets = useMemo(
    () => getVisibleWidgetsInOrder(layout, gateCtx),
    [layout, gateCtx],
  );

  const setVisible = useCallback(
    (id: WidgetId, visible: boolean) => {
      persist(setWidgetVisibility(layout, id, visible));
    },
    [layout, persist],
  );

  const reorder = useCallback(
    (orderedIds: WidgetId[]) => {
      persist(reorderWidgets(layout, orderedIds));
    },
    [layout, persist],
  );

  const resetToRoleDefault = useCallback(() => {
    if (persistMode === "role") {
      if (tenantId && roleForEdit) {
        dashboardLayoutStore.clearRoleLayout(tenantId, roleForEdit);
        setLayout(buildRoleDefaultLayout(roleForEdit));
      }
      return;
    }
    if (userId) {
      dashboardLayoutStore.clearUserLayout(userId);
      const product = buildRoleDefaultLayout(userRole);
      if (tenantId && userRole) {
        const roleLayout = dashboardLayoutStore.getRoleLayout(tenantId, userRole);
        setLayout(mergeWithDefaults(roleLayout, product));
      } else {
        setLayout(product);
      }
    }
  }, [persistMode, tenantId, roleForEdit, userId, userRole]);

  const resetToSystemDefault = useCallback(() => {
    const productRole = persistMode === "role" ? roleForEdit : userRole;
    const product = buildRoleDefaultLayout(productRole);
    if (persistMode === "role") {
      if (tenantId && roleForEdit) {
        dashboardLayoutStore.setRoleLayout(tenantId, roleForEdit, product);
      }
      setLayout(product);
      return;
    }
    if (userId) {
      dashboardLayoutStore.setUserLayout(userId, product);
      setLayout(product);
    }
  }, [persistMode, tenantId, roleForEdit, userId, userRole]);

  const getSpanClass = useCallback((id: WidgetId) => {
    const entry = getWidgetRegistryEntry(id);
    return entry ? getWidgetSpanClass(entry.span) : "lg:col-span-12";
  }, []);

  return {
    layout,
    gateCtx,
    customizableWidgets,
    visibleWidgets,
    widgetsRegistry: DASHBOARD_WIDGETS,
    setVisible,
    reorder,
    resetToRoleDefault,
    resetToSystemDefault,
    getSpanClass,
    persistMode,
    canReadTrips,
    canReadBranches,
    showFinance,
  };
}

export type { DashboardWidgetPref, WidgetId, DashboardLayout };
