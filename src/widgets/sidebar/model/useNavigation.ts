import { useMemo } from "react";
import { usePermissions } from "@app/providers/PermissionProvider";
import { navigationConfig } from "./navigation";
import { NavGroup, NavItem } from "./types";

/**
 * Hook que filtra la navegación según los permisos del usuario
 *
 * @returns Navegación filtrada y helpers
 */
export const useNavigation = () => {
  const { hasModuleAccess, isAdmin } = usePermissions();

  const filteredNavigation = useMemo((): NavGroup[] => {
    // Admin ve todo
    if (isAdmin) {
      return navigationConfig;
    }

    return navigationConfig
      .map((group): NavGroup | null => {
        // Si el grupo requiere un módulo, verificar acceso
        if (group.module && !hasModuleAccess(group.module)) {
          return null;
        }

        // Filtrar items dentro del grupo
        const filteredItems = group.items.filter((item) => {
          if (!item.module) return true;
          return hasModuleAccess(item.module);
        });

        // Si no hay items visibles, no mostrar el grupo
        if (filteredItems.length === 0) {
          return null;
        }

        return {
          ...group,
          items: filteredItems,
        };
      })
      .filter((group): group is NavGroup => group !== null);
  }, [hasModuleAccess, isAdmin]);

  // Obtener todos los items planos (para búsqueda, etc.)
  const allItems = useMemo((): NavItem[] => {
    return filteredNavigation.flatMap((group) => group.items);
  }, [filteredNavigation]);

  return {
    navigation: filteredNavigation,
    allItems,
  };
};
