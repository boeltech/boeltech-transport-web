/* eslint-disable react-refresh/only-export-components */
/**
 * Application Routes
 *
 * Configuración de rutas con React Router.
 * Incluye lazy loading, guards de autenticación y permisos.
 *
 * Ubicación: src/app/router/routes.tsx
 */

import {
  createBrowserRouter,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Suspense, type ReactNode } from "react";
import { lazyWithRetry } from "@shared/lib/lazyWithRetry";

// ============================================
// Error Boundary
// ============================================
import { RouteErrorBoundary } from "@/pages/errors/components/ErrorBoundary";

// ============================================
// Guards
// ============================================
import {
  PrivateRoute,
  ModuleRoute,
  PermissionRoute,
  AdminRoute,
  PlatformRoute,
} from "./guards";

// ============================================
// Layouts
// ============================================
import { AppLayout } from "@widgets/layout";
import { SettingsRoutes } from "@features/settings";
const AuthLayout = lazyWithRetry(() => import("@widgets/layout/ui/AuthLayout"));

// ============================================
// Loading Fallback
// ============================================
function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}

/**
 * La bandeja de aprobaciones vive como tab del hub de Finanzas. La ruta propia
 * sigue montada porque la usan los deep-links del dashboard, el detalle de viaje
 * y el `action_href` que genera el backend en las notificaciones.
 */
function ApprovalsHubRedirect() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set("tab", "approvals");
  return <Navigate to={`/finance?${params.toString()}`} replace />;
}

// ============================================
// Helper para Suspense
// ============================================
function withSuspense(
  Component: React.LazyExoticComponent<React.ComponentType>,
): ReactNode {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

// ============================================
// Lazy Loading de Páginas
// ============================================

// Root & Landing
const RootRedirect = lazyWithRetry(() => import("@/pages/root"));
const LandingPage = lazyWithRetry(() => import("@/pages/landing"));
const TermsPage = lazyWithRetry(() => import("@/pages/legal/TermsPage"));
const PrivacyPage = lazyWithRetry(() => import("@/pages/legal/PrivacyPage"));

// Auth
const LoginPage = lazyWithRetry(() => import("@/pages/auth/login"));
const ForgotPasswordPage = lazyWithRetry(() => import("@/pages/auth/forgot-password"));
const ResetPasswordPage = lazyWithRetry(() => import("@/pages/auth/reset-password"));
const VerifyEmailPage = lazyWithRetry(() => import("@/pages/auth/verify-email"));
const RegisterPage = lazyWithRetry(() => import("@/pages/auth/register"));
const AcceptInvitationPage = lazyWithRetry(() =>
  import("@features/invitations").then((m) => ({
    default: m.AcceptInvitationPage,
  })),
);
const ActivateTenantPage = lazyWithRetry(() =>
  import("@features/tenant-activations").then((m) => ({
    default: m.ActivateTenantPage,
  })),
);

const BillingSubscriptionPage = lazyWithRetry(() =>
  import("@features/billing").then((m) => ({
    default: m.BillingSubscriptionPage,
  })),
);

// Dashboard
const DashboardPage = lazyWithRetry(
  () => import("@features/dashboard/presentation/DashboardPage"),
);

// Trips
const TripCanvasPage = lazyWithRetry(() =>
  import("@features/trips/presentation/pages/create/TripCanvasPage").then(
    (m) => ({
      default: m.TripCanvasPage,
    }),
  ),
);
const FinishTripRedirect = lazyWithRetry(() =>
  import("@features/trips/presentation/pages/FinishTripRedirect").then((m) => ({
    default: m.FinishTripRedirect,
  })),
);
const TripDetailPage = lazyWithRetry(() =>
  import("@features/trips/presentation/pages/TripDetailPage").then((m) => ({
    default: m.TripDetailPage,
  })),
);
const TripEditRedirect = lazyWithRetry(() =>
  import("@features/trips/presentation/pages/TripEditRedirect").then((m) => ({
    default: m.TripEditRedirect,
  })),
);
const TripsListPage = lazyWithRetry(() =>
  import("@features/trips/presentation/pages/TripsListPage").then((m) => ({
    default: m.TripsListPage,
  })),
);
// NOTE: /trips/:id/edit redirects to detail (ADR-0078). TripFormPage remains in repo.
// const TripEditPage = lazyWithRetry(() => import("@/pages/trips/edit"));

// Vehicles
const VehicleListPage = lazyWithRetry(() =>
  import("@features/vehicles/presentation/pages/VehicleListPage").then((m) => ({
    default: m.VehicleListPage,
  })),
);
const VehicleDetailPage = lazyWithRetry(() =>
  import("@features/vehicles/presentation/pages/VehicleDetailPage").then(
    (m) => ({
      default: m.VehicleDetailPage,
    }),
  ),
);
const CreateVehiclePage = lazyWithRetry(() =>
  import("@features/vehicles/presentation/pages/CreateVehiclePage").then(
    (m) => ({
      default: m.CreateVehiclePage,
    }),
  ),
);
const EditVehiclePage = lazyWithRetry(() =>
  import("@features/vehicles/presentation/pages/EditVehiclePage").then((m) => ({
    default: m.EditVehiclePage,
  })),
);

// Trailers (ADR-0077)
const TrailerListPage = lazyWithRetry(() =>
  import("@features/trailers").then((m) => ({
    default: m.TrailerListPage,
  })),
);
const TrailerDetailPage = lazyWithRetry(() =>
  import("@features/trailers").then((m) => ({
    default: m.TrailerDetailPage,
  })),
);
const CreateTrailerPage = lazyWithRetry(() =>
  import("@features/trailers").then((m) => ({
    default: m.CreateTrailerPage,
  })),
);
const EditTrailerPage = lazyWithRetry(() =>
  import("@features/trailers").then((m) => ({
    default: m.EditTrailerPage,
  })),
);

// Drivers
const DriversListPage = lazyWithRetry(() =>
  import("@features/drivers").then((m) => ({
    default: m.DriversListPage,
  })),
);
const DriverDetailPage = lazyWithRetry(() =>
  import("@features/drivers/presentation").then((m) => ({
    default: m.DriverDetailPage,
  })),
);
const DriverCreatePage = lazyWithRetry(() =>
  import("@features/drivers/presentation").then((m) => ({
    default: m.DriverCreatePage,
  })),
);
const DriverEditPage = lazyWithRetry(() =>
  import("@features/drivers/presentation").then((m) => ({
    default: m.DriverEditPage,
  })),
);

// Employees
const EmployeesListPage = lazyWithRetry(() =>
  import("@features/employees").then((m) => ({
    default: m.EmployeesListPage,
  })),
);
const EmployeeDetailPage = lazyWithRetry(() =>
  import("@features/employees").then((m) => ({
    default: m.EmployeeDetailPage,
  })),
);
const EmployeeFormPage = lazyWithRetry(() =>
  import("@features/employees").then((m) => ({
    default: m.EmployeeFormPage,
  })),
);
const EmployeeEditPage = lazyWithRetry(() =>
  import("@features/employees").then((m) => ({
    default: m.EmployeeEditPage,
  })),
);

// Clients
const ClientsListPage = lazyWithRetry(() =>
  import("@features/clients").then((m) => ({
    default: m.ClientsListPage,
  })),
);
const ClientDetailPage = lazyWithRetry(() =>
  import("@features/clients").then((m) => ({ default: m.ClientDetailPage })),
);
const ClientCreatePage = lazyWithRetry(() =>
  import("@features/clients").then((m) => ({ default: m.ClientCreatePage })),
);
const ClientEditPage = lazyWithRetry(() =>
  import("@features/clients").then((m) => ({ default: m.ClientEditPage })),
);

// Branches
const BranchesListPage = lazyWithRetry(() =>
  import("@features/branches").then((m) => ({ default: m.BranchesListPage })),
);
const BranchDetailPage = lazyWithRetry(() =>
  import("@features/branches").then((m) => ({ default: m.BranchDetailPage })),
);
const BranchCreatePage = lazyWithRetry(() =>
  import("@features/branches").then((m) => ({ default: m.BranchCreatePage })),
);
const BranchEditPage = lazyWithRetry(() =>
  import("@features/branches").then((m) => ({ default: m.BranchEditPage })),
);

// Maintenance
// const MaintenanceListPage = lazyWithRetry(() => import("@/pages/maintenance"));
// const MaintenanceCreatePage = lazyWithRetry(() => import("@/pages/maintenance/create"));

// Fuel
// const FuelListPage = lazyWithRetry(() => import("@/pages/fuel"));
// const FuelCreatePage = lazyWithRetry(() => import("@/pages/fuel/create"));

// Finance / Invoices
const FinancePage = lazyWithRetry(() =>
  import("@features/finance").then((m) => ({ default: m.FinancePage })),
);
const InvoiceDetailPage = lazyWithRetry(() =>
  import("@features/invoicing").then((m) => ({ default: m.InvoiceDetailPage })),
);
const CreateInvoicePage = lazyWithRetry(() =>
  import("@features/invoicing").then((m) => ({ default: m.CreateInvoicePage })),
);

// Reports
const ReportsPage = lazyWithRetry(() =>
  import("@features/reports").then((m) => ({ default: m.ReportsPage })),
);

// Users (Admin)
const UsersListPage = lazyWithRetry(() =>
  import("@features/users").then((m) => ({ default: m.UsersListPage })),
);
const UserDetailPage = lazyWithRetry(() =>
  import("@features/users").then((m) => ({ default: m.UserDetailPage })),
);
const UserManagementActivityPage = lazyWithRetry(() =>
  import("@features/users").then((m) => ({
    default: m.UserManagementActivityPage,
  })),
);
const UserCreatePage = lazyWithRetry(() =>
  import("@features/users").then((m) => ({ default: m.UserCreatePage })),
);
const UserEditPage = lazyWithRetry(() =>
  import("@features/users").then((m) => ({ default: m.UserEditPage })),
);

// Settings (Admin)
// const SettingsPage = lazyWithRetry(() => import("@/pages/settings"));

// Mi cuenta (autoservicio — todos los autenticados)
const AccountShell = lazyWithRetry(() =>
  import("@/pages/account").then((m) => ({ default: m.AccountShell })),
);
const AccountProfilePage = lazyWithRetry(() =>
  import("@/pages/account").then((m) => ({ default: m.AccountProfilePage })),
);
const AccountSecurityPage = lazyWithRetry(() =>
  import("@/pages/account").then((m) => ({ default: m.AccountSecurityPage })),
);

const NotificationsInboxPage = lazyWithRetry(() =>
  import("@features/notifications").then((m) => ({
    default: m.NotificationsInboxPage,
  })),
);

// Design System (gated a admin)
const DesignSystemPage = lazyWithRetry(() => import("@/pages/design-system"));

// Onboarding guiado (post-invite / primera sesión heurística)
const OnboardingPage = lazyWithRetry(() => import("@/pages/onboarding/OnboardingPage"));

const PlatformLoginPage = lazyWithRetry(() =>
  import("@features/platform").then((module) => ({
    default: module.PlatformLoginPage,
  })),
);
const PlatformShell = lazyWithRetry(() =>
  import("@features/platform").then((module) => ({
    default: module.PlatformShell,
  })),
);
const PlatformDashboardPage = lazyWithRetry(() =>
  import("@features/platform").then((module) => ({
    default: module.PlatformDashboardPage,
  })),
);
const PlatformTenantsListPage = lazyWithRetry(() =>
  import("@features/platform").then((module) => ({
    default: module.PlatformTenantsListPage,
  })),
);
const PlatformTenantCreatePage = lazyWithRetry(() =>
  import("@features/platform").then((module) => ({
    default: module.PlatformTenantCreatePage,
  })),
);
const PlatformTenantDetailPage = lazyWithRetry(() =>
  import("@features/platform").then((module) => ({
    default: module.PlatformTenantDetailPage,
  })),
);
const PlatformGlobalCatalogsPage = lazyWithRetry(() =>
  import("@features/platform").then((module) => ({
    default: module.PlatformGlobalCatalogsPage,
  })),
);
const PlatformAuditLogPage = lazyWithRetry(() =>
  import("@features/platform").then((module) => ({
    default: module.PlatformAuditLogPage,
  })),
);
const PlatformArLedgerPage = lazyWithRetry(() =>
  import("@features/platform").then((module) => ({
    default: module.PlatformArLedgerPage,
  })),
);
const PlatformSecurityPage = lazyWithRetry(() =>
  import("@features/platform").then((module) => ({
    default: module.PlatformSecurityPage,
  })),
);

// Errors
const NotFoundPage = lazyWithRetry(() => import("@/pages/errors/not-found"));
const ForbiddenPage = lazyWithRetry(() => import("@/pages/errors/forbidden"));
const ServerErrorPage = lazyWithRetry(() => import("@/pages/errors/server-error"));
const MaintenancePage = lazyWithRetry(() => import("@/pages/errors/maintenance"));

/** Routes backed by gitignored `src/pages/dev/` — only registered in Vite dev */
const devOnlyAppChildRoutes = import.meta.env.DEV
  ? ([
      {
        path: "/dev/address-input",
        element: withSuspense(lazyWithRetry(() => import("@/pages/dev/address-input"))),
      },
    ] as const)
  : [];

// ============================================
// Router Configuration
// ============================================

export const router = createBrowserRouter([
  // ==========================================
  // Ruta Raíz - Redirect dinámico
  // ==========================================
  {
    path: "/",
    element: withSuspense(RootRedirect),
    errorElement: <RouteErrorBoundary />,
  },

  // ==========================================
  // Landing Page (Pública)
  // ==========================================
  {
    path: "/welcome",
    element: withSuspense(LandingPage),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/terms",
    element: withSuspense(TermsPage),
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/privacy",
    element: withSuspense(PrivacyPage),
    errorElement: <RouteErrorBoundary />,
  },

  // ==========================================
  // Rutas Públicas (Auth)
  // ==========================================
  {
    element: withSuspense(AuthLayout),
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "/login",
        element: withSuspense(LoginPage),
      },
      {
        path: "/forgot-password",
        element: withSuspense(ForgotPasswordPage),
      },
      {
        path: "/reset-password",
        element: withSuspense(ResetPasswordPage),
      },
      {
        path: "/verify-email",
        element: withSuspense(VerifyEmailPage),
      },
      {
        path: "/register",
        element: withSuspense(RegisterPage),
      },
      {
        path: "/accept-invitation",
        element: withSuspense(AcceptInvitationPage),
      },
      {
        path: "/activate-tenant",
        element: withSuspense(ActivateTenantPage),
      },
    ],
  },

  // ==========================================
  // Rutas Privadas (requieren autenticación)
  // ==========================================
  {
    element: <PrivateRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          // ========================================
          // Dashboard (todos los autenticados)
          // ========================================
          {
            path: "/dashboard",
            element: withSuspense(DashboardPage),
          },
          ...devOnlyAppChildRoutes,

          // ========================================
          // Mi cuenta (todos los autenticados)
          // ========================================
          {
            path: "/account",
            element: withSuspense(AccountShell),
            children: [
              {
                index: true,
                element: withSuspense(AccountProfilePage),
              },
              {
                path: "security",
                element: withSuspense(AccountSecurityPage),
              },
            ],
          },
          {
            path: "/profile",
            element: <Navigate to="/account" replace />,
          },
          {
            path: "/notifications",
            element: withSuspense(NotificationsInboxPage),
          },
          {
            path: "/onboarding",
            element: withSuspense(OnboardingPage),
          },

          // SaaS subscription paywall (reachable without settings/billing RBAC)
          {
            path: "/settings/subscription",
            element: withSuspense(BillingSubscriptionPage),
          },

          // ========================================
          // Módulo: Trips (Viajes)
          // ========================================
          {
            element: <ModuleRoute module="trips" />,
            children: [
              {
                path: "/trips/:id",
                element: withSuspense(TripDetailPage),
              },
              {
                path: "/trips/:id/edit",
                element: withSuspense(TripEditRedirect),
              },
              {
                path: "/trips",
                element: withSuspense(TripsListPage),
              },
            ],
          },
          // Trips - Create (requiere permiso)
          {
            element: <PermissionRoute module="trips" action="create" />,
            children: [
              {
                path: "/trips/new",
                element: withSuspense(TripCanvasPage),
              },
            ],
          },
          // Trips - Finish (requiere permiso)
          {
            element: <PermissionRoute module="trips" action="update" />,
            children: [
              {
                path: "/trips/:id/finish",
                element: withSuspense(FinishTripRedirect),
              },
            ],
          },

          // ========================================
          // Módulo: Vehicles (Vehículos)
          // ========================================
          {
            element: <ModuleRoute module="vehicles" />,
            children: [
              {
                path: "/vehicles",
                element: withSuspense(VehicleListPage),
              },
              {
                path: "/vehicles/:id",
                element: withSuspense(VehicleDetailPage),
              },
            ],
          },
          {
            element: <PermissionRoute module="vehicles" action="create" />,
            children: [
              {
                path: "/vehicles/new",
                element: withSuspense(CreateVehiclePage),
              },
            ],
          },
          {
            element: <PermissionRoute module="vehicles" action="update" />,
            children: [
              {
                path: "/vehicles/:id/edit",
                element: withSuspense(EditVehiclePage),
              },
            ],
          },

          // ========================================
          // Módulo: Trailers (Remolques) — ADR-0077
          // ========================================
          {
            element: <ModuleRoute module="trailers" />,
            children: [
              {
                path: "/trailers",
                element: withSuspense(TrailerListPage),
              },
              {
                path: "/trailers/:id",
                element: withSuspense(TrailerDetailPage), // redirect → /trailers
              },
            ],
          },
          {
            element: <PermissionRoute module="trailers" action="create" />,
            children: [
              {
                path: "/trailers/new",
                element: withSuspense(CreateTrailerPage),
              },
            ],
          },
          {
            element: <PermissionRoute module="trailers" action="update" />,
            children: [
              {
                path: "/trailers/:id/edit",
                element: withSuspense(EditTrailerPage),
              },
            ],
          },

          // ========================================
          // Módulo: Drivers (Conductores)
          // ========================================
          {
            element: <ModuleRoute module="drivers" />,
            children: [
              {
                path: "/drivers",
                element: withSuspense(DriversListPage),
              },
              {
                path: "/drivers/:id",
                element: withSuspense(DriverDetailPage),
              },
            ],
          },
          {
            element: <PermissionRoute module="drivers" action="create" />,
            children: [
              {
                path: "/drivers/new",
                element: withSuspense(DriverCreatePage),
              },
              {
                path: "/drivers/:id/edit",
                element: withSuspense(DriverEditPage),
              },
            ],
          },

          // ========================================
          // Módulo: Employees (Empleados)
          // ========================================
          {
            element: <ModuleRoute module="employees" />,
            children: [
              {
                path: "/employees",
                element: withSuspense(EmployeesListPage),
              },
              {
                path: "/employees/:id",
                element: withSuspense(EmployeeDetailPage),
              },
            ],
          },
          {
            element: <PermissionRoute module="employees" action="create" />,
            children: [
              {
                path: "/employees/new",
                element: withSuspense(EmployeeFormPage),
              },
            ],
          },
          {
            element: <PermissionRoute module="employees" action="update" />,
            children: [
              {
                path: "/employees/:id/edit",
                element: withSuspense(EmployeeEditPage),
              },
            ],
          },

          // ========================================
          // Módulo: Clients (Clientes)
          // ========================================
          {
            element: <ModuleRoute module="clients" />,
            children: [
              {
                path: "/clients",
                element: withSuspense(ClientsListPage),
              },
              {
                path: "/clients/:id",
                element: withSuspense(ClientDetailPage),
              },
            ],
          },
          {
            element: <PermissionRoute module="clients" action="create" />,
            children: [
              {
                path: "/clients/new",
                element: withSuspense(ClientCreatePage),
              },
            ],
          },
          {
            element: <PermissionRoute module="clients" action="update" />,
            children: [
              {
                path: "/clients/:id/edit",
                element: withSuspense(ClientEditPage),
              },
            ],
          },

          // ========================================
          // Módulo: Branches (Sucursales)
          // ========================================
          {
            element: <ModuleRoute module="branches" />,
            children: [
              {
                path: "/branches",
                element: withSuspense(BranchesListPage),
              },
              {
                path: "/branches/:id",
                element: withSuspense(BranchDetailPage),
              },
            ],
          },
          {
            element: <PermissionRoute module="branches" action="create" />,
            children: [
              {
                path: "/branches/new",
                element: withSuspense(BranchCreatePage),
              },
            ],
          },
          {
            element: <PermissionRoute module="branches" action="update" />,
            children: [
              {
                path: "/branches/:id/edit",
                element: withSuspense(BranchEditPage),
              },
            ],
          },

          // ========================================
          // Módulo: Maintenance (Mantenimiento)
          // ========================================
          {
            element: <ModuleRoute module="maintenance" />,
            children: [
              // {
              //   path: "/maintenance",
              //   element: withSuspense(MaintenanceListPage),
              // },
            ],
          },
          {
            element: <PermissionRoute module="maintenance" action="create" />,
            children: [
              // {
              //   path: "/maintenance/new",
              //   element: withSuspense(MaintenanceCreatePage),
              // },
            ],
          },

          // ========================================
          // Módulo: Fuel (Combustible)
          // ========================================
          {
            element: <ModuleRoute module="fuel" />,
            children: [
              // {
              //   path: "/fuel",
              //   element: withSuspense(FuelListPage),
              // },
            ],
          },
          {
            element: <PermissionRoute module="fuel" action="create" />,
            children: [
              // {
              //   path: "/fuel/new",
              //   element: withSuspense(FuelCreatePage),
              // },
            ],
          },

          // ========================================
          // Módulo: Invoices / Finance (Facturación)
          // ========================================
          {
            element: <ModuleRoute module="invoices" />,
            children: [
              {
                path: "/finance",
                element: withSuspense(FinancePage),
              },
              {
                path: "/invoices/:id",
                element: withSuspense(InvoiceDetailPage),
              },
            ],
          },
          {
            element: <PermissionRoute module="invoices" action="create" />,
            children: [
              {
                path: "/invoices/new",
                element: withSuspense(CreateInvoicePage),
              },
            ],
          },
          {
            element: <PermissionRoute module="invoices" action="update" />,
            children: [
              {
                path: "/invoices/:id/edit",
                element: withSuspense(CreateInvoicePage),
              },
            ],
          },

          // ========================================
          // Módulo: Finance Approvals (Aprobaciones)
          // ========================================
          {
            element: <ModuleRoute module="finance_approvals" />,
            children: [
              {
                path: "/finance/approvals",
                element: <ApprovalsHubRedirect />,
              },
            ],
          },

          // ========================================
          // Módulo: Reports (Reportes)
          // ========================================
          {
            element: <ModuleRoute module="reports" />,
            children: [
              {
                path: "/reports",
                element: withSuspense(ReportsPage),
              },
            ],
          },

          // ========================================
          // Módulo: Users (Admin)
          // ========================================
          {
            element: <ModuleRoute module="users" />,
            children: [
              {
                path: "/users",
                element: withSuspense(UsersListPage),
              },
              {
                path: "/users/activity",
                element: withSuspense(UserManagementActivityPage),
              },
              {
                path: "/users/:id",
                element: withSuspense(UserDetailPage),
              },
            ],
          },
          {
            element: <PermissionRoute module="users" action="create" />,
            children: [
              {
                path: "/users/new",
                element: withSuspense(UserCreatePage),
              },
            ],
          },
          {
            element: <PermissionRoute module="users" action="update" />,
            children: [
              {
                path: "/users/:id/edit",
                element: withSuspense(UserEditPage),
              },
            ],
          },

          // ========================================
          // Módulo: Settings
          // ========================================
          {
            element: <ModuleRoute module="settings" />,
            children: [
              // {
              //   path: "/settings",
              //   element: withSuspense(SettingsPage),
              // },
              {
                path: "/settings/*",
                element: <SettingsRoutes />,
              },
            ],
          },

          // ========================================
          // Design System — gated a admin
          // Referencia visual viva (tokens, tipografía, componentes).
          // ========================================
          {
            element: <AdminRoute />,
            children: [
              {
                path: "/design-system",
                element: withSuspense(DesignSystemPage),
              },
            ],
          },
        ],
      },
    ],
  },

  // ==========================================
  // Plataforma SaaS (tenant 0) — fuera del AppLayout tenant
  // ==========================================
  {
    path: "/platform/login",
    element: withSuspense(PlatformLoginPage),
    errorElement: <RouteErrorBoundary />,
  },
  {
    element: <PlatformRoute />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: withSuspense(PlatformShell),
        children: [
          {
            path: "/platform",
            element: withSuspense(PlatformDashboardPage),
          },
          {
            path: "/platform/tenants",
            element: withSuspense(PlatformTenantsListPage),
          },
          {
            path: "/platform/tenants/new",
            element: withSuspense(PlatformTenantCreatePage),
          },
          {
            path: "/platform/tenants/:id",
            element: withSuspense(PlatformTenantDetailPage),
          },
          {
            path: "/platform/catalogs",
            element: withSuspense(PlatformGlobalCatalogsPage),
          },
          {
            path: "/platform/audit",
            element: withSuspense(PlatformAuditLogPage),
          },
          {
            path: "/platform/billing/ar",
            element: withSuspense(PlatformArLedgerPage),
          },
          {
            path: "/platform/security",
            element: withSuspense(PlatformSecurityPage),
          },
        ],
      },
    ],
  },

  // ==========================================
  // Páginas de Error (acceso directo)
  // ==========================================
  {
    path: "/forbidden",
    element: withSuspense(ForbiddenPage),
  },
  {
    path: "/error",
    element: withSuspense(ServerErrorPage),
  },
  {
    path: "/maintenance",
    element: withSuspense(MaintenancePage),
  },

  // ==========================================
  // 404 - Catch all
  // ==========================================
  {
    path: "*",
    element: withSuspense(NotFoundPage),
  },
]);

