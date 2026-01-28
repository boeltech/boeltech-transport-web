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
import { navigationConfig } from "./navigation";
import type { NavGroup, NavItem } from "./types";

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
 * Filtra los items de navegación según permisos
 */
function filterNavItems(
  items: NavItem[],
  hasPermission: (module: string, action: string) => boolean,
): NavItem[] {
  return items.filter((item) => {
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
  hasPermission: (module: string, action: string) => boolean,
  isAdmin: boolean,
): NavGroup[] {
  // Si es admin, mostrar todo
  if (isAdmin) {
    return config;
  }

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
    const filteredItems = filterNavItems(group.items, hasPermission);

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
): Breadcrumb {
  for (const group of navigation) {
    for (const item of group.items) {
      if (checkPathActive(currentPath, item.path)) {
        return { group, item };
      }
    }
  }
  return {};
}

/**
 * Encuentra un item por path en la navegación
 */
function findNavItemByPath(
  navigation: NavGroup[],
  path: string,
): NavItem | undefined {
  for (const group of navigation) {
    const item = group.items.find(
      (item) => item.path === path || path.startsWith(item.path + "/"),
    );
    if (item) return item;
  }
  return undefined;
}

// ============================================================================
// HOOK
// ============================================================================

export function useNavigation(): UseNavigationReturn {
  const location = useLocation();
  const { hasPermission, role, isLoading } = usePermissions();

  const currentPath = location.pathname;

  /**
   * Navegación filtrada según permisos del usuario
   * Solo se recalcula cuando cambian los permisos o el rol
   */
  const navigation = useMemo<NavGroup[]>(() => {
    return filterNavigation(navigationConfig, hasPermission, role === "admin");
  }, [hasPermission, role]);

  /**
   * Todos los items accesibles en formato plano
   * Útil para búsquedas y comandos rápidos
   */
  const allItems = useMemo<NavItem[]>(() => {
    return navigation.flatMap((group) => group.items);
  }, [navigation]);

  /**
   * Verifica si un path está activo
   * Memoizado con el path actual como dependencia
   */
  const isPathActive = useCallback(
    (path: string): boolean => {
      return checkPathActive(currentPath, path);
    },
    [currentPath],
  );

  /**
   * Verifica si un item de navegación está activo
   */
  const isItemActive = useCallback(
    (item: NavItem): boolean => {
      return checkPathActive(currentPath, item.path);
    },
    [currentPath],
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
    return findCurrentBreadcrumb(navigation, currentPath);
  }, [navigation, currentPath]);

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
