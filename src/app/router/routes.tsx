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
} from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";

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
} from "./guards";

// ============================================
// Layouts
// ============================================
import { AppLayout } from "@widgets/layout";
import { SettingsRoutes } from "@features/settings";
const AuthLayout = lazy(() => import("@widgets/layout/ui/AuthLayout"));

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
const RootRedirect = lazy(() => import("@/pages/root"));
const LandingPage = lazy(() => import("@/pages/landing"));

// Auth
const LoginPage = lazy(() => import("@/pages/auth/login"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/forgot-password"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/reset-password"));
const RegisterPage = lazy(() => import("@/pages/auth/register"));
const AcceptInvitationPage = lazy(() =>
  import("@features/invitations").then((m) => ({
    default: m.AcceptInvitationPage,
  })),
);

// Dashboard
const DashboardPage = lazy(
  () => import("@features/dashboard/presentation/DashboardPage"),
);

// Trips
const TripFormPage = lazy(() =>
  import("@features/trips/presentation/pages/create/TripFormPage").then(
    (m) => ({
      default: m.TripFormPage,
    }),
  ),
);
const FinishTripPage = lazy(() =>
  import("@features/trips/presentation/pages/FinishTripPage").then((m) => ({
    default: m.FinishTripPage,
  })),
);
const TripDetailPage = lazy(() =>
  import("@features/trips/presentation/pages/TripDetailPage").then((m) => ({
    default: m.TripDetailPage,
  })),
);
const TripsListPage = lazy(() =>
  import("@features/trips/presentation/pages/TripsListPage").then((m) => ({
    default: m.TripsListPage,
  })),
);
// NOTE: Trip edit reuses TripFormPage — it detects edit mode via :id param
// const TripEditPage = lazy(() => import("@/pages/trips/edit"));

// Vehicles
const VehicleListPage = lazy(() =>
  import("@features/vehicles/presentation/pages/VehicleListPage").then((m) => ({
    default: m.VehicleListPage,
  })),
);
const VehicleDetailPage = lazy(() =>
  import("@features/vehicles/presentation/pages/VehicleDetailPage").then(
    (m) => ({
      default: m.VehicleDetailPage,
    }),
  ),
);
const CreateVehiclePage = lazy(() =>
  import("@features/vehicles/presentation/pages/CreateVehiclePage").then(
    (m) => ({
      default: m.CreateVehiclePage,
    }),
  ),
);
const EditVehiclePage = lazy(() =>
  import("@features/vehicles/presentation/pages/EditVehiclePage").then((m) => ({
    default: m.EditVehiclePage,
  })),
);

// Drivers
const DriversListPage = lazy(() =>
  import("@features/drivers").then((m) => ({
    default: m.DriversListPage,
  })),
);
const DriverDetailPage = lazy(() =>
  import("@features/drivers/presentation").then((m) => ({
    default: m.DriverDetailPage,
  })),
);
const DriverCreatePage = lazy(() =>
  import("@features/drivers/presentation").then((m) => ({
    default: m.DriverCreatePage,
  })),
);
const DriverEditPage = lazy(() =>
  import("@features/drivers/presentation").then((m) => ({
    default: m.DriverEditPage,
  })),
);

// Employees
const EmployeesListPage = lazy(() =>
  import("@features/employees").then((m) => ({
    default: m.EmployeesListPage,
  })),
);
const EmployeeDetailPage = lazy(() =>
  import("@features/employees").then((m) => ({
    default: m.EmployeeDetailPage,
  })),
);
const EmployeeFormPage = lazy(() =>
  import("@features/employees").then((m) => ({
    default: m.EmployeeFormPage,
  })),
);

// Clients
const ClientsListPage = lazy(() =>
  import("@features/clients").then((m) => ({
    default: m.ClientsListPage,
  })),
);
const ClientDetailPage = lazy(() =>
  import("@features/clients").then((m) => ({ default: m.ClientDetailPage })),
);
const ClientCreatePage = lazy(() =>
  import("@features/clients").then((m) => ({ default: m.ClientCreatePage })),
);
const ClientEditPage = lazy(() =>
  import("@features/clients").then((m) => ({ default: m.ClientEditPage })),
);

// Branches
const BranchesListPage = lazy(() =>
  import("@features/branches").then((m) => ({ default: m.BranchesListPage })),
);
const BranchDetailPage = lazy(() =>
  import("@features/branches").then((m) => ({ default: m.BranchDetailPage })),
);
const BranchCreatePage = lazy(() =>
  import("@features/branches").then((m) => ({ default: m.BranchCreatePage })),
);
const BranchEditPage = lazy(() =>
  import("@features/branches").then((m) => ({ default: m.BranchEditPage })),
);

// Maintenance
// const MaintenanceListPage = lazy(() => import("@/pages/maintenance"));
// const MaintenanceCreatePage = lazy(() => import("@/pages/maintenance/create"));

// Fuel
// const FuelListPage = lazy(() => import("@/pages/fuel"));
// const FuelCreatePage = lazy(() => import("@/pages/fuel/create"));

// Finance / Invoices
const FinancePage = lazy(() =>
  import("@features/invoicing").then((m) => ({ default: m.FinancePage })),
);
const InvoiceDetailPage = lazy(() =>
  import("@features/invoicing").then((m) => ({ default: m.InvoiceDetailPage })),
);
const CreateInvoicePage = lazy(() =>
  import("@features/invoicing").then((m) => ({ default: m.CreateInvoicePage })),
);

// Reports
// const ReportsPage = lazy(() => import("@/pages/reports"));

// Users (Admin)
const UsersListPage = lazy(() =>
  import("@features/users").then((m) => ({ default: m.UsersListPage })),
);
const UserDetailPage = lazy(() =>
  import("@features/users").then((m) => ({ default: m.UserDetailPage })),
);
const UserManagementActivityPage = lazy(() =>
  import("@features/users").then((m) => ({
    default: m.UserManagementActivityPage,
  })),
);
const UserCreatePage = lazy(() =>
  import("@features/users").then((m) => ({ default: m.UserCreatePage })),
);
const UserEditPage = lazy(() =>
  import("@features/users").then((m) => ({ default: m.UserEditPage })),
);

// Settings (Admin)
// const SettingsPage = lazy(() => import("@/pages/settings"));

// Profile (autoservicio — todos los autenticados)
const ProfilePage = lazy(() => import("@/pages/profile"));

// Onboarding guiado (post-invite / primera sesión heurística)
const OnboardingPage = lazy(() => import("@/pages/onboarding/OnboardingPage"));

// Errors
const NotFoundPage = lazy(() => import("@/pages/errors/not-found"));
const ForbiddenPage = lazy(() => import("@/pages/errors/forbidden"));
const ServerErrorPage = lazy(() => import("@/pages/errors/server-error"));
const MaintenancePage = lazy(() => import("@/pages/errors/maintenance"));

/** Routes backed by gitignored `src/pages/dev/` — only registered in Vite dev */
const devOnlyAppChildRoutes = import.meta.env.DEV
  ? ([
      {
        path: "/dev/address-input",
        element: withSuspense(lazy(() => import("@/pages/dev/address-input"))),
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
        path: "/register",
        element: withSuspense(RegisterPage),
      },
      {
        path: "/accept-invitation",
        element: withSuspense(AcceptInvitationPage),
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
          // Profile (todos los autenticados)
          // ========================================
          {
            path: "/profile",
            element: withSuspense(ProfilePage),
          },
          {
            path: "/onboarding",
            element: withSuspense(OnboardingPage),
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
                element: withSuspense(TripFormPage),
              },
            ],
          },
          // Trips - Finish / Edit (requiere permiso)
          {
            element: <PermissionRoute module="trips" action="update" />,
            children: [
              {
                path: "/trips/:id/finish",
                element: withSuspense(FinishTripPage),
              },
            ],
          },
          // Trips - Edit (requiere permiso)
          {
            element: <PermissionRoute module="trips" action="update" />,
            children: [
              {
                path: "/trips/:id/edit",
                element: withSuspense(TripFormPage),
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
              {
                path: "/vehicles/:id/edit",
                element: withSuspense(EditVehiclePage),
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
                element: withSuspense(EmployeeFormPage),
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
              {
                path: "/clients/:id/edit",
                element: withSuspense(ClientEditPage),
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
          // Módulo: Reports (Reportes)
          // ========================================
          {
            element: <ModuleRoute module="reports" />,
            children: [
              // {
              //   path: "/reports",
              //   element: withSuspense(ReportsPage),
              // },
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
