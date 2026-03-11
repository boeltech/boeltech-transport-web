/**
 * RoleGuard Component
 *
 * Conditionally renders children based on user role.
 * Alternative to using useRole() hook directly in every component.
 *
 * @example
 * // Show button only for admin
 * <RoleGuard roles={['admin']}>
 *   <Button>Delete User</Button>
 * </RoleGuard>
 *
 * @example
 * // Show content for multiple roles
 * <RoleGuard roles={['admin', 'manager']}>
 *   <ManagerDashboard />
 * </RoleGuard>
 *
 * @example
 * // Show fallback for unauthorized users
 * <RoleGuard
 *   roles={['admin']}
 *   fallback={<p>You don't have permission to view this.</p>}
 * >
 *   <AdminPanel />
 * </RoleGuard>
 */

import { type ReactNode } from "react";
import { useRole } from "@/shared/hooks/useRole";
import type { UserRole } from "@/shared/constants/roles";

interface RoleGuardProps {
  /** Allowed roles - user must have one of these roles */
  roles: UserRole | UserRole[];
  /** Content to render if user has required role */
  children: ReactNode;
  /** Optional fallback content if user doesn't have required role */
  fallback?: ReactNode;
  /** If true, requires user to have ALL specified roles instead of ANY */
  requireAll?: boolean;
}

export function RoleGuard({
  roles,
  children,
  fallback = null,
  requireAll = false,
}: RoleGuardProps) {
  const { hasRole, role: currentRole } = useRole();

  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  const hasPermission = requireAll
    ? allowedRoles.every((role) => hasRole(role))
    : hasRole(allowedRoles);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * AdminOnly Component
 * Shorthand for <RoleGuard roles={['admin']} />
 */
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard roles={["admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * ManagerOrAbove Component
 * Shows content for admin or manager only
 */
export function ManagerOrAbove({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard roles={["admin", "manager"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

// Example Usage in a Component:
// import {
//   RoleGuard,
//   AdminOnly,
//   ManagerOrAbove,
// } from "@/shared/components/RoleGuard";

// function Dashboard() {
//   return (
//     <div>
//       <h1>Dashboard</h1>

//       {/* Only admin can see this */}
//       <AdminOnly>
//         <Button onClick={deleteAllData}>Delete All Data</Button>
//       </AdminOnly>

//       {/* Admin or Manager can see this */}
//       <ManagerOrAbove>
//         <RevenueChart />
//       </ManagerOrAbove>

//       {/* Multiple specific roles */}
//       <RoleGuard roles={["accountant", "manager", "admin"]}>
//         <FinancialReports />
//       </RoleGuard>

//       {/* With fallback */}
//       <RoleGuard
//         roles={["admin"]}
//         fallback={<p>Contact admin to access this feature</p>}
//       >
//         <UserManagement />
//       </RoleGuard>
//     </div>
//   );
// }
