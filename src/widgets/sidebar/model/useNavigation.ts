/**
 * useNavigation Hook
 *
 * Hook que filtra la navegación según los permisos del usuario.
 * Integrado con el sistema de permisos de @/shared/permissions.
 *
 * Ubicación: src/widgets/sidebar/model/useNavigation.ts
 *
 * @example
 * const { navigation, allItems, isItemActive } = useNavigation();
 */

import { useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  useEntitlement,
  type EntitlementState,
} from "@features/billing";
import { usePermissions } from "@/shared/permissions";
import { isClientPortalRole, isDriverPortalRole } from "@shared/constants/roles";
import { navigationCopy } from "../copy/navigationCopy";
import {
  clientPortalNavigationConfig,
  driverPortalNavigationConfig,
  navigationConfig,
} from "./navigation";
import type { NavGroup, NavItem } from "./types";
import type { UserRole } from "@shared/constants/roles";
import type { Module, Action } from "@shared/permissions/domain/entities";

export type { EntitlementState };

/** Resuelve estado de contrato para ítems con `entitlement`. */
export type GetEntitlementState = (code: string) => EntitlementState;
// ============================================================================
// TYPES
// ============================================================================

export interface Breadcrumb {
  group?: NavGroup;
  item?: NavItem;
}

export interface UseNavigationReturn {
  /** Navegación filtrada por permisos */
  navigation: NavGroup[];
  /** Todos los items accesibles (planos) */
  allItems: NavItem[];
  /** Verifica si un item está activo */
  isItemActive: (item: NavItem) => boolean;
  /** Verifica si un path está activo */
  isPathActive: (path: string) => boolean;
  /** Encuentra un item por path */
  findItemByPath: (path: string) => NavItem | undefined;
  /** Obtiene el breadcrumb actual */
  currentBreadcrumb: Breadcrumb;
  /** Path actual */
  currentPath: string;
  /** Indica si la navegación está cargando (permisos) */
  isLoading: boolean;
}

// ============================================================================
// HELPER FUNCTIONS (fuera del hook para evitar recreaciones)
// ============================================================================

/**
 * Parte pathname del path del ítem (sin query), para comparar con location.pathname
 */
function navPathKey(item: NavItem): string {
  const p = item.path;
  const q = p.indexOf("?");
  return q >= 0 ? p.slice(0, q) : p;
}

/**
 * Especificidad del ítem frente al query actual, para desempatar entre ítems que
 * comparten pathname (p. ej. ítems con query en path legacy):
 * - sin query declarado: 0, es el fallback del pathname
 * - query declarado que coincide: gana al fallback y crece con cada parámetro
 * - query declarado que no coincide: pierde contra el fallback, pero sigue siendo
 *   candidato para no dejar el grupo sin ítem activo cuando es el único visible
 */
function navQueryScore(item: NavItem, currentSearch: string): number {
  const q = item.path.indexOf("?");
  if (q < 0) return 0;

  const declared = new URLSearchParams(item.path.slice(q + 1));
  const current = new URLSearchParams(currentSearch);
  let matched = 0;

  for (const [key, value] of declared) {
    if (current.get(key) !== value) return -1;
    matched += 1;
  }

  return matched > 0 ? matched + 1 : 0;
}

/**
 * Verifica si un path coincide con el path actual
 */
function checkPathActive(
  currentPath: string,
  targetPath: string,
  exactOnly = false,
  extraPrefixes: string[] = [],
): boolean {
  // Coincidencia exacta
  if (currentPath === targetPath) return true;

  if (exactOnly) return false;

  // Coincidencia de subrutas (ej: /trips/123 activa /trips)
  // Pero no activar "/" para cualquier ruta
  if (targetPath !== "/" && currentPath.startsWith(targetPath + "/")) {
    return true;
  }

  for (const raw of extraPrefixes) {
    // Sufijo `/*` = solo hijos del prefijo (no el path exacto del padre).
    const descendantsOnly = raw.endsWith("/*");
    const prefix = descendantsOnly ? raw.slice(0, -2) : raw;
    if (!prefix || prefix === "/") continue;
    if (!descendantsOnly && currentPath === prefix) return true;
    if (currentPath.startsWith(`${prefix}/`)) return true;
  }

  return false;
}

/**
 * Entre todos los ítems que coinciden con la ruta actual, gana el prefijo más largo
 * (evita marcar /users y /users/activity activos a la vez) y, a igual pathname, el
 * que coincide con el query actual (desempate por query declarado en path).
 */
export function findActiveNavItem(
  currentPath: string,
  items: NavItem[],
  currentSearch = "",
): NavItem | undefined {
  let best: NavItem | undefined;
  let bestKeyLen = -1;
  let bestQueryScore = -Infinity;

  for (const item of items) {
    const key = navPathKey(item);
    if (!checkPathActive(currentPath, key, item.exactPath, item.activePathPrefixes)) continue;

    const queryScore = navQueryScore(item, currentSearch);
    if (
      key.length > bestKeyLen ||
      (key.length === bestKeyLen && queryScore > bestQueryScore)
    ) {
      bestKeyLen = key.length;
      bestQueryScore = queryScore;
      best = item;
    }
  }

  return best;
}

/**
 * Visibilidad por permiso (RBAC / roles).
 */
function passesPermissionFilter(
  item: NavItem,
  hasPermission: (module: Module, action: Action) => boolean,
  userRole: UserRole | null,
): boolean {
  if (item.roles && item.roles.length > 0) {
    if (!userRole) return false;
    return item.roles.includes(userRole);
  }

  const action = item.action || "read";

  if (item.anyModules && item.anyModules.length > 0) {
    return item.anyModules.some((module) => hasPermission(module, action));
  }

  if (!item.module) return true;

  return hasPermission(item.module, action);
}

/**
 * DC3 / T5 — ítems con `entitlement`:
 * - operativo (`!lockedPreview`): visible si active | loading | unknown
 * - preview (`lockedPreview`): solo not_contracted → grupo Complementos
 * - unavailable: oculta ambos
 */
function passesEntitlementFilter(
  item: NavItem,
  getEntitlementState?: GetEntitlementState,
): boolean {
  if (!item.entitlement) return true;

  const state = getEntitlementState?.(item.entitlement) ?? "unknown";

  if (item.lockedPreview) {
    return state === "not_contracted";
  }

  if (state === "not_contracted" || state === "unavailable") {
    return false;
  }

  // active | loading | unknown
  return true;
}

/**
 * Filtra los items de navegación según permisos (+ entitlement opcional).
 * Los `lockedPreview` visibles se excluyen del grupo origen (van a Complementos).
 */
function filterNavItems(
  items: NavItem[],
  hasPermission: (module: Module, action: Action) => boolean,
  userRole: UserRole | null,
  getEntitlementState?: GetEntitlementState,
  options?: { collectLocked?: NavItem[] },
): NavItem[] {
  const out: NavItem[] = [];

  for (const item of items) {
    if (!passesPermissionFilter(item, hasPermission, userRole)) continue;
    if (!passesEntitlementFilter(item, getEntitlementState)) continue;

    if (item.lockedPreview) {
      options?.collectLocked?.push(item);
      continue;
    }

    out.push(item);
  }

  return out;
}

/**
 * Filtra los grupos de navegación según permisos y estado de complementos (T5).
 * Ítems `lockedPreview` + `not_contracted` → grupo «Complementos» al final.
 */
export function filterNavigation(
  config: NavGroup[],
  hasPermission: (module: Module, action: Action) => boolean,
  userRole: UserRole | null,
  getEntitlementState?: GetEntitlementState,
): NavGroup[] {
  const filtered: NavGroup[] = [];
  const lockedItems: NavItem[] = [];

  for (const group of config) {
    if (group.module) {
      const action = group.action || "read";
      if (!hasPermission(group.module, action)) {
        continue;
      }
    }

    const filteredItems = filterNavItems(
      group.items,
      hasPermission,
      userRole,
      getEntitlementState,
      { collectLocked: lockedItems },
    );

    if (filteredItems.length === 0) {
      continue;
    }

    filtered.push({
      ...group,
      items: filteredItems,
    });
  }

  if (lockedItems.length > 0) {
    filtered.push({
      id: "complementos",
      title: navigationCopy.group.complementos,
      items: lockedItems,
    });
  }

  return filtered;
}

/**
 * Encuentra el breadcrumb actual basado en el path
 */
function findCurrentBreadcrumb(
  navigation: NavGroup[],
  currentPath: string,
  currentSearch: string,
): Breadcrumb {
  const flat = navigation.flatMap((g) => g.items);
  const item = findActiveNavItem(currentPath, flat, currentSearch);
  if (!item) return {};
  const group = navigation.find((g) => g.items.includes(item));
  return group ? { group, item } : {};
}

/**
 * Encuentra un item por path en la navegación
 */
function findNavItemByPath(
  navigation: NavGroup[],
  path: string,
): NavItem | undefined {
  const flat = navigation.flatMap((g) => g.items);
  const q = path.indexOf("?");
  const pathname = q >= 0 ? path.slice(0, q) : path;
  const search = q >= 0 ? path.slice(q) : "";
  return findActiveNavItem(pathname, flat, search);
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Navegación filtrada por permisos.
 * No consultar settings aquí: varios tests montan el hook sin QueryClient.
 */
export function useNavigation(): UseNavigationReturn {
  const location = useLocation();
  const { hasPermission, role, isLoading } = usePermissions();
  const gpsEntitlement = useEntitlement("gps_tracking");

  const currentPath = location.pathname;
  const currentSearch = location.search;

  const getEntitlementState = useCallback<GetEntitlementState>(
    (code) => {
      if (code === "gps_tracking") return gpsEntitlement.state;
      return "unknown";
    },
    [gpsEntitlement.state],
  );

  /**
   * Navegación filtrada según permisos + estado de complementos (DC3).
   */
  const navigation = useMemo<NavGroup[]>(() => {
    const config = isClientPortalRole(role)
      ? clientPortalNavigationConfig
      : isDriverPortalRole(role)
        ? driverPortalNavigationConfig
        : navigationConfig;
    return filterNavigation(config, hasPermission, role, getEntitlementState);
  }, [getEntitlementState, hasPermission, role]);

  /**
   * Todos los items accesibles en formato plano
   * Útil para búsquedas y comandos rápidos
   */
  const allItems = useMemo<NavItem[]>(() => {
    return navigation.flatMap((group) => group.items);
  }, [navigation]);

  const activeNavItem = useMemo(
    () => findActiveNavItem(currentPath, allItems, currentSearch),
    [currentPath, currentSearch, allItems],
  );

  /**
   * Verifica si un path está activo
   * Memoizado con el path actual como dependencia
   */
  const isPathActive = useCallback(
    (path: string): boolean => {
      const pathKey = path.split("?")[0];
      const itemForPath =
        allItems.find((i) => i.path === path) ??
        allItems.find((i) => navPathKey(i) === pathKey);
      return itemForPath !== undefined && itemForPath.id === activeNavItem?.id;
    },
    [allItems, activeNavItem],
  );

  /**
   * Verifica si un item de navegación está activo.
   * Compara por `id` porque el consumidor puede recibir copias del ítem
   * (p. ej. `useNavigationWithBadges` clona el ítem para añadirle el badge).
   */
  const isItemActive = useCallback(
    (item: NavItem): boolean => {
      return activeNavItem?.id === item.id;
    },
    [activeNavItem],
  );

  /**
   * Encuentra un item por su path
   */
  const findItemByPath = useCallback(
    (path: string): NavItem | undefined => {
      return findNavItemByPath(navigation, path);
    },
    [navigation],
  );

  /**
   * Breadcrumb actual basado en la ruta
   * Se recalcula solo cuando cambia la navegación o el path
   */
  const currentBreadcrumb = useMemo<Breadcrumb>(() => {
    return findCurrentBreadcrumb(navigation, currentPath, currentSearch);
  }, [navigation, currentPath, currentSearch]);

  return {
    navigation,
    allItems,
    isItemActive,
    isPathActive,
    findItemByPath,
    currentBreadcrumb,
    currentPath,
    isLoading,
  };
}

// ============================================================================
// ADDITIONAL HOOKS (composición)
// ============================================================================

/**
 * Hook simplificado que solo retorna el item activo
 * Útil para componentes que solo necesitan saber qué está activo
 */
export function useActiveNavItem(): NavItem | undefined {
  const { currentBreadcrumb } = useNavigation();
  return currentBreadcrumb.item;
}

/**
 * Hook simplificado para verificar si una ruta específica está activa
 */
export function useIsRouteActive(path: string): boolean {
  const { isPathActive } = useNavigation();
  return isPathActive(path);
}
