/**
 * Permission Module
 *
 * Sistema de autorización basado en roles (RBAC) para el ERP.
 *
 * @example
 * // En componentes - UI condicional
 * import { Can, AdminOnly } from '@features/permissions';
 * import { PERMISSIONS } from '@features/permissions';
 *
 * <Can do={PERMISSIONS.VEHICLES.WRITE}>
 *   <Button>Crear Vehículo</Button>
 * </Can>
 *
 * @example
 * // En componentes - Hook directo
 * import { usePermissions } from '@app/providers/PermissionProvider';
 *
 * const { hasPermission, hasModuleAccess, isAdmin } = usePermissions();
 * if (hasPermission(PERMISSIONS.INVOICES.STAMP)) {
 *   // Mostrar botón de timbrado
 * }
 *
 * @example
 * // En rutas
 * import { ModuleRoute, PermissionRoute } from '@app/router/guards';
 *
 * <Route element={<ModuleRoute module="finance" />}>
 *   <Route path="/finance/*" element={<FinanceLayout />} />
 * </Route>
 */

// Tipos
export type {
  UserRole,
  Module,
  Action,
  Permission,
  UserPermissions,
  RoleConfig,
  PermissionState,
} from "./model/types";

// Constantes
export {
  PERMISSIONS,
  MODULES,
  ROLE_CONFIGS,
  getAllPermissions,
  getModulePermissions,
} from "./model/constants";

// Componentes UI
export {
  PermissionGate,
  Can,
  ModuleGate,
  RoleGate,
  AdminOnly,
} from "./ui/PermissionGate";

// Note: El PermissionProvider se exporta desde @app/providers
// Note: Los Route Guards se exportan desde @app/router/guards
