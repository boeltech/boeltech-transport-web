import { createBrowserRouter } from "react-router-dom";
import { lazy, Suspense } from "react";

// ============================================
// Guards
// ============================================
import {
  PrivateRoute,
  ModuleRoute,
  PermissionRoute,
  AdminRoute,
} from "@app/router";

// ============================================
// Permisos
// ============================================
import { PERMISSIONS } from "@features/permissions";

// ============================================
// Layouts
// ============================================
import { AppLayout } from "@widgets/layout/ui/AppLayout";
import { AuthLayout } from "@widgets/layout/ui/AuthLayout";

// ============================================
// Loading Fallback
// ============================================
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

// ============================================
// Helper para envolver páginas con Suspense
// ============================================
const withSuspense = (Component: React.LazyExoticComponent<any>) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
);

// ============================================
// Lazy Loading de Páginas
// Cada página se carga solo cuando se necesita
// ============================================

// Root & Landing
const RootRedirect = lazy(() => import("@pages/root"));
const LandingPage = lazy(() => import("@pages/landing"));

// Auth
const LoginPage = lazy(() => import("@pages/auth/login"));
// const ForgotPasswordPage = lazy(() => import("@pages/auth/forgot-password"));
// const ResetPasswordPage = lazy(() => import("@pages/auth/reset-password"));

// Dashboard
// const DashboardPage = lazy(() => import("@pages/dashboard"));

// Fleet
// const VehicleListPage = lazy(() => import("@pages/fleet/vehicles"));
// const VehicleDetailPage = lazy(() => import("@pages/fleet/vehicles/detail"));
// const VehicleCreatePage = lazy(() => import("@pages/fleet/vehicles/create"));
// const DriverListPage = lazy(() => import("@pages/fleet/drivers"));
// const MaintenanceListPage = lazy(() => import("@pages/fleet/maintenance"));
// const FuelLogPage = lazy(() => import("@pages/fleet/fuel"));

// Operations
// const TripListPage = lazy(() => import("@pages/operations/trips"));
// const TripDetailPage = lazy(() => import("@pages/operations/trips/detail"));
// const TripCreatePage = lazy(() => import("@pages/operations/trips/create"));

// Clients
// const ClientListPage = lazy(() => import("@pages/clients"));
// const ClientDetailPage = lazy(() => import("@pages/clients/detail"));

// Finance
// const InvoiceListPage = lazy(() => import("@pages/finance/invoicing"));
// const InvoiceCreatePage = lazy(() => import("@pages/finance/invoicing/create"));
// const ExpenseListPage = lazy(() => import("@pages/finance/expenses"));
// const PaymentListPage = lazy(() => import("@pages/finance/payments"));

// HR
// const EmployeeListPage = lazy(() => import("@pages/hr/employees"));
// const PayrollPage = lazy(() => import("@pages/hr/payroll"));

// Admin
// const UserListPage = lazy(() => import("@pages/admin/users"));
// const RolePermissionsPage = lazy(() => import("@pages/admin/roles"));
// const AuditLogPage = lazy(() => import("@pages/admin/audit"));
// const SettingsPage = lazy(() => import("@pages/admin/settings"));

// Errors
const NotFoundPage = lazy(() => import("@pages/errors/not-found"));
const ForbiddenPage = lazy(() => import("@pages/errors/forbidden"));
const ServerErrorPage = lazy(() => import("@pages/errors/server-error"));
// const MaintenancePage = lazy(() => import('@pages/errors/maintenance'));

// ============================================
// Definición de Rutas
// ============================================
export const router = createBrowserRouter([
  // ==========================================
  // Ruta Raíz - Redirect dinámico
  // ==========================================
  {
    path: "/",
    element: withSuspense(RootRedirect),
  },

  // ==========================================
  // Landing Page (Pública)
  // ==========================================
  {
    path: "/welcome",
    element: withSuspense(LandingPage),
  },

  // ==========================================
  // Rutas Públicas (Auth)
  // ==========================================
  {
    element: <AuthLayout />,
    children: [
      {
        path: "/login",
        element: withSuspense(LoginPage),
      },
    ],
    // children: [
    //   {
    //     path: "/login",
    //     element: withSuspense(LoginPage),
    //   },
    //   {
    //     path: "/forgot-password",
    //     element: withSuspense(ForgotPasswordPage),
    //   },
    //   {
    //     path: "/reset-password",
    //     element: withSuspense(ResetPasswordPage),
    //   },
    // ],
  },

  // ==========================================
  // Rutas Privadas (requieren autenticación)
  // ==========================================
  {
    element: <PrivateRoute />, // Guard: verifica autenticación
    children: [
      {
        element: <AppLayout />, // Layout con sidebar, header, etc.
        children: [],
        // children: [
        //   // Redirect raíz a dashboard
        //   {
        //     path: "/",
        //     element: <Navigate to="/dashboard" replace />,
        //   },

        //   // Dashboard - todos los usuarios autenticados
        //   {
        //     path: "/dashboard",
        //     element: withSuspense(DashboardPage),
        //   },

        //   // ========================================
        //   // Módulo: Fleet (Flota)
        //   // ========================================
        //   {
        //     element: <ModuleRoute module="fleet" />,
        //     children: [
        //       // Vehículos - Lectura
        //       {
        //         path: "/fleet/vehicles",
        //         element: withSuspense(VehicleListPage),
        //       },
        //       {
        //         path: "/fleet/vehicles/:id",
        //         element: withSuspense(VehicleDetailPage),
        //       },
        //       // Vehículos - Escritura (requiere permiso)
        //       {
        //         element: (
        //           <PermissionRoute permission={PERMISSIONS.VEHICLES.WRITE} />
        //         ),
        //         children: [
        //           {
        //             path: "/fleet/vehicles/new",
        //             element: withSuspense(VehicleCreatePage),
        //           },
        //           {
        //             path: "/fleet/vehicles/:id/edit",
        //             element: withSuspense(VehicleCreatePage), // Mismo componente, modo edición
        //           },
        //         ],
        //       },
        //       // Conductores
        //       {
        //         path: "/fleet/drivers",
        //         element: withSuspense(DriverListPage),
        //       },
        //       // Mantenimiento
        //       {
        //         path: "/fleet/maintenance",
        //         element: withSuspense(MaintenanceListPage),
        //       },
        //       // Combustible
        //       {
        //         path: "/fleet/fuel",
        //         element: withSuspense(FuelLogPage),
        //       },
        //     ],
        //   },

        //   // ========================================
        //   // Módulo: Operations (Operaciones)
        //   // ========================================
        //   {
        //     element: <ModuleRoute module="operations" />,
        //     children: [
        //       {
        //         path: "/operations/trips",
        //         element: withSuspense(TripListPage),
        //       },
        //       {
        //         path: "/operations/trips/:id",
        //         element: withSuspense(TripDetailPage),
        //       },
        //       {
        //         element: (
        //           <PermissionRoute permission={PERMISSIONS.TRIPS.WRITE} />
        //         ),
        //         children: [
        //           {
        //             path: "/operations/trips/new",
        //             element: withSuspense(TripCreatePage),
        //           },
        //         ],
        //       },
        //     ],
        //   },

        //   // ========================================
        //   // Módulo: Clients (Clientes)
        //   // ========================================
        //   {
        //     element: <ModuleRoute module="clients" />,
        //     children: [
        //       {
        //         path: "/clients",
        //         element: withSuspense(ClientListPage),
        //       },
        //       {
        //         path: "/clients/:id",
        //         element: withSuspense(ClientDetailPage),
        //       },
        //     ],
        //   },

        //   // ========================================
        //   // Módulo: Finance (Finanzas)
        //   // ========================================
        //   {
        //     element: <ModuleRoute module="finance" />,
        //     children: [
        //       // Facturación
        //       {
        //         path: "/finance/invoices",
        //         element: withSuspense(InvoiceListPage),
        //       },
        //       {
        //         element: (
        //           <PermissionRoute permission={PERMISSIONS.INVOICES.WRITE} />
        //         ),
        //         children: [
        //           {
        //             path: "/finance/invoices/new",
        //             element: withSuspense(InvoiceCreatePage),
        //           },
        //         ],
        //       },
        //       // Gastos
        //       {
        //         path: "/finance/expenses",
        //         element: withSuspense(ExpenseListPage),
        //       },
        //       // Pagos
        //       {
        //         path: "/finance/payments",
        //         element: withSuspense(PaymentListPage),
        //       },
        //     ],
        //   },

        //   // ========================================
        //   // Módulo: HR (Recursos Humanos)
        //   // ========================================
        //   {
        //     element: <ModuleRoute module="hr" />,
        //     children: [
        //       {
        //         path: "/hr/employees",
        //         element: withSuspense(EmployeeListPage),
        //       },
        //       {
        //         path: "/hr/payroll",
        //         element: withSuspense(PayrollPage),
        //       },
        //     ],
        //   },

        //   // ========================================
        //   // Módulo: Admin (Solo Administradores)
        //   // ========================================
        //   {
        //     element: <AdminRoute />,
        //     children: [
        //       {
        //         path: "/admin/users",
        //         element: withSuspense(UserListPage),
        //       },
        //       {
        //         path: "/admin/roles",
        //         element: withSuspense(RolePermissionsPage),
        //       },
        //       {
        //         path: "/admin/audit",
        //         element: withSuspense(AuditLogPage),
        //       },
        //       {
        //         path: "/admin/settings",
        //         element: withSuspense(SettingsPage),
        //       },
        //     ],
        //   },
        // ],
      },
    ],
  },

  // ==========================================
  // Páginas de Error
  // ==========================================
  {
    path: "/forbidden",
    element: withSuspense(ForbiddenPage),
  },
  {
    path: "*",
    element: withSuspense(NotFoundPage),
  },
]);
