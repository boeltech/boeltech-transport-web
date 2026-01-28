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
  // Navigate
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
  AdminRoute,
} from "./guards";

// ============================================
// Layouts
// ============================================
import { AppLayout } from "@widgets/layout";
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
  Component: React.LazyExoticComponent<React.ComponentType<any>>,
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

// Dashboard
const DashboardPage = lazy(() => import("@/pages/dashboard"));

// Trips
const TripsListPage = lazy(() => import("@pages/trips"));
const TripDetailPage = lazy(() => import("@/pages/trips/detail"));
const TripCreatePage = lazy(() => import("@/pages/trips/create"));
// const TripEditPage = lazy(() => import("@/pages/trips/edit"));

// Vehicles
// const VehiclesListPage = lazy(() => import("@/pages/vehicles"));
// const VehicleDetailPage = lazy(() => import("@/pages/vehicles/detail"));
// const VehicleCreatePage = lazy(() => import("@/pages/vehicles/create"));

// Drivers
// const DriversListPage = lazy(() => import("@/pages/drivers"));
// const DriverDetailPage = lazy(() => import("@/pages/drivers/detail"));
// const DriverCreatePage = lazy(() => import("@/pages/drivers/create"));

// Clients
// const ClientsListPage = lazy(() => import("@/pages/clients"));
// const ClientDetailPage = lazy(() => import("@/pages/clients/detail"));
// const ClientCreatePage = lazy(() => import("@/pages/clients/create"));

// Maintenance
// const MaintenanceListPage = lazy(() => import("@/pages/maintenance"));
// const MaintenanceCreatePage = lazy(() => import("@/pages/maintenance/create"));

// Fuel
// const FuelListPage = lazy(() => import("@/pages/fuel"));
// const FuelCreatePage = lazy(() => import("@/pages/fuel/create"));

// Invoices
// const InvoicesListPage = lazy(() => import("@/pages/invoices"));
// const InvoiceDetailPage = lazy(() => import("@/pages/invoices/detail"));
// const InvoiceCreatePage = lazy(() => import("@/pages/invoices/create"));

// Reports
// const ReportsPage = lazy(() => import("@/pages/reports"));

// Users (Admin)
// const UsersListPage = lazy(() => import("@/pages/users"));
// const UserCreatePage = lazy(() => import("@/pages/users/create"));

// Settings (Admin)
// const SettingsPage = lazy(() => import("@/pages/settings"));

// Profile
// const ProfilePage = lazy(() => import("@/pages/profile"));

// Errors
const NotFoundPage = lazy(() => import("@/pages/errors/not-found"));
const ForbiddenPage = lazy(() => import("@/pages/errors/forbidden"));
const ServerErrorPage = lazy(() => import("@/pages/errors/server-error"));
const MaintenancePage = lazy(() => import("@/pages/errors/maintenance"));

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

          // ========================================
          // Profile (todos los autenticados)
          // ========================================
          // {
          //   path: "/profile",
          //   element: withSuspense(ProfilePage),
          // },

          // ========================================
          // Módulo: Trips (Viajes)
          // ========================================
          {
            element: <ModuleRoute module="trips" />,
            children: [
              {
                path: "/trips",
                element: withSuspense(TripsListPage),
              },
              {
                path: "/trips/:id",
                element: withSuspense(TripDetailPage),
              },
            ],
          },
          // Trips - Create (requiere permiso)
          {
            element: <PermissionRoute module="trips" action="create" />,
            children: [
              {
                path: "/trips/new",
                element: withSuspense(TripCreatePage),
              },
            ],
          },
          // Trips - Edit (requiere permiso)
          // {
          //   element: <PermissionRoute module="trips" action="update" />,
          //   children: [
          //     {
          //       path: "/trips/:id/edit",
          //       element: withSuspense(TripEditPage),
          //     },
          //   ],
          // },

          // ========================================
          // Módulo: Vehicles (Vehículos)
          // ========================================
          {
            element: <ModuleRoute module="vehicles" />,
            children: [
              // {
              //   path: "/vehicles",
              //   element: withSuspense(VehiclesListPage),
              // },
              // {
              //   path: "/vehicles/:id",
              //   element: withSuspense(VehicleDetailPage),
              // },
            ],
          },
          {
            element: <PermissionRoute module="vehicles" action="create" />,
            children: [
              // {
              //   path: "/vehicles/new",
              //   element: withSuspense(VehicleCreatePage),
              // },
            ],
          },

          // ========================================
          // Módulo: Drivers (Conductores)
          // ========================================
          {
            element: <ModuleRoute module="drivers" />,
            children: [
              // {
              //   path: "/drivers",
              //   element: withSuspense(DriversListPage),
              // },
              // {
              //   path: "/drivers/:id",
              //   element: withSuspense(DriverDetailPage),
              // },
            ],
          },
          {
            element: <PermissionRoute module="drivers" action="create" />,
            children: [
              // {
              //   path: "/drivers/new",
              //   element: withSuspense(DriverCreatePage),
              // },
            ],
          },

          // ========================================
          // Módulo: Clients (Clientes)
          // ========================================
          {
            element: <ModuleRoute module="clients" />,
            children: [
              // {
              //   path: "/clients",
              //   element: withSuspense(ClientsListPage),
              // },
              // {
              //   path: "/clients/:id",
              //   element: withSuspense(ClientDetailPage),
              // },
            ],
          },
          {
            element: <PermissionRoute module="clients" action="create" />,
            children: [
              // {
              //   path: "/clients/new",
              //   element: withSuspense(ClientCreatePage),
              // },
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
          // Módulo: Invoices (Facturación)
          // ========================================
          {
            element: <ModuleRoute module="invoices" />,
            children: [
              // {
              //   path: "/invoices",
              //   element: withSuspense(InvoicesListPage),
              // },
              // {
              //   path: "/invoices/:id",
              //   element: withSuspense(InvoiceDetailPage),
              // },
            ],
          },
          {
            element: <PermissionRoute module="invoices" action="create" />,
            children: [
              // {
              //   path: "/invoices/new",
              //   element: withSuspense(InvoiceCreatePage),
              // },
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
              // {
              //   path: "/users",
              //   element: withSuspense(UsersListPage),
              // },
            ],
          },
          {
            element: <PermissionRoute module="users" action="create" />,
            children: [
              // {
              //   path: "/users/new",
              //   element: withSuspense(UserCreatePage),
              // },
            ],
          },

          // ========================================
          // Módulo: Settings (Admin)
          // ========================================
          {
            element: <AdminRoute />,
            children: [
              // {
              //   path: "/settings",
              //   element: withSuspense(SettingsPage),
              // },
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
