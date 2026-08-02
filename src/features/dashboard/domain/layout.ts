/**
 * Dashboard layout preferences — widget visibility and order.
 *
 * Defaults (PD2 / D7–D9): finance-first scorecard for roles with showFinance;
 * ops-first when finance widgets are RBAC-gated out.
 */

import type { UserRole } from "@shared/constants/roles";

// ============================================================================
// Widget IDs
// ============================================================================

export const DASHBOARD_WIDGET_IDS = [
  "metric_trends",
  "operations_snapshot",
  "alerts",
  "recent_trips",
  "fleet_drivers",
  "trips_by_day",
  "financial_comparison",
  "vehicle_expense_ranking",
  "financial_trend",
  "branch_kpis",
] as const;

export type WidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

export type WidgetSpan = "third" | "half" | "full";

export const WIDGET_SPAN_CLASS: Record<WidgetSpan, string> = {
  third: "lg:col-span-4",
  half: "lg:col-span-6",
  full: "lg:col-span-12",
};

// ============================================================================
// Layout types
// ============================================================================

export interface DashboardWidgetPref {
  id: WidgetId;
  visible: boolean;
  order: number;
}

export interface DashboardLayout {
  widgets: DashboardWidgetPref[];
}

export interface DashboardWidgetGateContext {
  canReadTrips: boolean;
  showFinance: boolean;
  canReadBranches: boolean;
}

export interface DashboardWidgetDefinition {
  id: WidgetId;
  title: string;
  span: WidgetSpan;
  defaultVisible: boolean;
  defaultOrder: number;
  gate: (ctx: DashboardWidgetGateContext) => boolean;
}

// ============================================================================
// System default — finance-first (PD1–PD5)
// ============================================================================

export const SYSTEM_DEFAULT_WIDGET_DEFS: readonly DashboardWidgetDefinition[] =
  [
    {
      id: "metric_trends",
      title: "Scorecard del mes",
      span: "full",
      defaultVisible: true,
      defaultOrder: 0,
      gate: ({ canReadTrips, showFinance }) => canReadTrips && showFinance,
    },
    {
      id: "operations_snapshot",
      title: "Operación del mes",
      span: "full",
      defaultVisible: true,
      defaultOrder: 1,
      gate: ({ canReadTrips }) => canReadTrips,
    },
    {
      id: "alerts",
      title: "Requiere atención",
      span: "half",
      defaultVisible: true,
      defaultOrder: 2,
      gate: ({ canReadTrips }) => canReadTrips,
    },
    {
      id: "recent_trips",
      title: "Viajes recientes",
      span: "half",
      defaultVisible: true,
      defaultOrder: 3,
      gate: ({ canReadTrips }) => canReadTrips,
    },
    {
      id: "fleet_drivers",
      title: "Flota y conductores",
      span: "half",
      defaultVisible: true,
      defaultOrder: 4,
      gate: ({ canReadTrips }) => canReadTrips,
    },
    {
      id: "trips_by_day",
      title: "Viajes por día",
      span: "full",
      defaultVisible: true,
      defaultOrder: 5,
      gate: ({ canReadTrips }) => canReadTrips,
    },
    {
      id: "financial_comparison",
      title: "Ingresos y costos: plan vs real",
      span: "full",
      defaultVisible: true,
      defaultOrder: 6,
      gate: ({ canReadTrips, showFinance }) => canReadTrips && showFinance,
    },
    {
      id: "vehicle_expense_ranking",
      title: "Unidades con más gasto",
      span: "half",
      defaultVisible: true,
      defaultOrder: 7,
      gate: ({ canReadTrips, showFinance }) => canReadTrips && showFinance,
    },
    {
      id: "financial_trend",
      title: "Tendencia plan vs real",
      span: "full",
      defaultVisible: true,
      defaultOrder: 8,
      gate: ({ canReadTrips, showFinance }) => canReadTrips && showFinance,
    },
    {
      id: "branch_kpis",
      title: "KPIs por sucursal",
      span: "full",
      defaultVisible: true,
      defaultOrder: 9,
      gate: ({ canReadTrips, canReadBranches }) =>
        canReadTrips && canReadBranches,
    },
  ] as const;

export function buildSystemDefaultLayout(): DashboardLayout {
  return {
    widgets: SYSTEM_DEFAULT_WIDGET_DEFS.map((def) => ({
      id: def.id,
      visible: def.defaultVisible,
      order: def.defaultOrder,
    })),
  };
}

// ============================================================================
// Helpers
// ============================================================================

function isWidgetId(value: string): value is WidgetId {
  return (DASHBOARD_WIDGET_IDS as readonly string[]).includes(value);
}

/**
 * Validates and sorts widget prefs; drops unknown ids.
 */
export function normalizeLayout(layout: DashboardLayout): DashboardLayout {
  const seen = new Set<WidgetId>();
  const widgets: DashboardWidgetPref[] = [];

  for (const pref of layout.widgets ?? []) {
    if (!pref?.id || !isWidgetId(pref.id) || seen.has(pref.id)) continue;
    seen.add(pref.id);
    widgets.push({
      id: pref.id,
      visible: Boolean(pref.visible),
      order: Number.isFinite(pref.order) ? pref.order : widgets.length,
    });
  }

  widgets.sort((a, b) => a.order - b.order);
  widgets.forEach((w, index) => {
    w.order = index;
  });

  return { widgets };
}

/**
 * Merges a stored layout with system defaults (adds missing widgets, keeps prefs).
 */
export function mergeWithDefaults(
  stored: DashboardLayout | null | undefined,
  base: DashboardLayout = buildSystemDefaultLayout(),
): DashboardLayout {
  const baseNorm = normalizeLayout(base);
  if (!stored) return baseNorm;

  const storedNorm = normalizeLayout(stored);
  const byId = new Map(storedNorm.widgets.map((w) => [w.id, w]));

  const merged: DashboardWidgetPref[] = baseNorm.widgets.map((baseWidget) => {
    const saved = byId.get(baseWidget.id);
    return saved
      ? { ...baseWidget, visible: saved.visible, order: saved.order }
      : baseWidget;
  });

  return normalizeLayout({ widgets: merged });
}

/**
 * Keeps only widgets the user is allowed to see; hidden-by-RBAC are removed from the list.
 */
export function applyRbac(
  layout: DashboardLayout,
  gateCtx: DashboardWidgetGateContext,
  defs: readonly DashboardWidgetDefinition[] = SYSTEM_DEFAULT_WIDGET_DEFS,
): DashboardLayout {
  const defById = new Map(defs.map((d) => [d.id, d]));

  const widgets = layout.widgets.filter((pref) => {
    const def = defById.get(pref.id);
    if (!def) return false;
    return def.gate(gateCtx);
  });

  return normalizeLayout({ widgets });
}

/**
 * Layout entries allowed in customize UI (RBAC), regardless of visible flag.
 */
export function getCustomizableWidgets(
  layout: DashboardLayout,
  gateCtx: DashboardWidgetGateContext,
  defs: readonly DashboardWidgetDefinition[] = SYSTEM_DEFAULT_WIDGET_DEFS,
): DashboardWidgetPref[] {
  return applyRbac(layout, gateCtx, defs).widgets;
}

export function setWidgetVisibility(
  layout: DashboardLayout,
  id: WidgetId,
  visible: boolean,
): DashboardLayout {
  return normalizeLayout({
    widgets: layout.widgets.map((w) =>
      w.id === id ? { ...w, visible } : w,
    ),
  });
}

export function reorderWidgets(
  layout: DashboardLayout,
  orderedIds: WidgetId[],
): DashboardLayout {
  const allowed = new Set(layout.widgets.map((w) => w.id));
  const idToPref = new Map(layout.widgets.map((w) => [w.id, w]));

  const reordered: DashboardWidgetPref[] = [];
  orderedIds.forEach((id, index) => {
    if (!allowed.has(id)) return;
    const pref = idToPref.get(id);
    if (pref) reordered.push({ ...pref, order: index });
  });

  for (const pref of layout.widgets) {
    if (!reordered.some((w) => w.id === pref.id)) {
      reordered.push({ ...pref, order: reordered.length });
    }
  }

  return normalizeLayout({ widgets: reordered });
}

export function getVisibleWidgetsInOrder(
  layout: DashboardLayout,
  gateCtx: DashboardWidgetGateContext,
  defs: readonly DashboardWidgetDefinition[] = SYSTEM_DEFAULT_WIDGET_DEFS,
): DashboardWidgetPref[] {
  const rbac = applyRbac(layout, gateCtx, defs);
  return rbac.widgets.filter((w) => w.visible);
}

export type { UserRole };
