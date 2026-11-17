/**
 * Dashboard layout preferences — widget visibility and order (v2).
 *
 * v2: zonas fijas por permiso (no personalizables) + extras debajo.
 * Cascada: Personalizar (usuario) → layout de rol del tenant → default de producto.
 * Roles sin showFinance pierden widgets financieros tras RBAC; portal no ve ops/flota.
 */

import type { UserRole } from "@shared/constants/roles";

// ============================================================================
// Widget IDs
// ============================================================================

export const DASHBOARD_WIDGET_IDS = [
  "metric_trends",
  "operations_snapshot",
  "alerts",
  "invoices_month",
  "vehicle_expense_ranking",
  "financial_comparison",
  "recent_trips",
  "fleet_drivers",
  "trips_by_day",
  "branch_kpis",
] as const;

export type WidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

/** Prefs ignoradas / no se montan en staff (sustituidos por zonas fijas F1–F2). */
export const FIXED_ZONE_LEGACY_IDS = [
  "alerts",
  "operations_snapshot",
  "fleet_drivers",
] as const;

/** K10 — zona fija cuando showFinance; no toggle en Personalizar. */
export const FIXED_ZONE_K10_ID = "metric_trends" as const;

/** Widgets que Personalizar puede agregar debajo (extras). */
export const EXTRA_WIDGET_IDS = [
  "financial_comparison",
  "vehicle_expense_ranking",
  "invoices_month",
  "trips_by_day",
  "branch_kpis",
  "recent_trips",
] as const;

export type ExtraWidgetId = (typeof EXTRA_WIDGET_IDS)[number];

/** Q11 — al migrar v1→v2 quedan off aunque v1 los tuviera on. */
export const Q11_FORCE_OFF_IDS = [
  "financial_comparison",
  "vehicle_expense_ranking",
  "invoices_month",
] as const;

const FIXED_ZONE_ID_SET = new Set<string>([
  ...FIXED_ZONE_LEGACY_IDS,
  FIXED_ZONE_K10_ID,
]);

const EXTRA_WIDGET_ID_SET = new Set<string>(EXTRA_WIDGET_IDS);
const Q11_FORCE_OFF_SET = new Set<string>(Q11_FORCE_OFF_IDS);

export function isFixedZoneWidgetId(id: WidgetId): boolean {
  return FIXED_ZONE_ID_SET.has(id);
}

export function isExtraWidgetId(id: WidgetId): id is ExtraWidgetId {
  return EXTRA_WIDGET_ID_SET.has(id);
}

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
  /** Portal client: sin widgets de flota / atención operativa. */
  isClientPortal?: boolean;
  /** Portal driver: solo viajes propios (recent + por día). */
  isDriverPortal?: boolean;
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
// System default — v2: extras Q11 off; legacy ATF off; K10 on en catálogo
// ============================================================================

export const SYSTEM_DEFAULT_WIDGET_DEFS: readonly DashboardWidgetDefinition[] =
  [
    {
      id: "alerts",
      title: "Requiere atención",
      span: "half",
      defaultVisible: false,
      defaultOrder: 0,
      gate: ({ canReadTrips, isClientPortal, isDriverPortal }) =>
        canReadTrips && !isClientPortal && !isDriverPortal,
    },
    {
      id: "operations_snapshot",
      title: "Operación del mes",
      span: "full",
      defaultVisible: false,
      defaultOrder: 1,
      gate: ({ canReadTrips, isClientPortal, isDriverPortal }) =>
        canReadTrips && !isClientPortal && !isDriverPortal,
    },
    {
      id: "metric_trends",
      title: "Resumen del mes",
      span: "full",
      defaultVisible: true,
      defaultOrder: 2,
      gate: ({ canReadTrips, showFinance }) => canReadTrips && showFinance,
    },
    {
      id: "invoices_month",
      title: "Facturación del mes",
      span: "half",
      defaultVisible: false,
      defaultOrder: 3,
      gate: ({ canReadTrips, showFinance }) => canReadTrips && showFinance,
    },
    {
      id: "vehicle_expense_ranking",
      title: "Unidades con más gasto",
      span: "half",
      defaultVisible: false,
      defaultOrder: 4,
      gate: ({ canReadTrips, showFinance }) => canReadTrips && showFinance,
    },
    {
      id: "financial_comparison",
      title: "Ingresos, costos y margen",
      span: "full",
      defaultVisible: false,
      defaultOrder: 5,
      gate: ({ canReadTrips, showFinance }) => canReadTrips && showFinance,
    },
    {
      id: "recent_trips",
      title: "Viajes recientes",
      span: "half",
      defaultVisible: true,
      defaultOrder: 6,
      gate: ({ canReadTrips }) => canReadTrips,
    },
    {
      id: "fleet_drivers",
      title: "Flota y conductores",
      span: "half",
      defaultVisible: false,
      defaultOrder: 7,
      gate: ({ canReadTrips, isClientPortal, isDriverPortal }) =>
        canReadTrips && !isClientPortal && !isDriverPortal,
    },
    {
      id: "trips_by_day",
      title: "Viajes por día",
      span: "full",
      defaultVisible: false,
      defaultOrder: 8,
      gate: ({ canReadTrips }) => canReadTrips,
    },
    {
      id: "branch_kpis",
      title: "Sucursales",
      span: "full",
      defaultVisible: false,
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

/**
 * Default de producto v2: extras off (Q11); portales conservan recent_trips.
 * Zonas fijas no dependen de esta lista (montaje por gate en la página).
 */
const ROLE_DEFAULT_VISIBLE: Record<UserRole, readonly WidgetId[]> = {
  admin: [],
  manager: [],
  accountant: [],
  dispatcher: [],
  operator: [],
  driver: ["recent_trips"],
  client: ["recent_trips"],
};

function layoutFromVisibleOrder(
  visibleOrdered: readonly WidgetId[],
): DashboardLayout {
  const seen = new Set(visibleOrdered);
  const widgets: DashboardWidgetPref[] = visibleOrdered.map((id, order) => ({
    id,
    visible: true,
    order,
  }));

  for (const def of SYSTEM_DEFAULT_WIDGET_DEFS) {
    if (seen.has(def.id)) continue;
    widgets.push({
      id: def.id,
      visible: false,
      order: widgets.length,
    });
  }

  return normalizeLayout({ widgets });
}

/**
 * Default de producto para `/dashboard` según el rol (v2).
 * Widgets no listados quedan en Personalizar (si el gate los permite).
 */
export function buildRoleDefaultLayout(
  role: UserRole | null | undefined,
): DashboardLayout {
  if (!role || !Object.prototype.hasOwnProperty.call(ROLE_DEFAULT_VISIBLE, role)) {
    return buildSystemDefaultLayout();
  }
  return layoutFromVisibleOrder(ROLE_DEFAULT_VISIBLE[role]);
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
 * Migra layout v1 → v2 (Q12):
 * - zonas fijas / legacy ATF: prefs ignoradas (visible false en store)
 * - Q11 extras: force off
 * - trips_by_day / branch_kpis / recent_trips: conserva visible de v1
 */
export function migrateLayoutV1toV2(v1: DashboardLayout): DashboardLayout {
  const stored = normalizeLayout(v1);
  const byId = new Map(stored.widgets.map((w) => [w.id, w]));
  const base = buildSystemDefaultLayout();

  const widgets: DashboardWidgetPref[] = base.widgets.map((baseWidget) => {
    const saved = byId.get(baseWidget.id);
    if (isFixedZoneWidgetId(baseWidget.id)) {
      return { ...baseWidget, visible: false };
    }
    if (Q11_FORCE_OFF_SET.has(baseWidget.id)) {
      return { ...baseWidget, visible: false };
    }
    if (saved) {
      return { ...baseWidget, visible: saved.visible, order: saved.order };
    }
    return baseWidget;
  });

  return normalizeLayout({ widgets });
}

/**
 * Merges a stored layout with a catalog/product base (adds missing widgets, keeps prefs).
 * Prefs de zonas fijas se ignoran (siempre off en el modelo de extras).
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
    if (isFixedZoneWidgetId(baseWidget.id)) {
      return { ...baseWidget, visible: false };
    }
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
 * Extras permitidos en Personalizar (RBAC), sin zonas fijas.
 */
export function getCustomizableWidgets(
  layout: DashboardLayout,
  gateCtx: DashboardWidgetGateContext,
  defs: readonly DashboardWidgetDefinition[] = SYSTEM_DEFAULT_WIDGET_DEFS,
): DashboardWidgetPref[] {
  return applyRbac(layout, gateCtx, defs).widgets.filter((w) =>
    isExtraWidgetId(w.id),
  );
}

export function setWidgetVisibility(
  layout: DashboardLayout,
  id: WidgetId,
  visible: boolean,
): DashboardLayout {
  if (isFixedZoneWidgetId(id)) return layout;
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
  const allowed = new Set(
    layout.widgets.filter((w) => isExtraWidgetId(w.id)).map((w) => w.id),
  );
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

/** Extras visibles en orden (zonas fijas excluidas). */
export function getVisibleWidgetsInOrder(
  layout: DashboardLayout,
  gateCtx: DashboardWidgetGateContext,
  defs: readonly DashboardWidgetDefinition[] = SYSTEM_DEFAULT_WIDGET_DEFS,
): DashboardWidgetPref[] {
  const rbac = applyRbac(layout, gateCtx, defs);
  return rbac.widgets.filter((w) => w.visible && isExtraWidgetId(w.id));
}

export type { UserRole };
