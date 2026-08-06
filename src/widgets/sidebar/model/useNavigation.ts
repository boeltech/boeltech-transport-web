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
import { usePermissions } from "@/shared/permissions";
import { isClientPortalRole, isDriverPortalRole } from "@shared/constants/roles";
import {
  clientPortalNavigationConfig,
  driverPortalNavigationConfig,
  navigationConfig,
} from "./navigation";
import type { NavGroup, NavItem } from "./types";
import type { UserRole } from "@shared/constants/roles";
import type { Module, Action } from "@shared/permissions/domain/entities";

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
 * comparten pathname (p. ej. `/finance` y `/finance?tab=invoiceable`):
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
function checkPathActive(currentPath: string, targetPath: string): boolean {
  // Coincidencia exacta
  if (currentPath === targetPath) return true;

  // Coincidencia de subrutas (ej: /trips/123 activa /trips)
  // Pero no activar "/" para cualquier ruta
  if (targetPath !== "/" && currentPath.startsWith(targetPath + "/")) {
    return true;
  }

  return false;
}

/**
 * Entre todos los ítems que coinciden con la ruta actual, gana el prefijo más largo
 * (evita marcar /users y /users/activity activos a la vez) y, a igual pathname, el
 * que coincide con el query actual (`/finance?tab=invoiceable` sobre `/finance`).
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
    if (!checkPathActive(currentPath, key)) continue;

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
 * Filtra los items de navegación según permisos
 */
function filterNavItems(
  items: NavItem[],
  hasPermission: (module: Module, action: Action) => boolean,
  userRole: UserRole | null,
): NavItem[] {
  return items.filter((item) => {
    if (item.roles && item.roles.length > 0) {
      if (!userRole) return false;
      return item.roles.includes(userRole);
    }

    // Si no requiere módulo, mostrar siempre
    if (!item.module) return true;

    // Verificar permiso con la acción especificada o 'read' por defecto
    const action = item.action || "read";
    return hasPermission(item.module, action);
  });
}

/**
 * Filtra los grupos de navegación según permisos
 */
function filterNavigation(
  config: NavGroup[],
  hasPermission: (module: Module, action: Action) => boolean,
  userRole: UserRole | null,
): NavGroup[] {
  const filtered: NavGroup[] = [];

  for (const group of config) {
    // Si el grupo requiere un módulo, verificar acceso
    if (group.module) {
      const action = group.action || "read";
      if (!hasPermission(group.module, action)) {
        continue;
      }
    }

    // Filtrar items dentro del grupo
    const filteredItems = filterNavItems(group.items, hasPermission, userRole);

    // Si no hay items visibles, no mostrar el grupo
    if (filteredItems.length === 0) {
      continue;
    }

    filtered.push({
      ...group,
      items: filteredItems,
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

export function useNavigation(): UseNavigationReturn {
  const location = useLocation();
  const { hasPermission, role, isLoading } = usePermissions();

  const currentPath = location.pathname;
  const currentSearch = location.search;

  /**
   * Navegación filtrada según permisos del usuario
   * Solo se recalcula cuando cambian los permisos o el rol
   */
  const navigation = useMemo<NavGroup[]>(() => {
    const config = isClientPortalRole(role)
      ? clientPortalNavigationConfig
      : isDriverPortalRole(role)
        ? driverPortalNavigationConfig
        : navigationConfig;
    return filterNavigation(config, hasPermission, role);
  }, [hasPermission, role]);

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
