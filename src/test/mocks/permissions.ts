import { vi } from "vitest";
import type {
  Action,
  Module,
  PermissionContextValue,
  PermissionString,
} from "@shared/permissions";
import type { UserRole } from "@shared/constants/roles";

type PermissionsModule = typeof import("@shared/permissions");

/**
 * Qué concede el mock: todo, nada, una lista `modulo.accion` o un predicado.
 */
export type PermissionGrant =
  | "all"
  | "none"
  | readonly PermissionString[]
  | ((module: Module, action: Action) => boolean);

function toPredicate(grant: PermissionGrant): (module: Module, action: Action) => boolean {
  if (grant === "all") return () => true;
  if (grant === "none") return () => false;
  if (typeof grant === "function") return grant;
  const granted = new Set<string>(grant);
  return (module, action) => granted.has(`${module}.${action}`);
}

function splitPermission(permission: PermissionString): [Module, Action] {
  const [module, action] = permission.split(".") as [Module, Action];
  return [module, action];
}

/** Valor completo de `usePermissions()` coherente con el `grant`. */
export function createPermissionsValue(
  grant: PermissionGrant = "all",
  overrides: Partial<PermissionContextValue> = {},
): PermissionContextValue {
  const allows = toPredicate(grant);
  const can = (permission: PermissionString) => allows(...splitPermission(permission));
  const role: UserRole | null = overrides.role === undefined ? "admin" : overrides.role;
  return {
    role,
    permissions: Array.isArray(grant) ? [...grant] : [],
    isLoading: false,
    isAuthenticated: true,
    hasPermission: vi.fn(allows),
    can: vi.fn(can),
    canAll: vi.fn((list: PermissionString[]) => list.every(can)),
    canAny: vi.fn((list: PermissionString[]) => list.some(can)),
    hasRole: vi.fn((r: UserRole) => r === role),
    hasAnyRole: vi.fn((roles: UserRole[]) => role !== null && roles.includes(role)),
    getModuleActions: vi.fn(() => []),
    getAccessibleModules: vi.fn(() => []),
    ...overrides,
  };
}

export const mockUsePermissions = vi.fn<() => PermissionContextValue>(() =>
  createPermissionsValue("all"),
);

/** Fija los permisos hasta el próximo `resetPermissionsMock`. Devuelve el valor para espiar `hasPermission`. */
export function grantPermissions(
  grant: PermissionGrant,
  overrides: Partial<PermissionContextValue> = {},
): PermissionContextValue {
  const value = createPermissionsValue(grant, overrides);
  mockUsePermissions.mockReturnValue(value);
  return value;
}

export function resetPermissionsMock(): void {
  mockUsePermissions.mockReset();
}

/**
 * Reemplazo de los hooks de `@shared/permissions` (guards y reglas de dominio
 * no se incluyen; si el componente los usa, mockea con `importOriginal`):
 *
 * vi.mock("@shared/permissions", async () =>
 *   (await import("@/test/mocks/permissions")).permissionsModuleMock());
 */
export function permissionsModuleMock(): Pick<
  PermissionsModule,
  | "usePermissions"
  | "useHasPermission"
  | "useHasRole"
  | "useCanAll"
  | "useCanAny"
  | "useRole"
  | "useIsAuthenticated"
> {
  return {
    usePermissions: () => mockUsePermissions(),
    useHasPermission: (module, action) => mockUsePermissions().hasPermission(module, action),
    useHasRole: (role) => mockUsePermissions().hasRole(role),
    useCanAll: (list) => mockUsePermissions().canAll(list),
    useCanAny: (list) => mockUsePermissions().canAny(list),
    useRole: () => mockUsePermissions().role,
    useIsAuthenticated: () => mockUsePermissions().isAuthenticated,
  };
}
