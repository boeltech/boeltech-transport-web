/**
 * useRole Hook
 *
 * Provides utilities for role-based UI logic.
 * Use this hook in components to check user roles and permissions.
 */

// import { useAuth } from "@/app/providers/AuthProvider";
import { ROLES, type UserRole, hasRoleLevel } from "@/shared/constants/roles";
import { useAuth } from "@features/auth";

export function useRole() {
  const { user } = useAuth();

  const currentRole = user?.role as UserRole | undefined;

  /**
   * Check if user has one of the specified roles
   * @param role - Single role or array of roles
   * @returns true if user has any of the specified roles
   *
   * @example
   * const { hasRole } = useRole();
   *
   * if (hasRole('admin')) {
   *   // Show admin-only content
   * }
   *
   * if (hasRole(['admin', 'manager'])) {
   *   // Show content for admin or manager
   * }
   */
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!currentRole) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(currentRole);
  };

  /**
   * Check if user has a role level >= required level
   * @example
   * const { hasMinRoleLevel } = useRole();
   *
   * if (hasMinRoleLevel('operator')) {
   *   // True for operator, accountant, manager, admin
   * }
   */
  const hasMinRoleLevel = (requiredRole: UserRole): boolean => {
    if (!currentRole) return false;
    return hasRoleLevel(currentRole, requiredRole);
  };

  // Convenience role checkers
  const isAdmin = () => hasRole(ROLES.ADMIN);
  const isManager = () => hasRole(ROLES.MANAGER);
  const isAccountant = () => hasRole(ROLES.ACCOUNTANT);
  const isOperator = () => hasRole(ROLES.OPERATOR);
  const isClient = () => hasRole(ROLES.CLIENT);

  // Combined role checkers (common combinations)
  const isAdminOrManager = () => hasRole([ROLES.ADMIN, ROLES.MANAGER]);
  const canManageUsers = () => isAdmin(); // Only admin can manage users
  const canManageDrivers = () => isAdminOrManager();
  const canManageTrips = () =>
    hasRole([ROLES.ADMIN, ROLES.MANAGER, ROLES.OPERATOR]);
  const canViewFinancials = () =>
    hasRole([ROLES.ADMIN, ROLES.MANAGER, ROLES.ACCOUNTANT]);

  return {
    // Current role
    role: currentRole,

    // Generic checkers
    hasRole,
    hasMinRoleLevel,

    // Specific role checkers
    isAdmin,
    isManager,
    isAccountant,
    isOperator,
    isClient,

    // Combined checkers
    isAdminOrManager,
    canManageUsers,
    canManageDrivers,
    canManageTrips,
    canViewFinancials,
  };
}
